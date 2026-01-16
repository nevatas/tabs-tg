from fastapi import FastAPI, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update, text
from sqlalchemy.sql import func
from app.db.base import get_db, engine, Base
from app.db.models import Post, AuthSession, User, Tab
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
    allow_origins=["*"],
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
                # Manual migration for 'position' column in 'tabs' table if missing
                try:
                    await conn.execute(text("ALTER TABLE tabs ADD COLUMN position INTEGER DEFAULT 0"))
                    print("Added 'position' column to 'tabs' table")
                except Exception:
                    # Column likely exists or other error (ignore)
                    pass
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
    db: AsyncSession = Depends(get_db),
    tab_id: Optional[int] = None
):
    query = select(Post).where(Post.user_id == current_user_id)
    
    if tab_id is not None:
        query = query.where(Post.tab_id == tab_id)
    else:

        # If tab_id is None, return posts with tab_id IS NULL (Inbox)
        query = query.where(Post.tab_id.is_(None))

    # Sort by position (manual order) then created_at (newest first fallback)
    query = query.order_by(Post.position.asc(), Post.created_at.desc())
    
    result = await db.execute(query)
    posts = result.scalars().all()
    
    # Updated Grouping Logic
    grouped_posts = []
    processed_group_ids = set()
    
    # helper to find all siblings
    def get_group_siblings(group_id, all_posts):
        return [p for p in all_posts if p.media_group_id == group_id]

    for post in posts:
        # 1. Check if part of a media group
        if post.media_group_id:
            if post.media_group_id in processed_group_ids:
                continue
                
            # New group encountered
            siblings = get_group_siblings(post.media_group_id, posts)
            
            # Sort siblings by id or created_at to maintain internal order (if any)
            # usually message id is good proxy for chronological order in TG
            siblings.sort(key=lambda x: x.telegram_message_id)
            
            # Construct group object
            # Use the properties of the *first* sibling (or the one carrying content)
            # Generally, the caption is on one of them (often the first or last).
            
            # Find caption
            content = None
            entities = None
            source_url = None
            
            media_items = []
            
            for sib in siblings:
                if sib.content and not content:
                    content = sib.content
                    entities = sib.entities
                    source_url = sib.source_url
                
                if sib.media_url and sib.media_type:
                    media_items.append({
                        'url': sib.media_url,
                        'type': sib.media_type
                    })

            group_obj = {
                'id': post.id, # Use ID of the current post as representative (for key/sorting)
                'telegram_message_id': post.telegram_message_id,
                'content': content,
                'entities': entities,
                'source_url': source_url,
                'created_at': post.created_at,
                'media_group_id': post.media_group_id,
                'media': media_items
            }
            
            grouped_posts.append(group_obj)
            processed_group_ids.add(post.media_group_id)
            
        else:
            # 2. Single Post
            single_post = {
                'id': post.id,
                'telegram_message_id': post.telegram_message_id,
                'content': post.content,
                'entities': post.entities,
                'source_url': post.source_url,
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

    return grouped_posts

from fastapi import UploadFile, File, Form
import shutil
import time

@app.post("/posts")
async def create_post(
    content: str = Form(None),
    media: List[UploadFile] = File(None),
    current_user_id: int = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Dummy Telegram Message ID (negative timestamp to avoid collision)
    dummy_tg_id = -int(time.time())
    media_group_id = str(uuid.uuid4()) if media and len(media) > 1 else None
    
    saved_posts = []

    # Case 1: Text only
    if not media:
        new_post = Post(
            user_id=current_user_id,
            telegram_message_id=dummy_tg_id,
            content=content,
            media_url=None,
            media_type=None,
            created_at=func.now()
        )
        db.add(new_post)
        await db.commit()
        await db.refresh(new_post)
        saved_posts.append(new_post)

    # Case 2: With Media
    else:
        for i, file in enumerate(media):
            # Determine media type
            content_type = file.content_type
            if content_type.startswith('image/'):
                media_type = 'photo'
            elif content_type.startswith('video/'):
                media_type = 'video'
            else:
                media_type = 'document'
                
            # Save file
            file_ext = os.path.splitext(file.filename)[1]
            filename = f"{uuid.uuid4()}{file_ext}"
            filepath = os.path.join(STATIC_DIR, "images", filename)
            
            # Ensure images dir exists
            os.makedirs(os.path.join(STATIC_DIR, "images"), exist_ok=True)
            
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Create Post
            # Associate content only with the first media item
            post_content = content if i == 0 else None
            
            new_post = Post(
                user_id=current_user_id,
                telegram_message_id=dummy_tg_id, # Simplified: sharing ID for simplicity in this context, or decrementing
                content=post_content,
                media_url=f"/static/images/{filename}",
                media_type=media_type,
                media_group_id=media_group_id,
                created_at=func.now()
            )
            db.add(new_post)
            saved_posts.append(new_post)
            
            # Decrement dummy ID for next item to avoid constraint violations if any (though currently no unique dummy constraint)
            dummy_tg_id -= 1

        await db.commit()
        for p in saved_posts:
            await db.refresh(p)
     
    # Return grouped structure (using the first post as the main representative or constructing a group)
    # Re-using the get_posts logic logic to format the return would be ideal, 
    # but for now we construct a single response representing the group if possible, 
    # OR we just return the first post object and let the frontend refetch or handle it.
    
    # Let's construct a response that matches the 'formatted_post' structure of get_posts
    # Find the main post (text or first media)
    main_post = saved_posts[0]
    
    response_obj = {
        'id': main_post.id,
        'telegram_message_id': main_post.telegram_message_id,
        'content': content,  # Return full content
        'entities': None,
        'source_url': main_post.source_url,
        'created_at': main_post.created_at,
        'media_group_id': media_group_id,
        'media': []
    }
    
    if media:
        for p in saved_posts:
            response_obj['media'].append({
                'url': p.media_url,
                'type': p.media_type
            })
            
    return response_obj
    
    # Return formatted structure similar to get_posts
    return {
        'id': new_post.id,
        'telegram_message_id': new_post.telegram_message_id,
        'content': new_post.content,
        'entities': None,
        'source_url': None,
        'created_at': new_post.created_at,
        'media_group_id': None,
        'media': [{'url': new_post.media_url, 'type': new_post.media_type}] if new_post.media_url else []
    }

class ReorderRequest(BaseModel):
    post_ids: list[int]

@app.put("/posts/reorder")
async def reorder_posts(
    request: ReorderRequest,
    current_user_id: int = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Iterate through the list of IDs and update their position
    # This is naive but works for small lists (~100 items).
    # For optimization, we could use CASE WHEN SQL.
    
    # First verify ownership of all posts (optional but good)
    # Just filtering by user_id in update logic is safe.
    
    for index, post_id in enumerate(request.post_ids):
        await db.execute(
            update(Post)
            .where(Post.id == post_id)
            .where(Post.user_id == current_user_id)
            .values(position=index)
        )
        
    await db.commit()
    return {"status": "success"}

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
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
        
    if post.media_group_id:
        # Delete all posts in the group (ensure they belong to user too, though likely)
        # Fetch group posts first to ensure proper session tracking and avoid bulk delete pitfalls
        group_posts = await db.execute(
            select(Post)
            .where(Post.media_group_id == post.media_group_id)
            .where(Post.user_id == current_user_id)
        )
        for p in group_posts.scalars().all():
            await db.delete(p)
    else:
        # Delete single post
        await db.execute(delete(Post).where(Post.id == post_id))
        
    await db.commit()
    return {"message": "Post deleted"}

@app.delete("/tabs/{tab_id}")
async def delete_tab(
    tab_id: int,
    current_user_id: int = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check ownership
    result = await db.execute(select(Tab).where(Tab.id == tab_id))
    tab = result.scalar_one_or_none()

    if not tab:
        raise HTTPException(status_code=404, detail="Tab not found")
        
    if tab.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this tab")

    # Move posts to Inbox (tab_id = NULL)
    await db.execute(
        update(Post)
        .where(Post.tab_id == tab_id)
        .values(tab_id=None)
    )

    # Delete the tab
    await db.delete(tab)
    await db.commit()

    return {"message": "Tab deleted, posts moved to Inbox"}

@app.get("/tabs")
async def get_tabs(
    current_user_id: int = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Tab).where(Tab.user_id == current_user_id).order_by(Tab.position.asc(), Tab.created_at.asc()))
    tabs = result.scalars().all()
    return tabs

class ReorderTabsRequest(BaseModel):
    tab_ids: list[int]

@app.put("/tabs/reorder")
async def reorder_tabs(
    request: ReorderTabsRequest,
    current_user_id: int = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    for index, tab_id in enumerate(request.tab_ids):
        await db.execute(
            update(Tab)
            .where(Tab.id == tab_id)
            .where(Tab.user_id == current_user_id)
            .values(position=index)
        )
    await db.commit()
    return {"status": "success"}

@app.post("/tabs")
async def create_tab(
    request: dict,
    current_user_id: int = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    title = request.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
    
    new_tab = Tab(user_id=current_user_id, title=title)
    db.add(new_tab)
    await db.commit()
    await db.refresh(new_tab)
    return new_tab

@app.delete("/tabs/{tab_id}")
async def delete_tab(
    tab_id: int,
    current_user_id: int = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Tab).where(Tab.id == tab_id, Tab.user_id == current_user_id))
    tab = result.scalar_one_or_none()
    if not tab:
        raise HTTPException(status_code=404, detail="Tab not found")
        
    # Set posts in this tab to Inbox (tab_id=None)
    await db.execute(update(Post).where(Post.tab_id == tab_id).values(tab_id=None))
    
    await db.delete(tab)
    await db.commit()
    return {"status": "success"}

@app.patch("/posts/{post_id}/move")
async def move_post(
    post_id: int,
    request: dict,
    current_user_id: int = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    tab_id = request.get("tab_id") # Can be None for Inbox
    
    # Check if post belongs to user
    result = await db.execute(select(Post).where(Post.id == post_id, Post.user_id == current_user_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # If media group, move all parts
    if post.media_group_id:
         await db.execute(
            update(Post)
            .where(Post.media_group_id == post.media_group_id)
            .where(Post.user_id == current_user_id)
            .values(tab_id=tab_id)
        )
    else:
        post.tab_id = tab_id
        
    await db.commit()
    return {"status": "success"}
