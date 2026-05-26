import asyncio
import time
from .engine import ServerPlayer, ServerBall
from .arenas import get_arena

class GameRoom:
    def __init__(self, room_id, arena_id=None):
        self.room_id = room_id
        self.arena_id = arena_id
        self.arena = get_arena(arena_id)
        self.play_bounds = self.arena["play_bounds"]
        self.players = {} # socket_id -> ServerPlayer
        self.ball = ServerBall(600, 350, self.play_bounds)
        self.score = {"home": 0, "away": 0}
        
        self.inputs = {} 
        self.is_running = False
        self.tick_rate = 60
        self.dt = 1.0 / self.tick_rate
        self.tick_count = 0
        
        # Match State Machine properties
        self.state = "LOBBY" # LOBBY, COUNTDOWN, PLAYING, OVERTIME, FINISHED
        self.timer = 180
        self.countdown = 3
        self.tick_to_next_sec = 60
        self.match_saved = False
        self.match_save_started = False
        self.home_user_id = None
        self.away_user_id = None
        self.forfeit_winner_user_id = None
        self.match_started_at = None
        self.reward_info = None

    async def add_player(self, socket_id, user_id=None):
        # Assign starting position
        is_home = len(self.players) % 2 == 0
        x = self.play_bounds["left"] + 240 if is_home else self.play_bounds["right"] - 240
        y = (self.play_bounds["top"] + self.play_bounds["bottom"]) / 2
        player = ServerPlayer(socket_id, x, y, self.play_bounds)
        player.user_id = user_id
        player.is_home = is_home
        if user_id:
            if is_home:
                self.home_user_id = str(user_id)
            else:
                self.away_user_id = str(user_id)
        
        # Apply stats bonus from equipped items
        if user_id:
            from app.db.session import async_session
            from app.models.item import Item, UserInventory
            from sqlalchemy.future import select
            import json
            
            try:
                async with async_session() as session:
                    result = await session.execute(
                        select(Item)
                        .join(UserInventory, UserInventory.item_id == Item.id)
                        .where(
                            (UserInventory.user_id == int(user_id)) &
                            (UserInventory.equipped == True)
                        )
                    )
                    equipped_items = result.scalars().all()
                    
                    for item in equipped_items:
                        if item.stats_bonus:
                            try:
                                bonus = json.loads(item.stats_bonus)
                                # Speed bonus
                                if "speed" in bonus:
                                    sb = float(bonus["speed"])
                                    player.max_speed_normal += sb
                                    player.max_speed_sprint += sb
                                # Kick force bonus
                                if "kick" in bonus:
                                    kb = float(bonus["kick"])
                                    if not hasattr(player, 'kick_force'):
                                        player.kick_force = 170.0
                                    player.kick_force += kb
                            except Exception as e:
                                print(f"Error parsing stats_bonus for item {item.id}: {e}")
            except Exception as e:
                print(f"Error applying stats_bonus for user {user_id}: {e}")

        self.players[socket_id] = player
        
        self.inputs[socket_id] = {
            "up": False, "down": False, "left": False, "right": False,
            "sprint": False, "kick": False
        }

    def remove_player(self, socket_id):
        if socket_id in self.players:
            player = self.players[socket_id]
            user_id = getattr(player, 'user_id', None)
            is_home = getattr(player, 'is_home', False)
            if self.state in ["COUNTDOWN", "PLAYING", "OVERTIME"] and not self.match_save_started:
                opponent_user_id = self.away_user_id if is_home else self.home_user_id
                self.forfeit_winner_user_id = opponent_user_id if opponent_user_id else None
                self.state = "FINISHED"
                self.handle_match_finished()
                print(f"Match {self.room_id} ended by forfeit. Leaver: {user_id}, winner: {self.forfeit_winner_user_id}")
            del self.players[socket_id]
            del self.inputs[socket_id]

    def set_input(self, socket_id, input_data):
        if socket_id in self.inputs:
            self.inputs[socket_id].update(input_data)

    async def start(self, broadcast_callback):
        self.is_running = True
        print(f"Game Room {self.room_id} started at {self.tick_rate} TPS")
        
        while self.is_running:
            start_time = time.time()
            
            self.tick_count += 1
            self.tick()
            
            # Prepare state for broadcast
            state = self.get_state()
            state["tick"] = self.tick_count
            await broadcast_callback(state)
            
            # Precise sleep for 60 TPS
            elapsed = time.time() - start_time
            sleep_time = max(0, self.dt - elapsed)
            await asyncio.sleep(sleep_time)

    def tick(self):
        # State machine tick update
        self.update_state_machine()

        if self.state in ["LOBBY", "COUNTDOWN"]:
            self.simulate_physics()
        elif self.state in ["PLAYING", "OVERTIME"]:
            self.simulate_physics()
            self.check_goals()

    def simulate_physics(self):
        substeps = 4
        sub_dt = self.dt / substeps

        for _substep in range(substeps):
            # 1. Update Players
            for sid, player in self.players.items():
                player.update(self.inputs[sid], sub_dt)

            # 2. Update Ball
            self.ball.update(sub_dt)

            # 3. Handle Player-Player Collisions
            player_list = list(self.players.values())
            for i in range(len(player_list)):
                for j in range(i + 1, len(player_list)):
                    self.resolve_player_collision(player_list[i], player_list[j])

            # 4. Handle Player-Ball Collisions. Iterate so a ball trapped
            # against a wall pushes the player back instead of tunneling.
            contact_skin = 1.5
            for _ in range(3):
                had_collision = False
                for player in self.players.values():
                    if self.should_resolve_player_ball(player, contact_skin):
                        self.resolve_collision(player, self.ball)
                        had_collision = True

                self.clamp_ball_to_bounds(stop_inward_velocity=True)
                if not had_collision:
                    break

    def should_resolve_player_ball(self, player, contact_skin):
        min_dist = player.radius + self.ball.radius + contact_skin
        current_dx = self.ball.x - player.x
        current_dy = self.ball.y - player.y
        if current_dx * current_dx + current_dy * current_dy < min_dist * min_dist:
            return True

        start_dx = self.ball.prev_x - player.prev_x
        start_dy = self.ball.prev_y - player.prev_y
        end_dx = current_dx
        end_dy = current_dy
        move_dx = end_dx - start_dx
        move_dy = end_dy - start_dy
        move_len_sq = move_dx * move_dx + move_dy * move_dy
        if move_len_sq <= 0:
            return False

        t = -((start_dx * move_dx) + (start_dy * move_dy)) / move_len_sq
        t = max(0.0, min(1.0, t))
        closest_x = start_dx + move_dx * t
        closest_y = start_dy + move_dy * t
        return closest_x * closest_x + closest_y * closest_y < min_dist * min_dist

    def update_state_machine(self):
        if self.state == "LOBBY":
            # Wait for 2 players to start the match countdown
            if len(self.players) >= 2:
                self.state = "COUNTDOWN"
                self.countdown = 3
                self.tick_to_next_sec = 60
        
        elif self.state == "COUNTDOWN":
            self.tick_to_next_sec -= 1
            if self.tick_to_next_sec <= 0:
                self.countdown -= 1
                self.tick_to_next_sec = 60
                if self.countdown <= 0:
                    self.state = "PLAYING"
                    self.match_started_at = time.time()
                    self.timer = 180  # 3 minutes
                    self.tick_to_next_sec = 60
                    self.reset_positions()
        
        elif self.state == "PLAYING":
            self.tick_to_next_sec -= 1
            if self.tick_to_next_sec <= 0:
                self.timer -= 1
                self.tick_to_next_sec = 60
                if self.timer <= 0:
                    self.timer = 0
                    if self.score["home"] == self.score["away"]:
                        self.state = "OVERTIME"
                    else:
                        self.state = "FINISHED"
                        self.handle_match_finished()

    def handle_match_finished(self):
        if self.match_save_started:
            return
        self.match_save_started = True
        asyncio.create_task(self.save_match_result_to_db())

    async def save_match_result_to_db(self):
        if self.match_saved:
            return
        
        home_user_id = self.home_user_id
        away_user_id = self.away_user_id
        winner_user_id = self.forfeit_winner_user_id
        
        for p in self.players.values():
            if getattr(p, 'is_home', False) and not home_user_id:
                home_user_id = getattr(p, 'user_id', None)
            elif not getattr(p, 'is_home', False) and not away_user_id:
                away_user_id = getattr(p, 'user_id', None)
                
        if not winner_user_id:
            if self.score["home"] > self.score["away"]:
                winner_user_id = home_user_id
            elif self.score["away"] > self.score["home"]:
                winner_user_id = away_user_id
            
        rewards = {}
        is_draw = (self.score["home"] == self.score["away"])

        if home_user_id:
            is_winner = (home_user_id == winner_user_id) if winner_user_id else False
            xp_reward = 100 if is_winner else (50 if is_draw else 30)
            goal_bonus = self.score["home"] * 10
            rewards[home_user_id] = {
                "coins": 100 if is_winner else (60 if is_draw else 40),
                "xp": xp_reward + goal_bonus,
                "is_winner": is_winner,
                "is_draw": is_draw
            }
        if away_user_id:
            is_winner = (away_user_id == winner_user_id) if winner_user_id else False
            xp_reward = 100 if is_winner else (50 if is_draw else 30)
            goal_bonus = self.score["away"] * 10
            rewards[away_user_id] = {
                "coins": 100 if is_winner else (60 if is_draw else 40),
                "xp": xp_reward + goal_bonus,
                "is_winner": is_winner,
                "is_draw": is_draw
            }
            
        self.reward_info = {
            "winner_id": winner_user_id,
            "rewards": rewards
        }
        
        from app.db.session import async_session
        from app.models.match import Match
        from app.models.user import User
        from app.models.user_progression import UserProgression
        from sqlalchemy.future import select
        import random
        
        try:
            async with async_session() as session:
                home_user = None
                away_user = None
                
                if home_user_id:
                    result = await session.execute(select(User).where(User.id == int(home_user_id)))
                    home_user = result.scalars().first()
                if away_user_id:
                    result = await session.execute(select(User).where(User.id == int(away_user_id)))
                    away_user = result.scalars().first()
                    
                home_old_mmr = home_user.mmr if (home_user and home_user.mmr is not None) else 0
                away_old_mmr = away_user.mmr if (away_user and away_user.mmr is not None) else 0
                
                # Smurf protection: Count user's previous matches to scale K-factor
                async def get_k_factor(user_id):
                    if not user_id:
                        return 32
                    q = await session.execute(
                        select(Match).where(
                            (Match.home_player_id == str(user_id)) | 
                            (Match.away_player_id == str(user_id))
                        )
                    )
                    matches_played = len(q.scalars().all())
                    return 64 if matches_played < 10 else 32
                    
                k_home = await get_k_factor(home_user_id)
                k_away = await get_k_factor(away_user_id)
                
                expected_home = 1.0 / (1.0 + 10.0 ** ((away_old_mmr - home_old_mmr) / 400.0))
                expected_away = 1.0 / (1.0 + 10.0 ** ((home_old_mmr - away_old_mmr) / 400.0))
                
                if self.score["home"] > self.score["away"]:
                    result_home = 1.0
                    result_away = 0.0
                elif self.score["away"] > self.score["home"]:
                    result_home = 0.0
                    result_away = 1.0
                else:
                    result_home = 0.5
                    result_away = 0.5
                    
                home_new_mmr = max(0, int(round(home_old_mmr + k_home * (result_home - expected_home))))
                away_new_mmr = max(0, int(round(away_old_mmr + k_away * (result_away - expected_away))))
                
                def get_rank(mmr):
                    if mmr < 1000:
                        return "Bronze"
                    elif mmr < 1500:
                        return "Silver"
                    elif mmr < 2000:
                        return "Gold"
                    else:
                        return "Plat"
                        
                home_delta = 0
                away_delta = 0
                
                if home_user:
                    home_delta = home_new_mmr - home_old_mmr
                    home_user.mmr = home_new_mmr
                if away_user:
                    away_delta = away_new_mmr - away_old_mmr
                    away_user.mmr = away_new_mmr

                # Progression handling function
                async def update_user_progression(user_id, xp_earned, coins_earned):
                    if not user_id:
                        return None, False, 1, []
                    res = await session.execute(select(UserProgression).where(UserProgression.user_id == int(user_id)))
                    prog = res.scalars().first()
                    if not prog:
                        prog = UserProgression(user_id=int(user_id), level=1, xp=0, total_xp=0, coins=100, gems=10)
                        session.add(prog)
                        await session.flush()
                        
                    old_level = prog.level
                    prog.xp += xp_earned
                    prog.total_xp += xp_earned
                    prog.coins += coins_earned
                    
                    leveled_up = False
                    rewards_list = []
                    
                    while True:
                        xp_needed = prog.level * 200
                        if prog.xp >= xp_needed:
                            prog.xp -= xp_needed
                            prog.level += 1
                            leveled_up = True
                            
                            # Roll reward: 45% coins, 45% gems, 10% skin
                            roll = random.random()
                            if roll < 0.45:
                                amt = prog.level * 100
                                prog.coins += amt
                                rewards_list.append({"type": "coins", "amount": amt})
                            elif roll < 0.90:
                                amt = prog.level * 10
                                prog.gems += amt
                                rewards_list.append({"type": "gems", "amount": amt})
                            else:
                                skins = ["Neon Trail", "Golden Boots", "Crimson Aura", "Fire Jersey", "Space Aura", "Glitch Ball", "Shadow Gloves"]
                                selected_skin = random.choice(skins)
                                rewards_list.append({"type": "skin", "name": selected_skin})
                        else:
                            break
                            
                    return prog, leveled_up, old_level, rewards_list

                home_prog_data = None
                if home_user_id:
                    home_prog_data = await update_user_progression(
                        home_user_id, 
                        rewards[home_user_id]["xp"], 
                        rewards[home_user_id]["coins"]
                    )
                    
                away_prog_data = None
                if away_user_id:
                    away_prog_data = await update_user_progression(
                        away_user_id, 
                        rewards[away_user_id]["xp"], 
                        rewards[away_user_id]["coins"]
                    )
                    
                duration = 0
                if self.match_started_at:
                    duration = max(0, int(time.time() - self.match_started_at))
                elif self.state == "FINISHED":
                    duration = max(0, 180 - self.timer)

                match_record = Match(
                    home_player_id=str(home_user_id) if home_user_id else None,
                    away_player_id=str(away_user_id) if away_user_id else None,
                    home_score=self.score["home"],
                    away_score=self.score["away"],
                    winner_id=str(winner_user_id) if winner_user_id else None,
                    duration=duration
                )
                session.add(match_record)
                await session.commit()
                self.match_saved = True
                
                print(f"Match recorded in DB: ID {match_record.id}. ELO updates: Home {home_old_mmr} -> {home_new_mmr} ({home_delta:+d}), Away {away_old_mmr} -> {away_new_mmr} ({away_delta:+d})")
                
                from app.services.socket_manager import sio
                
                # Add ELO and progression update details to rewards so client can display it
                if home_user_id:
                    self.reward_info["rewards"][home_user_id].update({
                        "old_mmr": home_old_mmr,
                        "new_mmr": home_new_mmr,
                        "mmr_delta": home_delta,
                        "rank": get_rank(home_new_mmr)
                    })
                    if home_prog_data:
                        prog, leveled_up, old_level, r_list = home_prog_data
                        self.reward_info["rewards"][home_user_id].update({
                            "level": prog.level,
                            "xp_balance": prog.xp,
                            "xp_needed": prog.level * 200,
                            "total_xp": prog.total_xp,
                            "coins_balance": prog.coins,
                            "gems_balance": prog.gems,
                            "level_up": leveled_up,
                            "level_up_rewards": r_list
                        })
                        if leveled_up:
                            home_sid = next((sid for sid, p in self.players.items() if getattr(p, 'user_id', None) == home_user_id), None)
                            if home_sid:
                                await sio.emit("level_up", {
                                    "user_id": home_user_id,
                                    "old_level": old_level,
                                    "new_level": prog.level,
                                    "rewards": r_list
                                }, to=home_sid)
                                
                if away_user_id:
                    self.reward_info["rewards"][away_user_id].update({
                        "old_mmr": away_old_mmr,
                        "new_mmr": away_new_mmr,
                        "mmr_delta": away_delta,
                        "rank": get_rank(away_new_mmr)
                    })
                    if away_prog_data:
                        prog, leveled_up, old_level, r_list = away_prog_data
                        self.reward_info["rewards"][away_user_id].update({
                            "level": prog.level,
                            "xp_balance": prog.xp,
                            "xp_needed": prog.level * 200,
                            "total_xp": prog.total_xp,
                            "coins_balance": prog.coins,
                            "gems_balance": prog.gems,
                            "level_up": leveled_up,
                            "level_up_rewards": r_list
                        })
                        if leveled_up:
                            away_sid = next((sid for sid, p in self.players.items() if getattr(p, 'user_id', None) == away_user_id), None)
                            if away_sid:
                                await sio.emit("level_up", {
                                    "user_id": away_user_id,
                                    "old_level": old_level,
                                    "new_level": prog.level,
                                    "rewards": r_list
                                }, to=away_sid)
        except Exception as e:
            print(f"Failed to record match in DB: {e}")

    def resolve_collision(self, player, ball):
        dx = ball.x - player.x
        dy = ball.y - player.y
        dist = math.sqrt(dx**2 + dy**2)
        if dist == 0:
            dx, dy = 1.0, 0.0
            dist = 1.0

        min_dist = player.radius + ball.radius
        contact_skin = 1.5
        target_dist = min_dist + contact_skin
        overlap = target_dist - dist
        nx, ny = dx / dist, dy / dist

        if overlap > 0:
            before_x, before_y = ball.x, ball.y
            ball.x += nx * overlap
            ball.y += ny * overlap
            self.clamp_ball_to_bounds()

            moved_x = ball.x - before_x
            moved_y = ball.y - before_y
            moved_along_normal = max(0.0, moved_x * nx + moved_y * ny)
            remaining_overlap = overlap - moved_along_normal

            if remaining_overlap > 0:
                player.x -= nx * remaining_overlap
                player.y -= ny * remaining_overlap
                self.clamp_player_to_bounds(player)

        player_speed_along_normal = player.vx * nx + player.vy * ny
        
        if player_speed_along_normal > 0:
            # Dribble slowly: synchronise ball velocity to player speed + slow forward roll (35.0 ELO-calibrated units/sec)
            tangent_x, tangent_y = -ny, nx
            ball_tangent = ball.vx * tangent_x + ball.vy * tangent_y
            
            new_ball_normal = player_speed_along_normal + 35.0
            ball.vx = nx * new_ball_normal + tangent_x * ball_tangent
            ball.vy = ny * new_ball_normal + tangent_y * ball_tangent
        else:
            # Soft bounce restitution so the ball does not fly off on passive contact
            rel_vx = ball.vx - player.vx
            rel_vy = ball.vy - player.vy
            normal_speed = rel_vx * nx + rel_vy * ny

            if normal_speed < 0:
                inv_player_mass = 1.0 / player.mass
                inv_ball_mass = 1.0 / ball.mass
                restitution = 0.20
                impulse = -(1.0 + restitution) * normal_speed / (inv_player_mass + inv_ball_mass)

                player.vx -= nx * impulse * inv_player_mass
                player.vy -= ny * impulse * inv_player_mass
                ball.vx += nx * impulse * inv_ball_mass
                ball.vy += ny * impulse * inv_ball_mass

        # Apply realistic spin rotation from contact friction
        tangent_x, tangent_y = -ny, nx
        player_tangent_speed = player.vx * tangent_x + player.vy * tangent_y
        ball_tangent_speed = ball.vx * tangent_x + ball.vy * tangent_y
        ball.angular_velocity += (player_tangent_speed - ball_tangent_speed) * 0.015

        max_ball_speed = 760.0
        ball_speed = math.sqrt(ball.vx**2 + ball.vy**2)
        if ball_speed > max_ball_speed:
            ratio = max_ball_speed / ball_speed
            ball.vx *= ratio
            ball.vy *= ratio

    def resolve_player_collision(self, first, second):
        dx = second.x - first.x
        dy = second.y - first.y
        dist = math.sqrt(dx**2 + dy**2)
        if dist == 0:
            dx, dy = 1.0, 0.0
            dist = 1.0

        min_dist = first.radius + second.radius
        overlap = min_dist - dist
        if overlap <= 0:
            return

        nx, ny = dx / dist, dy / dist
        separation = overlap / 2.0
        first.x -= nx * separation
        first.y -= ny * separation
        second.x += nx * separation
        second.y += ny * separation

        self.clamp_player_to_bounds(first)
        self.clamp_player_to_bounds(second)

        rel_vx = second.vx - first.vx
        rel_vy = second.vy - first.vy
        normal_speed = rel_vx * nx + rel_vy * ny
        if normal_speed >= 0:
            return

        restitution = 0.15
        impulse = -(1.0 + restitution) * normal_speed / 2.0
        first.vx -= impulse * nx
        first.vy -= impulse * ny
        second.vx += impulse * nx
        second.vy += impulse * ny

    def clamp_player_to_bounds(self, player):
        min_x = player.play_bounds["left"] + player.bounds_radius_x
        max_x = player.play_bounds["right"] - player.bounds_radius_x
        min_y = player.play_bounds["top"] + player.bounds_radius_y
        max_y = player.play_bounds["bottom"] - player.bounds_radius_y
        player.x = max(min_x, min(max_x, player.x))
        player.y = max(min_y, min(max_y, player.y))

    def clamp_ball_to_bounds(self, stop_inward_velocity=False):
        min_x = self.play_bounds["left"] + self.ball.radius
        max_x = self.play_bounds["right"] - self.ball.radius
        min_y = self.play_bounds["top"] + self.ball.radius
        max_y = self.play_bounds["bottom"] - self.ball.radius

        bounce_factor = 0.72 # Realistic ELO-calibrated bounce restitution

        if self.ball.x < min_x:
            self.ball.x = min_x
            if self.ball.vx < 0:
                self.ball.vx = -self.ball.vx * bounce_factor
        elif self.ball.x > max_x:
            self.ball.x = max_x
            if self.ball.vx > 0:
                self.ball.vx = -self.ball.vx * bounce_factor

        if self.ball.y < min_y:
            self.ball.y = min_y
            if self.ball.vy < 0:
                self.ball.vy = -self.ball.vy * bounce_factor
        elif self.ball.y > max_y:
            self.ball.y = max_y
            if self.ball.vy > 0:
                self.ball.vy = -self.ball.vy * bounce_factor

    def cancel_ball_velocity_into_walls(self):
        pass

    def handle_ball_hit(self, socket_id, hit_data):
        if socket_id not in self.players:
            return False
        
        player = self.players[socket_id]
        
        # Validate distance between player and ball
        dx = self.ball.x - player.x
        dy = self.ball.y - player.y
        dist = math.sqrt(dx**2 + dy**2)
        max_dist = player.radius + self.ball.radius + 18.0  # input forgiveness for network latency
        
        if dist > max_dist:
            print(f"Hit validation failed for player {socket_id}. Distance {dist} > max_dist {max_dist}")
            return False
            
        if dist > 0:
            dir_x, dir_y = dx / dist, dy / dist
        else:
            dir_x, dir_y = 1.0, 0.0
                
        # Calculate force
        force = getattr(player, 'kick_force', 170.0)
        
        # Apply velocity change to ball
        min_dist = player.radius + self.ball.radius + 1.5
        if dist < min_dist:
            self.ball.x = player.x + dir_x * min_dist
            self.ball.y = player.y + dir_y * min_dist
            self.clamp_ball_to_bounds(stop_inward_velocity=True)
        current_along_kick = self.ball.vx * dir_x + self.ball.vy * dir_y
        added_speed = max(force - max(0.0, current_along_kick), force * 0.35)
        self.ball.vx += dir_x * added_speed
        self.ball.vy += dir_y * added_speed

        ball_speed = math.sqrt(self.ball.vx**2 + self.ball.vy**2)
        max_ball_speed = 760.0
        if ball_speed > max_ball_speed:
            ratio = max_ball_speed / ball_speed
            self.ball.vx *= ratio
            self.ball.vy *= ratio
        self.cancel_ball_velocity_into_walls()
        print(f"Ball authoritatively hit by {socket_id} via socket event. vx: {self.ball.vx}, vy: {self.ball.vy}")
        return True

    def check_goals(self):
        left_goal_line = self.play_bounds["left"] + self.ball.radius
        right_goal_line = self.play_bounds["right"] - self.ball.radius
        goal_top = self.play_bounds["top"] + 180
        goal_bottom = self.play_bounds["bottom"] - 180

        if self.ball.x <= left_goal_line and goal_top < self.ball.y < goal_bottom:
            self.score["away"] += 1
            if self.state == "OVERTIME":
                self.state = "FINISHED"
                self.handle_match_finished()
            else:
                self.reset_positions()
        elif self.ball.x >= right_goal_line and goal_top < self.ball.y < goal_bottom:
            self.score["home"] += 1
            if self.state == "OVERTIME":
                self.state = "FINISHED"
                self.handle_match_finished()
            else:
                self.reset_positions()

    def reset_positions(self):
        center_x = (self.play_bounds["left"] + self.play_bounds["right"]) / 2
        center_y = (self.play_bounds["top"] + self.play_bounds["bottom"]) / 2
        self.ball.x, self.ball.y = center_x, center_y
        self.ball.prev_x, self.ball.prev_y = center_x, center_y
        self.ball.vx, self.ball.vy = 0, 0
        # Reset players to their half
        for sid, player in self.players.items():
            player.vx, player.vy = 0, 0
            player.x = self.play_bounds["left"] + 240 if getattr(player, 'is_home', True) else self.play_bounds["right"] - 240
            player.y = center_y
            player.prev_x, player.prev_y = player.x, player.y

    def get_state(self):
        return {
            "players": {
                sid: {
                    "x": p.x, 
                    "y": p.y, 
                    "stamina": p.stamina,
                    "user_id": getattr(p, "user_id", None)
                } 
                for sid, p in self.players.items()
            },
            "ball": {"x": self.ball.x, "y": self.ball.y},
            "score": self.score,
            "match_state": self.state,
            "timer": self.timer,
            "countdown": self.countdown,
            "player_count": len(self.players),
            "reward_info": self.reward_info
        }

import math
