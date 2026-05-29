import time
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.api.deps import get_current_user
from app.models.match import Match
from app.models.user import User
from app.services.redis import redis_service
from app.services.matchmaker import (
    join_times,
    matchmaking_queue_key,
    remove_user_from_all_matchmaking_queues,
    normalize_region,
)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db

router = APIRouter()

class JoinMatchmakingRequest(BaseModel):
    region: str = "Europe"

class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None

@router.get("/")
async def read_root():
    return {"message": "Welcome to Megaball API"}

@router.get("/health")
async def health_check():
    return {"status": "green"}

@router.post("/matchmaking/join")
async def join_matchmaking(
    payload: JoinMatchmakingRequest,
    current_user: User = Depends(get_current_user)
):
    user_id = str(current_user.id)
    user_mmr = current_user.mmr if current_user.mmr is not None else 0
    region = normalize_region(payload.region)
    queue_key = matchmaking_queue_key(region)
    
    join_times[user_id] = time.time()
    remove_user_from_all_matchmaking_queues(user_id)
    redis_service.zadd(queue_key, {user_id: user_mmr})
    
    print(f"User {user_id} with MMR {user_mmr} joined {region} matchmaking queue.")
    return {"status": "in_queue", "user_id": user_id, "mmr": user_mmr, "region": region}

@router.post("/matchmaking/leave")
async def leave_matchmaking(
    current_user: User = Depends(get_current_user)
):
    user_id = str(current_user.id)
    remove_user_from_all_matchmaking_queues(user_id)
    if user_id in join_times:
        del join_times[user_id]
        
    print(f"User {user_id} left matchmaking queue.")
    return {"status": "idle", "user_id": user_id}

@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.user_progression import UserProgression
    from app.models.user_profile import UserProfile
    
    result = await db.execute(select(UserProgression).where(UserProgression.user_id == current_user.id))
    progression = result.scalars().first()
    
    if not progression:
        # Create default progression for existing user
        progression = UserProgression(
            user_id=current_user.id,
            level=1,
            xp=0,
            total_xp=0,
            coins=100,
            gems=10
        )
        db.add(progression)
        await db.commit()
        await db.refresh(progression)

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = profile_result.scalars().first()

    user_id = str(current_user.id)
    matches_result = await db.execute(
        select(Match).where(
            (Match.home_player_id == user_id) |
            (Match.away_player_id == user_id)
        )
    )
    matches = matches_result.scalars().all()
    matches = [
        match for match in matches
        if match.home_player_id and match.away_player_id and match.home_player_id != match.away_player_id
    ]
    wins = sum(1 for match in matches if match.winner_id == user_id)
    losses = sum(1 for match in matches if match.winner_id and match.winner_id != user_id)
    draws = sum(1 for match in matches if not match.winner_id)
    goals_scored = sum(
        match.home_score if match.home_player_id == user_id else match.away_score
        for match in matches
    )
    goals_conceded = sum(
        match.away_score if match.home_player_id == user_id else match.home_score
        for match in matches
    )
    best_win_streak = 0
    current_win_streak = 0
    for match in sorted(matches, key=lambda item: item.created_at or 0):
        if match.winner_id == user_id:
            current_win_streak += 1
            best_win_streak = max(best_win_streak, current_win_streak)
        elif match.winner_id:
            current_win_streak = 0
    recent_matches = []
    for match in sorted(matches, key=lambda item: item.created_at or 0, reverse=True)[:10]:
        is_home = match.home_player_id == user_id
        player_score = match.home_score if is_home else match.away_score
        opponent_score = match.away_score if is_home else match.home_score
        if match.winner_id == user_id:
            result_label = "WIN"
        elif match.winner_id:
            result_label = "LOSS"
        else:
            result_label = "DRAW"
        recent_matches.append({
            "id": match.id,
            "score": f"{player_score}:{opponent_score}",
            "result": result_label,
            "duration": match.duration,
            "played_at": match.created_at.isoformat() if match.created_at else None,
        })
        
    return {
        "id": current_user.id,
        "username": current_user.username,
        "nickname": current_user.nickname,
        "email": current_user.email,
        "avatar_url": profile.avatar_url if profile else None,
        "mmr": current_user.mmr,
        "level": progression.level,
        "xp": progression.xp,
        "total_xp": progression.total_xp,
        "xp_needed": progression.level * 200,
        "wins": wins,
        "losses": losses,
        "draws": draws,
        "matches_played": len(matches),
        "goals_scored": goals_scored,
        "goals_conceded": goals_conceded,
        "best_win_streak": best_win_streak,
        "recent_matches": recent_matches,
        "coins": progression.coins,
        "gems": progression.gems
    }

@router.put("/profile")
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.user_profile import UserProfile

    next_nickname = payload.nickname.strip() if payload.nickname is not None else current_user.nickname
    next_email = payload.email.strip() if payload.email is not None else current_user.email
    next_avatar_url = payload.avatar_url.strip() if payload.avatar_url is not None else None

    if payload.nickname is not None and not next_nickname:
        raise HTTPException(status_code=400, detail="Nickname is required")
    if payload.email is not None and not next_email:
        raise HTTPException(status_code=400, detail="Email is required")
    if next_avatar_url is not None:
        if next_avatar_url and not next_avatar_url.startswith("data:image/"):
            raise HTTPException(status_code=400, detail="Avatar must be an image")
        if len(next_avatar_url) > 2_500_000:
            raise HTTPException(status_code=400, detail="Avatar image is too large")

    if payload.nickname is not None or payload.email is not None:
        duplicate_result = await db.execute(
            select(User).where(
                (User.id != current_user.id) &
                ((User.nickname == next_nickname) | (User.email == next_email))
            )
        )
        duplicate_user = duplicate_result.scalars().first()
        if duplicate_user:
            raise HTTPException(status_code=400, detail="Nickname or email already in use")

    current_user.nickname = next_nickname
    current_user.email = next_email

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = profile_result.scalars().first()
    if payload.avatar_url is not None:
        if not profile:
            profile = UserProfile(user_id=current_user.id)
            db.add(profile)
        profile.avatar_url = next_avatar_url or None

    await db.commit()
    await db.refresh(current_user)

    return {
        "id": current_user.id,
        "username": current_user.username,
        "nickname": current_user.nickname,
        "email": current_user.email,
        "avatar_url": profile.avatar_url if profile else None,
        "mmr": current_user.mmr,
    }

import json
from app.models.item import Item, UserInventory
from app.models.user_progression import UserProgression

class BuyItemRequest(BaseModel):
    item_id: int

class EquipItemRequest(BaseModel):
    item_id: int
    equip: bool

@router.get("/shop/items")
async def get_shop_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    items_result = await db.execute(select(Item))
    items = items_result.scalars().all()
    
    inv_result = await db.execute(select(UserInventory).where(UserInventory.user_id == current_user.id))
    inventory = inv_result.scalars().all()
    owned_item_ids = {inv.item_id for inv in inventory}
    
    shop_items = []
    for item in items:
        try:
            bonus = json.loads(item.stats_bonus) if item.stats_bonus else {}
        except Exception:
            bonus = {}
        shop_items.append({
            "id": item.id,
            "name": item.name,
            "type": item.type,
            "rarity": item.rarity,
            "stats_bonus": bonus,
            "price": item.price,
            "owned": item.id in owned_item_ids
        })
    return shop_items

@router.post("/shop/buy")
async def buy_item(
    payload: BuyItemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    item_result = await db.execute(select(Item).where(Item.id == payload.item_id))
    item = item_result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    existing_result = await db.execute(
        select(UserInventory).where(
            (UserInventory.user_id == current_user.id) & 
            (UserInventory.item_id == payload.item_id)
        )
    )
    existing = existing_result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Item already owned")
        
    prog_result = await db.execute(select(UserProgression).where(UserProgression.user_id == current_user.id))
    progression = prog_result.scalars().first()
    if not progression or progression.coins < item.price:
        raise HTTPException(status_code=400, detail="Insufficient coins")
        
    progression.coins -= item.price
    new_inv = UserInventory(user_id=current_user.id, item_id=item.id, equipped=False)
    db.add(new_inv)
    await db.commit()
    
    return {
        "status": "success",
        "detail": f"Successfully purchased {item.name}",
        "coins_remaining": progression.coins
    }

@router.get("/inventory")
async def get_inventory(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UserInventory, Item)
        .join(Item, UserInventory.item_id == Item.id)
        .where(UserInventory.user_id == current_user.id)
    )
    rows = result.all()
    
    user_items = []
    for inv, item in rows:
        try:
            bonus = json.loads(item.stats_bonus) if item.stats_bonus else {}
        except Exception:
            bonus = {}
        user_items.append({
            "id": item.id,
            "name": item.name,
            "type": item.type,
            "rarity": item.rarity,
            "stats_bonus": bonus,
            "price": item.price,
            "equipped": inv.equipped
        })
    return user_items

@router.post("/inventory/equip")
async def equip_item(
    payload: EquipItemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    inv_result = await db.execute(
        select(UserInventory, Item)
        .join(Item, UserInventory.item_id == Item.id)
        .where(
            (UserInventory.user_id == current_user.id) &
            (UserInventory.item_id == payload.item_id)
        )
    )
    row = inv_result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Item not in inventory")
        
    inv, item = row
    
    if payload.equip:
        # Auto-unequip other items of the same type
        same_type_result = await db.execute(
            select(UserInventory, Item)
            .join(Item, UserInventory.item_id == Item.id)
            .where(
                (UserInventory.user_id == current_user.id) &
                (Item.type == item.type) &
                (UserInventory.item_id != item.id)
            )
        )
        for other_inv, _ in same_type_result.all():
            other_inv.equipped = False
            
        inv.equipped = True
    else:
        inv.equipped = False
        
    await db.commit()
    return {
        "status": "success",
        "item_id": item.id,
        "equipped": inv.equipped
    }
