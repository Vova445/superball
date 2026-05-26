import asyncio
import time
from app.services.redis import redis_service
from app.services.socket_manager import user_sid_map, sio

# In-memory join times
join_times = {}  # str(user_id) -> float
MATCHMAKING_REGIONS = ("Europe", "North America", "South America", "Asia")

def normalize_region(region):
    return region if region in MATCHMAKING_REGIONS else "Europe"

def region_slug(region):
    return normalize_region(region).lower().replace(" ", "-")

def matchmaking_queue_key(region):
    return f"matchmaking_queue:{region_slug(region)}"

def remove_user_from_all_matchmaking_queues(user_id):
    for region in MATCHMAKING_REGIONS:
        redis_service.zrem(matchmaking_queue_key(region), user_id)
    redis_service.zrem("matchmaking_queue", user_id)

async def matchmaker_loop():
    print("Matchmaker background loop started.")
    while True:
        try:
            await asyncio.sleep(2)
            await check_matches()
        except Exception as e:
            print(f"Error in matchmaker loop: {e}")

async def check_matches():
    for region in MATCHMAKING_REGIONS:
        await check_region_matches(region)

async def check_region_matches(region):
    # Get all players in the matchmaking queue sorted by score (MMR)
    queue_key = matchmaking_queue_key(region)
    queue = redis_service.zrange(queue_key, 0, -1, withscores=True)
    if len(queue) < 2:
        return

    players = [(str(uid), float(mmr)) for uid, mmr in queue]
    
    matched_pairs = []
    used_players = set()
    
    now = time.time()
    
    for i in range(len(players)):
        p1_id, p1_mmr = players[i]
        if p1_id in used_players:
            continue
            
        p1_join_time = join_times.get(p1_id, now)
        p1_waiting_time = now - p1_join_time
        
        # Expand threshold to 500 if waiting >= 30 seconds
        p1_threshold = 500.0 if p1_waiting_time >= 30.0 else 200.0
        
        for j in range(i + 1, len(players)):
            p2_id, p2_mmr = players[j]
            if p2_id in used_players:
                continue
                
            p2_join_time = join_times.get(p2_id, now)
            p2_waiting_time = now - p2_join_time
            p2_threshold = 500.0 if p2_waiting_time >= 30.0 else 200.0
            
            diff = abs(p1_mmr - p2_mmr)
            allowed_diff = max(p1_threshold, p2_threshold)
            
            if diff <= allowed_diff:
                matched_pairs.append((p1_id, p2_id))
                used_players.add(p1_id)
                used_players.add(p2_id)
                break
                
    for u1, u2 in matched_pairs:
        # Remove from queue
        redis_service.zrem(queue_key, u1, u2)
        if u1 in join_times: del join_times[u1]
        if u2 in join_times: del join_times[u2]
        
        room_id = f"room_{region_slug(region)}_{u1}_{u2}_{int(time.time())}"
        
        # Send invite event to both players if they are connected
        sid1 = user_sid_map.get(u1)
        sid2 = user_sid_map.get(u2)
        
        print(f"Match found in {region}: {u1} (sid: {sid1}) and {u2} (sid: {sid2}). Room ID: {room_id}")
        
        if sid1:
            await sio.emit("match_invite", {"room": room_id, "opponent_id": u2, "region": region}, to=sid1)
        if sid2:
            await sio.emit("match_invite", {"room": room_id, "opponent_id": u1, "region": region}, to=sid2)
