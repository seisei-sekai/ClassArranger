from app.core.database import get_database
from app.models.user import UserCreate, UserInDB, UserResponse
from datetime import datetime
from bson import ObjectId


async def create_user(user: UserCreate) -> UserResponse:
    """Create a new user (placeholder implementation)."""
    db = get_database()
    user_dict = {
        "email": user.email,
        "username": user.username,
        "hashed_password": user.password,  # TODO: Hash password properly
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    return UserResponse(
        id=str(result.inserted_id),
        email=user.email,
        username=user.username,
        created_at=user_dict["created_at"],
    )


async def get_user_by_id(user_id: str) -> UserResponse | None:
    """Get user by ID."""
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user:
        return UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            username=user["username"],
            created_at=user["created_at"],
        )
    return None


async def get_user_by_email(email: str) -> UserInDB | None:
    """Get user by email."""
    db = get_database()
    user = await db.users.find_one({"email": email})
    if user:
        return UserInDB(**user)
    return None
