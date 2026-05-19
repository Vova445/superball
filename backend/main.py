import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.api.auth import router as auth_router
from app.core.config import settings
from app.services.socket_manager import get_sio_app

# The original FastAPI app
fastapi_app = FastAPI(title=settings.PROJECT_NAME)

# Set up CORS
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@fastapi_app.on_event("startup")
async def startup_event():
    from app.models.base import Base
    from app.models.user import User
    from app.models.match import Match
    from app.models.user_progression import UserProgression
    from app.models.item import Item, UserInventory
    from app.db.session import engine, async_session
    from sqlalchemy.future import select
    import json
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE users ADD COLUMN mmr INTEGER DEFAULT 1000"))
        except Exception:
            pass
    print("Database tables initialized successfully.")

    # Seed default items if the shop is empty
    try:
        async with async_session() as session:
            result = await session.execute(select(Item))
            existing_items = result.scalars().all()
            if not existing_items:
                default_items = [
                    Item(
                        name="Speedy Sneakers", 
                        type="boots", 
                        rarity="Common", 
                        stats_bonus=json.dumps({"speed": 20}), 
                        price=100
                    ),
                    Item(
                        name="Heavy Boots", 
                        type="boots", 
                        rarity="Rare", 
                        stats_bonus=json.dumps({"speed": -10, "kick": 50}), 
                        price=300
                    ),
                    Item(
                        name="Fire Jersey", 
                        type="jersey", 
                        rarity="Rare", 
                        stats_bonus=json.dumps({"speed": 10, "kick": 10}), 
                        price=250
                    ),
                    Item(
                        name="Shadow Gloves", 
                        type="gloves", 
                        rarity="Epic", 
                        stats_bonus=json.dumps({"kick": 35}), 
                        price=500
                    ),
                    Item(
                        name="Golden Boots", 
                        type="boots", 
                        rarity="Legendary", 
                        stats_bonus=json.dumps({"speed": 40, "kick": 40}), 
                        price=1000
                    ),
                    Item(
                        name="Glitch Ball Aura", 
                        type="aura", 
                        rarity="Legendary", 
                        stats_bonus=json.dumps({"speed": 50, "kick": 20}), 
                        price=1200
                    )
                ]
                session.add_all(default_items)
                await session.commit()
                print("Default shop items seeded successfully.")
    except Exception as e:
        print(f"Error seeding default items: {e}")
    
    # Start matchmaker background loop
    from app.services.matchmaker import matchmaker_loop
    asyncio.create_task(matchmaker_loop())
    print("Matchmaker background task started.")

@fastapi_app.get("/")
async def root():
    return {
        "message": "Megaball API is running",
        "docs": "/docs",
        "health": "/api/health"
    }

fastapi_app.include_router(auth_router, prefix="/auth", tags=["auth"])
fastapi_app.include_router(api_router, prefix="/api", tags=["api"])

# Wrap with Socket.IO
app = get_sio_app(fastapi_app)
