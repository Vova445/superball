from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.models.base import Base

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    home_player_id = Column(String, nullable=True)
    away_player_id = Column(String, nullable=True)
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)
    winner_id = Column(String, nullable=True)
    duration = Column(Integer, default=180)  # duration in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
