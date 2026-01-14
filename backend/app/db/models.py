from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    posts = relationship("Post", back_populates="owner")
    sessions = relationship("AuthSession", back_populates="user")


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    token = Column(String, primary_key=True, index=True)  # UUID
    status = Column(String, default="pending")  # pending, authenticated
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sessions")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    telegram_message_id = Column(Integer, unique=True, index=True)
    content = Column(Text, nullable=True)
    entities = Column(Text, nullable=True)  # JSON string of message entities
    media_url = Column(String, nullable=True)
    media_type = Column(String, nullable=True)
    media_group_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="posts")
