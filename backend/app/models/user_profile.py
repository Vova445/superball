from sqlalchemy import Column, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.models.base import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True, index=True)
    avatar_url = Column(Text, nullable=True)

    user = relationship("User")
