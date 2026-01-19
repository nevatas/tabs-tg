from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import computed_field

class Settings(BaseSettings):
    DATABASE_URL: str
    BOT_TOKEN: Optional[str] = None

    @computed_field
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """Convert DATABASE_URL to asyncpg format for Railway compatibility"""
        url = self.DATABASE_URL
        # Railway provides postgresql:// but asyncpg needs postgresql+asyncpg://
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
