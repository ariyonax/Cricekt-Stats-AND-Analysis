import asyncio
from utils.database import get_users_collection
from utils.auth import hash_password
from datetime import datetime

async def test():
    try:
        users = get_users_collection()
        print("✅ Got users collection")

        result = await users.find_one({"username": "test"})
        print("✅ DB query OK:", result)

        # Try inserting a test user
        user_doc = {
            "username": "testuser",
            "email": "test@test.com",
            "password": hash_password("password123"),
            "role": "admin",
            "created_at": datetime.utcnow()
        }
        insert_result = await users.insert_one(user_doc)
        print("✅ Insert OK:", insert_result.inserted_id)

        # Clean up
        await users.delete_one({"username": "testuser"})
        print("✅ Cleanup OK")

    except Exception as e:
        print("❌ ERROR:", type(e).__name__, str(e))

asyncio.run(test())
