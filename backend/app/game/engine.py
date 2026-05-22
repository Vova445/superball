import math

PLAYER_RADIUS = 22
BALL_RADIUS = 13

class Vector2:
    def __init__(self, x=0.0, y=0.0):
        self.x = x
        self.y = y

    def normalize(self):
        length = math.sqrt(self.x**2 + self.y**2)
        if length > 0:
            self.x /= length
            self.y /= length
        return self

    def length(self):
        return math.sqrt(self.x**2 + self.y**2)

    def scale(self, factor):
        self.x *= factor
        self.y *= factor
        return self

class PhysicsObject:
    def __init__(self, x, y, radius, mass=1.0):
        self.x = x
        self.y = y
        self.prev_x = x
        self.prev_y = y
        self.vx = 0.0
        self.vy = 0.0
        self.radius = radius
        self.mass = mass

class ServerPlayer(PhysicsObject):
    def __init__(self, id, x, y, play_bounds=None):
        super().__init__(x, y, PLAYER_RADIUS, mass=3.0)
        self.id = id
        self.play_bounds = play_bounds or {"left": 160, "right": 1037, "top": 68, "bottom": 634}
        self.bounds_radius_x = PLAYER_RADIUS
        self.bounds_radius_y = PLAYER_RADIUS
        self.stamina = 100.0
        # Temporary global card stats: Loris Karius, Bronze GK.
        self.acceleration = 1650.0
        self.friction = 0.95
        self.max_speed_normal = 235.0
        self.max_speed_sprint = 350.0
        self.kick_force = 170.0

    def update(self, inputs, dt):
        self.prev_x = self.x
        self.prev_y = self.y

        # 1. Handle Normal Movement Inputs
        dx, dy = 0, 0
        if inputs.get('up'): dy -= 1
        if inputs.get('down'): dy += 1
        if inputs.get('left'): dx -= 1
        if inputs.get('right'): dx += 1

        is_sprinting = inputs.get('sprint') and self.stamina > 0
        max_speed = self.max_speed_sprint if is_sprinting else self.max_speed_normal

        if dx != 0 or dy != 0:
            # Normalize
            length = math.sqrt(dx*dx + dy*dy)
            dx, dy = dx/length, dy/length
            
            # Apply Acceleration
            self.vx += dx * self.acceleration * dt
            self.vy += dy * self.acceleration * dt

        # 2. Friction
        friction_factor = math.pow(self.friction, dt * 60)
        self.vx *= friction_factor
        self.vy *= friction_factor

        # 3. Cap Speed
        speed = math.sqrt(self.vx**2 + self.vy**2)
        if speed > max_speed:
            ratio = max_speed / speed
            self.vx *= ratio
            self.vy *= ratio

        # 4. Apply Velocity
        self.x += self.vx * dt
        self.y += self.vy * dt

        # 5. Keep the full player card/ring inside the white field lines.
        min_x = self.play_bounds["left"] + self.bounds_radius_x
        max_x = self.play_bounds["right"] - self.bounds_radius_x
        min_y = self.play_bounds["top"] + self.bounds_radius_y
        max_y = self.play_bounds["bottom"] - self.bounds_radius_y
        clamped_x = max(min_x, min(max_x, self.x))
        clamped_y = max(min_y, min(max_y, self.y))
        if clamped_x != self.x:
            self.vx = 0
        if clamped_y != self.y:
            self.vy = 0
        self.x = clamped_x
        self.y = clamped_y

        # 6. Stamina Consumption & Recovery
        stamina_consumption = 40.0
        stamina_recovery = 20.0
        if is_sprinting and (dx != 0 or dy != 0):
            self.stamina = max(0.0, self.stamina - stamina_consumption * dt)
        else:
            self.stamina = min(100.0, self.stamina + stamina_recovery * dt)

class ServerBall(PhysicsObject):
    def __init__(self, x, y, play_bounds=None):
        super().__init__(x, y, BALL_RADIUS, mass=0.45)
        self.play_bounds = play_bounds or {"left": 160, "right": 1037, "top": 68, "bottom": 634}
        self.friction = 0.992
        self.bounce = 0.68
        self.angular_velocity = 0.0

    def update(self, dt):
        self.prev_x = self.x
        self.prev_y = self.y

        # 1. Apply Velocity
        self.x += self.vx * dt
        self.y += self.vy * dt

        # 2. Friction
        friction_factor = math.pow(self.friction, dt * 60)
        self.vx *= friction_factor
        self.vy *= friction_factor

        # 3. Bounds + Bounce. Keep the ball inside the visible field at all times.
        min_x = self.play_bounds["left"] + self.radius
        max_x = self.play_bounds["right"] - self.radius
        min_y = self.play_bounds["top"] + self.radius
        max_y = self.play_bounds["bottom"] - self.radius

        if self.x < min_x or self.x > max_x:
            self.vx *= -self.bounce
            self.x = min_x if self.x < min_x else max_x

        if self.y < min_y or self.y > max_y:
            self.vy *= -self.bounce
            self.y = min_y if self.y < min_y else max_y
