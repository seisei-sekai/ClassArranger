"""
Authentication Routes - Mock版本
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta

from app.services.mock_auth_service import (
    authenticate_user,
    register_user,
    create_access_token,
    decode_token,
    get_user_by_id,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    username: str


# Dependency: 验证Token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """从Token获取当前用户"""
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
    
    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    """
    注册新用户
    
    Mock模式下，用户数据保存在内存中（重启后会丢失）
    """
    try:
        user = register_user(
            email=request.email,
            password=request.password,
            username=request.username
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # 创建Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
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
        }
    }


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    用户登录
    
    Mock模式下的测试账号：
    - test@example.com / password
    - admin@example.com / admin123
    """
    user = authenticate_user(request.email, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # 创建Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
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
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    获取当前用户信息
    """
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "username": current_user["username"],
    }


@router.post("/logout")
async def logout():
    """
    登出（Mock版本，实际上JWT是无状态的）
    """
    return {"message": "Logged out successfully"}


@router.get("/test-accounts")
async def get_test_accounts():
    """
    获取测试账号列表（仅用于开发）
    """
    return {
        "accounts": [
            {"email": "test@example.com", "password": "password", "username": "测试用户"},
            {"email": "admin@example.com", "password": "admin123", "username": "管理员"},
        ],
        "note": "这是Mock模式下的测试账号，生产环境请禁用此接口"
    }

