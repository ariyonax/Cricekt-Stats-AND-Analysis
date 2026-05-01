# StumpStats - MongoDB Database Connection Utility
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv()

# Global database client
client: AsyncIOMotorClient = None
db = None

def _ensure_connected():
    """Auto-connect if db is not initialized yet."""
    global client, db
    if db is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "stumpostats")
        client = AsyncIOMotorClient(mongo_uri)
        db = client[db_name]
        print(f"✅ Connected to MongoDB: {db_name}")

async def connect_db():
    """Connect to MongoDB on app startup."""
    global client, db
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "stumpostats")
    client = AsyncIOMotorClient(mongo_uri)
    db = client[db_name]
    print(f"✅ MongoDB connected: {db_name}")

async def close_db():
    """Close MongoDB connection on app shutdown."""
    global client
    if client:
        client.close()

def get_db():
    """Return the active database instance."""
    _ensure_connected()
    return db

# ── Collection Helpers ──────────────────────────────────────────────────────
def get_users_collection():
    _ensure_connected()
    return db["users"]

def get_players_collection():
    _ensure_connected()
    return db["players"]

def get_matches_collection():
    _ensure_connected()
    return db["matches"]

def get_deliveries_collection():
    _ensure_connected()
    return db["deliveries"]

def get_predictions_collection():
    _ensure_connected()
    return db["predictions"]
