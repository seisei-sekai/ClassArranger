from fastapi import APIRouter, HTTPException
from app.models.user import UserCreate, UserResponse
from app.services.user_service import create_user, get_user_by_id, get_user_by_email

router = APIRouter()


@router.post("/", response_model=UserResponse)
async def register_user(user: UserCreate):
    """Register a new user (placeholder)."""
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await create_user(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get user by ID (placeholder)."""
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
