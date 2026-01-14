from fastapi import FastAPI, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from app.db.base import get_db, engine, Base
from app.db.models import Post, AuthSession, User
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uuid
import logging
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify exact origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static directory if it doesn't exist
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.on_event("startup")
async def startup():
    import asyncio
    retries = 5
    while retries > 0:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            break
        except Exception as e:
            retries -= 1
            print(f"Database not ready, retrying in 2s... ({retries} left)")
            await asyncio.sleep(2)
            if retries == 0:
                raise e

@app.get("/")
async def root():
    return {"message": "Hello World"}


# Auth Models
class AuthInitResponse(BaseModel):
    token: str
    bot_url: str

class AuthStatusResponse(BaseModel):
    status: str
    access_token: Optional[str] = None
    user_id: Optional[int] = None

@app.post("/auth/init", response_model=AuthInitResponse)
async def auth_init(db: AsyncSession = Depends(get_db)):
    token = str(uuid.uuid4())
    session = AuthSession(token=token, status="pending")
    db.add(session)
    await db.commit()
    
    return {
        "token": token, 
        "bot_url": f"https://t.me/savetabsbot?start={token}"
    }

@app.get("/auth/status", response_model=AuthStatusResponse)
async def auth_status(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuthSession).where(AuthSession.token == token))
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {
        "status": session.status,
        "access_token": str(session.user_id) if session.user_id else None, 
        "user_id": session.user_id
    }

async def get_current_user(authorization: str = Header(None), db: AsyncSession = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    
    try:
        # Expected format: "Bearer <user_id>"
        scheme, param = authorization.split()
        if scheme.lower() != 'bearer':
             raise HTTPException(status_code=401, detail="Invalid Auth Scheme")
        
        user_id = int(param)
        return user_id
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Auth Token")

@app.get("/posts")
async def get_posts(
    current_user_id: int = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    # Filter by user_id
    result = await db.execute(
        select(Post)
        .where(Post.user_id == current_user_id)
        .order_by(Post.created_at.desc())
    )
    posts = result.scalars().all()
    
    # Grouping Logic (Same as before)
    grouped_posts = []
    current_group = None
    
    # Posts are ordered by created_at desc (newest first). 
    # For grouping, it's easier if we process them and look for same group_id.
    # But since they are ordered by time, posts in the same group should be adjacent.
    
    for post in posts:
        # If post has a group_id
        if post.media_group_id:
            # Check if we are already building a group with this id
            if current_group and current_group['media_group_id'] == post.media_group_id:
                # Add to current group
                if post.media_url and post.media_type:
                    current_group['media'].append({
                        'url': post.media_url,
                        'type': post.media_type
                    })
                # If current group has no content but this post does, update content
                if not current_group['content'] and post.content:
                    current_group['content'] = post.content
            else:
                # Found a new group (or different group), push previous if exists
                if current_group:
                    grouped_posts.append(current_group)
                
                # Start new group
                current_group = {
                    'id': post.id,
                    'telegram_message_id': post.telegram_message_id,
                    'content': post.content,
                    'entities': post.entities,
                    'created_at': post.created_at,
                    'media_group_id': post.media_group_id,
                    'media': []
                }
                if post.media_url and post.media_type:
                    current_group['media'].append({
                        'url': post.media_url,
                        'type': post.media_type
                    })
        else:
            # Not part of a group
            if current_group:
                grouped_posts.append(current_group)
                current_group = None
            
            # Add single post
            single_post = {
                'id': post.id,
                'telegram_message_id': post.telegram_message_id,
                'content': post.content,
                'entities': post.entities,
                'created_at': post.created_at,
                'media_group_id': None,
                'media': []
            }
            if post.media_url and post.media_type:
                single_post['media'].append({
                    'url': post.media_url,
                    'type': post.media_type
                })
            grouped_posts.append(single_post)
    
    # Append last group if exists
    if current_group:
        grouped_posts.append(current_group)
        
    return grouped_posts

@app.delete("/posts/{post_id}")
async def delete_post(
    post_id: int, 
    current_user_id: int = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get the post first to check for media_group_id AND ownership
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    
    if not post:
        return {"error": "Post not found"}

    if post.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
        
    if post.media_group_id:
        # Delete all posts in the group (ensure they belong to user too, though likely)
        await db.execute(
            delete(Post)
            .where(Post.media_group_id == post.media_group_id)
            .where(Post.user_id == current_user_id) # Double safety
        )
    else:
        # Delete single post
        await db.execute(delete(Post).where(Post.id == post_id))
        
    await db.commit()
    return {"message": "Post deleted"}
