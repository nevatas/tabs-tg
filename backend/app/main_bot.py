import asyncio
import logging
import os
import uuid
import json
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command
from sqlalchemy.future import select
from sqlalchemy import update
from app.core.config import settings
from app.db.base import AsyncSessionLocal, engine, Base
from app.db.models import Post, User, AuthSession

# Ensure static directory exists
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static", "images")
os.makedirs(STATIC_DIR, exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO)

bot = Bot(token=settings.BOT_TOKEN)
dp = Dispatcher()

# Track media groups to avoid duplicate responses
media_group_messages = {}
media_group_locks = {}

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    # Check for deep linking arguments
    args = message.text.split()
    token = args[1] if len(args) > 1 else None

    async with AsyncSessionLocal() as session:
        # Upsert User
        result = await session.execute(select(User).where(User.telegram_id == message.from_user.id))
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                telegram_id=message.from_user.id,
                username=message.from_user.username,
                first_name=message.from_user.first_name
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        
        if token:
            # Look for pending session
            result = await session.execute(select(AuthSession).where(AuthSession.token == token))
            auth_session = result.scalar_one_or_none()
            
            if auth_session and auth_session.status == 'pending':
                auth_session.status = 'authenticated'
                auth_session.user_id = user.id
                await session.commit()
                await message.answer("✅ Successfully logged in! You can now check your web feed.")
                return

    await message.answer("Welcome to Tabs-TG! Send me images or albums to archive them.")

@dp.message()
async def save_post(message: types.Message):
    content = message.text or message.caption or None
    media_url = None
    media_type = None
    source_url = None
    
    # Extract source URL from forwarded message
    if message.forward_from_chat:
        # Message forwarded from a channel or group
        chat = message.forward_from_chat
        msg_id = message.forward_from_message_id
        
        if chat.username:
            # Public channel/group
            source_url = f"https://t.me/{chat.username}/{msg_id}"
        else:
            # Private channel/group (use chat ID)
            # Remove the -100 prefix from chat ID for the link
            chat_id_str = str(chat.id)
            if chat_id_str.startswith('-100'):
                chat_id_str = chat_id_str[4:]
            source_url = f"https://t.me/c/{chat_id_str}/{msg_id}"
    
    if entities:
        entities_list = []
        for entity in entities:
            entity_dict = {
                'type': entity.type,
                'offset': entity.offset,
                'length': entity.length
            }
            if entity.url:
                entity_dict['url'] = entity.url
            entities_list.append(entity_dict)
        entities_data = json.dumps(entities_list)

    if message.photo:
        media_type = 'photo'
        try:
            # Get highest resolution photo
            photo = message.photo[-1]
            file_id = photo.file_id
            file = await bot.get_file(file_id)
            file_path = file.file_path
            
            # Generate unique filename
            filename = f"{uuid.uuid4()}.jpg"
            local_path = os.path.join(STATIC_DIR, filename)
            
            # Download file
            await bot.download_file(file_path, local_path)
            
            # URL path to be stored in DB (accessible via API)
            media_url = f"/static/images/{filename}"
        except Exception as e:
            # If download fails (e.g., file too big), skip media but save text
            logging.warning(f"Failed to download photo: {e}")
            media_type = None

    elif message.video:
        media_type = 'video'
        try:
            video = message.video
            file_id = video.file_id
            file = await bot.get_file(file_id)
            file_path = file.file_path
            
            # Generate unique filename for video
            filename = f"{uuid.uuid4()}.mp4"
            local_path = os.path.join(STATIC_DIR, filename)
            
            # Download file
            await bot.download_file(file_path, local_path)
            
            media_url = f"/static/images/{filename}"
        except Exception as e:
            # If download fails (e.g., file too big), skip media but save text
            logging.warning(f"Failed to download video: {e}")
            media_type = None

    async with AsyncSessionLocal() as session:
        # Get current user (or verify existence)
        result = await session.execute(select(User).where(User.telegram_id == message.from_user.id))
        user = result.scalar_one_or_none()
        
        if not user:
             user = User(
                telegram_id=message.from_user.id,
                username=message.from_user.username,
                first_name=message.from_user.first_name
            )
             session.add(user)
             await session.commit()
             await session.refresh(user)

        new_post = Post(
            telegram_message_id=message.message_id,
            user_id=user.id,
            content=content,
            entities=entities_data,
            source_url=source_url,
            media_url=media_url,
            media_type=media_type,
            media_group_id=message.media_group_id
        )
        session.add(new_post)
        await session.commit()
    
    # Reply to user (only once per media group)
    should_reply = True
    if message.media_group_id:
        # For media groups, only reply once after all messages are processed
        if message.media_group_id not in media_group_messages:
            media_group_messages[message.media_group_id] = True
            # Wait a bit to ensure all messages in the group are processed
            await asyncio.sleep(0.5)
        else:
            should_reply = False
    
    if should_reply:
        if (message.photo or message.video) and not media_url:
            await message.reply("⚠️ Saved text, but media file is too large to download!")
        else:
            await message.reply("Saved!")
    
    # Clean up old media group tracking
    if message.media_group_id and message.media_group_id in media_group_messages:
        # Remove after 10 seconds to prevent memory leak
        async def cleanup():
            await asyncio.sleep(10)
            if message.media_group_id in media_group_messages:
                del media_group_messages[message.media_group_id]
        asyncio.create_task(cleanup())

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
