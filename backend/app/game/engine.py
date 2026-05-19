import math
import time

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
    def __init__(self, x, y, radius):
        self.x = x
        self.y = y
        self.vx = 0.0
        self.vy = 0.0
        self.radius = radius

class ServerPlayer(PhysicsObject):
    def __init__(self, id, x, y):
        super().__init__(x, y, 20)
        self.id = id
        self.stamina = 100.0
        self.acceleration = 2000.0
        self.friction = 0.95
        self.max_speed_normal = 300.0
        self.max_speed_sprint = 480.0
        self.dash_speed = 600.0
        self.is_dashing = False
        
        self.dash_cooldown = 1.5  # seconds
        self.last_dash_time = 0.0
        self.dash_duration = 0.15  # seconds
        self.dash_timer = 0.0

    def update(self, inputs, dt):
        # 1. Update Dash Timer
        if self.is_dashing:
            self.dash_timer -= dt
            if self.dash_timer <= 0:
                self.is_dashing = False
            else:
                # Apply velocity while dashing
                self.x += self.vx * dt
                self.y += self.vy * dt
                self.x = max(28 + self.radius, min(1200 - 28 - self.radius, self.x))
                self.y = max(60 + self.radius, min(700 - 60 - self.radius, self.y))
                return

        # 2. Check Dash Trigger
        if inputs.get('dash') and not self.is_dashing:
            current_time = time.time()
            if current_time > self.last_dash_time + self.dash_cooldown:
                self.is_dashing = True
                self.dash_timer = self.dash_duration
                self.last_dash_time = current_time
                
                # Dash direction: current velocity direction, or default to right (1, 0)
                speed = math.sqrt(self.vx**2 + self.vy**2)
                if speed > 0:
                    self.vx = (self.vx / speed) * self.dash_speed
                    self.vy = (self.vy / speed) * self.dash_speed
                else:
                    self.vx = self.dash_speed
                    self.vy = 0.0
                
                self.x += self.vx * dt
                self.y += self.vy * dt
                self.x = max(28 + self.radius, min(1200 - 28 - self.radius, self.x))
                self.y = max(60 + self.radius, min(700 - 60 - self.radius, self.y))
                return

        # 3. Handle Normal Movement Inputs
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

        # 4. Friction
        friction_factor = math.pow(self.friction, dt * 60)
        self.vx *= friction_factor
        self.vy *= friction_factor

        # 5. Cap Speed
        speed = math.sqrt(self.vx**2 + self.vy**2)
        if speed > max_speed:
            ratio = max_speed / speed
            self.vx *= ratio
            self.vy *= ratio

        # 6. Apply Velocity
        self.x += self.vx * dt
        self.y += self.vy * dt

        # 7. World Bounds (Mirroring Phaser)
        self.x = max(28 + self.radius, min(1200 - 28 - self.radius, self.x))
        self.y = max(60 + self.radius, min(700 - 60 - self.radius, self.y))

        # 8. Stamina Consumption & Recovery
        stamina_consumption = 40.0
        stamina_recovery = 20.0
        if is_sprinting and (dx != 0 or dy != 0):
            self.stamina = max(0.0, self.stamina - stamina_consumption * dt)
        else:
            self.stamina = min(100.0, self.stamina + stamina_recovery * dt)

class ServerBall(PhysicsObject):
    def __init__(self, x, y):
        super().__init__(x, y, 22)
        self.friction = 0.985
        self.bounce = 0.75
        self.angular_velocity = 0.0

    def update(self, dt):
        # 1. Apply Velocity
        self.x += self.vx * dt
        self.y += self.vy * dt

        # 2. Friction
        friction_factor = math.pow(self.friction, dt * 60)
        self.vx *= friction_factor
        self.vy *= friction_factor

        # 3. Bounds + Bounce
        if self.x < 28 + self.radius or self.x > 1200 - 28 - self.radius:
            # Check if it's NOT a goal
            if not (250 < self.y < 450):
                self.vx *= -self.bounce
                self.x = 28 + self.radius if self.x < 28 + self.radius else 1200 - 28 - self.radius

        if self.y < 60 + self.radius or self.y > 700 - 60 - self.radius:
            self.vy *= -self.bounce
            self.y = 60 + self.radius if self.y < 60 + self.radius else 700 - 60 - self.radius
