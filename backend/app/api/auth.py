from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, User as UserSchema
from app.schemas.auth import Token, LoginRequest, RefreshTokenRequest
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.services.redis import redis_service
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(
        (User.username == user_in.username) | (User.email == user_in.email) | (User.nickname == user_in.nickname)
    ))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="Username, email or nickname already registered"
        )
    
    # Create user
    db_user = User(
        username=user_in.username,
        nickname=user_in.nickname,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(db_user)
    await db.flush() # Ensure db_user has id populated
    
    from app.models.user_progression import UserProgression
    db_progression = UserProgression(
        user_id=db_user.id,
        level=1,
        xp=0,
        total_xp=0,
        coins=100,
        gems=10
    )
    db.add(db_progression)
    await db.commit()
    await db.refresh(db_user)

    
    # Generate tokens
    access_token = create_access_token(subject=db_user.id)
    refresh_token = create_refresh_token(subject=db_user.id)
    
    # Store refresh token in Redis
    redis_service.store_refresh_token(db_user.id, refresh_token, settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == login_data.username))
    user = result.scalars().first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    redis_service.store_refresh_token(user.id, refresh_token, settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.post("/refresh", response_model=Token)
async def refresh(refresh_data: RefreshTokenRequest):
    user_id = redis_service.get_user_id_from_refresh_token(refresh_data.refresh_token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    # Create new tokens
    access_token = create_access_token(subject=user_id)
    new_refresh_token = create_refresh_token(subject=user_id)
    
    # Replace old refresh token in Redis
    redis_service.delete_refresh_token(refresh_data.refresh_token)
    redis_service.store_refresh_token(user_id, new_refresh_token, settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }
