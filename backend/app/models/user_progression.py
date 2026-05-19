from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class UserProgression(Base):
    __tablename__ = "user_progression"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    level = Column(Integer, default=1, nullable=False)
    xp = Column(Integer, default=0, nullable=False)
    total_xp = Column(Integer, default=0, nullable=False)
    coins = Column(Integer, default=0, nullable=False)
    gems = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="progression")

