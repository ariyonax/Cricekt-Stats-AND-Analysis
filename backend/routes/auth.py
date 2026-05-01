# StumpStats - Authentication Routes
# US5: Secure login with JWT + role-based access (admin, analyst, fan)

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from models.schemas import UserRegister, UserLogin, TokenResponse, UserOut
from utils.auth import hash_password, verify_password, create_access_token, get_current_user
from utils.database import get_users_collection
from datetime import datetime

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=201)
async def register(user: UserRegister):
    """
    Register a new user.
    Roles: admin | analyst | fan
    """
    users = get_users_collection()

    # Check if username already exists
    if await users.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check if email already exists
    if await users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Build user document
    user_doc = {
        "username": user.username,
        "email": user.email,
        "password": hash_password(user.password),   # bcrypt hashed
        "role": user.role.value,
        "created_at": datetime.utcnow()
    }

    await users.insert_one(user_doc)

    return UserOut(
        username=user.username,
        email=user.email,
        role=user.role.value,
        created_at=user_doc["created_at"]
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Login with username + password.
    Returns a JWT token valid for 24 hours.
    """
    users = get_users_collection()

    # Find user in DB
    user = await users.find_one({"username": credentials.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Create JWT token with username + role embedded
    token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=timedelta(hours=24)
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user["role"],
        username=user["username"]
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the currently logged-in user's profile."""
    users = get_users_collection()
    user = await users.find_one({"username": current_user["username"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserOut(
        username=user["username"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"]
    )


@router.get("/users")
async def list_users(current_user: dict = Depends(get_current_user)):
    """Admin only: list all registered users."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    users = get_users_collection()
    all_users = []
    async for u in users.find({}, {"password": 0}):  # exclude passwords
        u["_id"] = str(u["_id"])
        all_users.append(u)
    return all_users
