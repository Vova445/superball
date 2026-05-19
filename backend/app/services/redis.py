import redis
from app.core.config import settings

class RedisService:
    def __init__(self):
        # Using a simple dictionary as an In-Memory store for refresh tokens
        self._storage = {}
        self.use_mock = False
        try:
            self.client = redis.Redis(
                host=settings.REDIS_HOST, 
                port=settings.REDIS_PORT, 
                decode_responses=True,
                socket_connect_timeout=1.0
            )
            self.client.ping()
            print("Connected to real Redis.")
        except Exception:
            print("Failed to connect to Redis. Falling back to In-Memory mock.")
            self.use_mock = True
            # Mock structure: {set_name: {member: score}}
            self.mock_zsets = {}

    def store_refresh_token(self, user_id: int, token: str, expires_days: int):
        self._storage[f"refresh_token:{token}"] = str(user_id)

    def get_user_id_from_refresh_token(self, token: str) -> str:
        return self._storage.get(f"refresh_token:{token}")

    def delete_refresh_token(self, token: str):
        if f"refresh_token:{token}" in self._storage:
            del self._storage[f"refresh_token:{token}"]

    def zadd(self, name: str, mapping: dict):
        if not self.use_mock:
            try:
                return self.client.zadd(name, mapping)
            except Exception:
                pass
        
        # Fallback Mock
        if name not in self.mock_zsets:
            self.mock_zsets[name] = {}
        for member, score in mapping.items():
            self.mock_zsets[name][str(member)] = float(score)
        return len(mapping)

    def zrem(self, name: str, *members):
        if not self.use_mock:
            try:
                return self.client.zrem(name, *members)
            except Exception:
                pass
        
        # Fallback Mock
        if name not in self.mock_zsets:
            return 0
        removed = 0
        for member in members:
            if str(member) in self.mock_zsets[name]:
                del self.mock_zsets[name][str(member)]
                removed += 1
        return removed

    def zrange(self, name: str, start: int, end: int, withscores: bool = False):
        if not self.use_mock:
            try:
                return self.client.zrange(name, start, end, withscores=withscores)
            except Exception:
                pass
        
        # Fallback Mock
        if name not in self.mock_zsets:
            return []
        
        sorted_items = sorted(self.mock_zsets[name].items(), key=lambda item: (item[1], item[0]))
        
        total = len(sorted_items)
        abs_start = start if start >= 0 else total + start
        abs_end = end if end >= 0 else total + end
        
        sliced = sorted_items[max(0, abs_start):max(0, abs_end + 1)]
        
        if withscores:
            return sliced
        else:
            return [item[0] for item in sliced]

    def zscore(self, name: str, member: str):
        if not self.use_mock:
            try:
                return self.client.zscore(name, member)
            except Exception:
                pass
        
        if name not in self.mock_zsets:
            return None
        score = self.mock_zsets[name].get(str(member))
        return score if score is None else float(score)

redis_service = RedisService()
