from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.models.base import Base

class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # e.g. boots, jersey, aura, etc.
    rarity = Column(String, nullable=False) # Common, Rare, Epic, Legendary
    stats_bonus = Column(String, nullable=True) # JSON serialized string, e.g. {"speed": 20, "kick": 10}
    price = Column(Integer, default=0)

class UserInventory(Base):
    __tablename__ = "user_inventory"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    item_id = Column(Integer, ForeignKey("items.id"), primary_key=True)
    equipped = Column(Boolean, default=False)
