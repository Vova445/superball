import asyncio
import time
from .engine import ServerPlayer, ServerBall

class GameRoom:
    def __init__(self, room_id):
        self.room_id = room_id
        self.players = {} # socket_id -> ServerPlayer
        self.ball = ServerBall(600, 350)
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
        self.reward_info = None

    async def add_player(self, socket_id, user_id=None):
        # Assign starting position
        is_home = len(self.players) % 2 == 0
        x = 400 if is_home else 800
        player = ServerPlayer(socket_id, x, 350)
        player.user_id = user_id
        player.is_home = is_home
        
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

        # Update physics only in PLAYING or OVERTIME states
        if self.state in ["PLAYING", "OVERTIME"]:
            # 1. Update Players
            for sid, player in self.players.items():
                player.update(self.inputs[sid], self.dt)

            # 2. Update Ball
            self.ball.update(self.dt)

            # 3. Handle Player-Ball Collisions
            for player in self.players.values():
                dist_sq = (player.x - self.ball.x)**2 + (player.y - self.ball.y)**2
                min_dist = player.radius + self.ball.radius
                
                if dist_sq < min_dist**2:
                    self.resolve_collision(player, self.ball)

            # 4. Check Goals
            self.check_goals()

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
        asyncio.create_task(self.save_match_result_to_db())

    async def save_match_result_to_db(self):
        if self.match_saved:
            return
        self.match_saved = True
        
        home_user_id = None
        away_user_id = None
        winner_user_id = None
        
        for p in self.players.values():
            if getattr(p, 'is_home', False):
                home_user_id = getattr(p, 'user_id', None)
            else:
                away_user_id = getattr(p, 'user_id', None)
                
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
                    
                home_old_mmr = home_user.mmr if (home_user and home_user.mmr is not None) else 1000
                away_old_mmr = away_user.mmr if (away_user and away_user.mmr is not None) else 1000
                
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
                    
                home_new_mmr = int(round(home_old_mmr + k_home * (result_home - expected_home)))
                away_new_mmr = int(round(away_old_mmr + k_away * (result_away - expected_away)))
                
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
                    
                match_record = Match(
                    home_player_id=str(home_user_id) if home_user_id else None,
                    away_player_id=str(away_user_id) if away_user_id else None,
                    home_score=self.score["home"],
                    away_score=self.score["away"],
                    winner_id=str(winner_user_id) if winner_user_id else None,
                    duration=180 - self.timer if self.state == "FINISHED" else 180
                )
                session.add(match_record)
                await session.commit()
                
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
        # Simple impulse based on position difference (matching JS logic)
        dx = ball.x - player.x
        dy = ball.y - player.y
        dist = math.sqrt(dx**2 + dy**2)
        if dist == 0: return

        nx, ny = dx/dist, dy/dist # Normal vector
        
        # Simple kick force (can be expanded with exact conservation laws)
        force = getattr(player, 'kick_force', 170.0)
        
        ball.vx = nx * force + player.vx * 0.4
        ball.vy = ny * force + player.vy * 0.4

    def handle_ball_hit(self, socket_id, hit_data):
        if socket_id not in self.players:
            return False
        
        player = self.players[socket_id]
        
        # Validate distance between player and ball
        dx = self.ball.x - player.x
        dy = self.ball.y - player.y
        dist = math.sqrt(dx**2 + dy**2)
        max_dist = player.radius + self.ball.radius + 20.0  # 20px threshold for network latency
        
        if dist > max_dist:
            print(f"Hit validation failed for player {socket_id}. Distance {dist} > max_dist {max_dist}")
            return False
            
        # Extract and normalize direction
        dir_x = hit_data.get('dx', 0.0)
        dir_y = hit_data.get('dy', 0.0)
        length = math.sqrt(dir_x**2 + dir_y**2)
        if length > 0:
            dir_x /= length
            dir_y /= length
        else:
            if dist > 0:
                dir_x, dir_y = dx / dist, dy / dist
            else:
                dir_x, dir_y = 1.0, 0.0
                
        # Calculate force
        force = getattr(player, 'kick_force', 170.0)
        
        # Apply velocity change to ball
        self.ball.vx = dir_x * force + player.vx * 0.4
        self.ball.vy = dir_y * force + player.vy * 0.4
        print(f"Ball authoritatively hit by {socket_id} via socket event. vx: {self.ball.vx}, vy: {self.ball.vy}")
        return True

    def check_goals(self):
        if self.ball.x < 35 and 250 < self.ball.y < 450:
            self.score["away"] += 1
            if self.state == "OVERTIME":
                self.state = "FINISHED"
                self.handle_match_finished()
            else:
                self.reset_positions()
        elif self.ball.x > 1165 and 250 < self.ball.y < 450:
            self.score["home"] += 1
            if self.state == "OVERTIME":
                self.state = "FINISHED"
                self.handle_match_finished()
            else:
                self.reset_positions()

    def reset_positions(self):
        self.ball.x, self.ball.y = 600, 350
        self.ball.vx, self.ball.vy = 0, 0
        # Reset players to their half
        for sid, player in self.players.items():
            player.vx, player.vy = 0, 0
            player.x = 400 if getattr(player, 'is_home', True) else 800
            player.y = 350

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
            "reward_info": self.reward_info
        }

import math
