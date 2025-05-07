import os
from typing import AsyncGenerator
from services.lg import logger

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise ValueError("MONGODB_URL environment variable is not set.")

client = AsyncIOMotorClient(
    MONGODB_URL,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
)


async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    if client is None:
        raise ValueError("Database client is not initialized.")

    db = client["notification_service"]
    yield db


async def ping_database() -> bool:
    try:
        await client.admin.command('ping')
        logger.info("Database connection successful.")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False
