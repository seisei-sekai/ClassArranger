"""
Authentication Routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta

from app.services.auth_service import (
    authenticate_user,
    register_user,
    create_access_token,
    decode_token,
    get_user_by_id,
)
from app.core.config import settings
from app.models.user import UserRole

router = APIRouter()
security = HTTPBearer()


# Pydantic Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: str
    role: UserRole = "student"
    description: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    description: Optional[str] = None


# Dependency: Get current user with await
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    user = await get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user


# Dependency: Require admin role
async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Require admin role for endpoint access"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    admin_user: dict = Depends(require_admin)
):
    """
    Register new user (Admin only)
    
    Only administrators can register new users with specific roles.
    """
    try:
        user = await register_user(
            email=request.email,
            password=request.password,
            username=request.username,
            role=request.role,
            description=request.description
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Create token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"]},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "role": user.get("role", "student"),
            "description": user.get("description")
        }
    }


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    User login
    
    Returns JWT token on successful authentication.
    """
    user = await authenticate_user(request.email, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Create token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"]},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "role": user.get("role", "student"),
            "description": user.get("description")
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "username": current_user["username"],
        "role": current_user.get("role", "student"),
        "description": current_user.get("description")
    }


@router.post("/logout")
async def logout():
    """Logout (JWT is stateless, client should discard token)"""
    return {"message": "Logged out successfully"}

