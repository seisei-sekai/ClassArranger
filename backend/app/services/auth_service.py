"""
Authentication Service
Real authentication service using MongoDB
"""
from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt

from app.core.config import settings
from app.repositories.user_repository import get_user_repository
from app.models.user import UserCreate


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """Hash password"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    
    Args:
        data: Data to encode in token
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    Decode JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except jwt.PyJWTError:
        return None


async def authenticate_user(email: str, password: str) -> Optional[dict]:
    """
    Authenticate user with email and password
    
    Args:
        email: User email
        password: Plain text password
        
    Returns:
        User document if authenticated, None otherwise
    """
    user_repo = get_user_repository()
    user = await user_repo.get_user_by_email(email)
    
    if not user:
        return None
    
    if not verify_password(password, user["hashed_password"]):
        return None
    
    return user


async def register_user(email: str, password: str, username: str, role: str = "student", description: Optional[str] = None) -> dict:
    """
    Register a new user
    
    Args:
        email: User email
        password: Plain text password
        username: Username
        role: User role (admin, teacher, staff, student)
        description: Optional description
        
    Returns:
        Created user document
        
    Raises:
        ValueError: If user already exists or validation fails
    """
    user_repo = get_user_repository()
    
    # Check if user exists
    if await user_repo.user_exists(email):
        raise ValueError("User with this email already exists")
    
    # Validate password
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    
    # Create user data
    user_data = {
        "email": email,
        "username": username,
        "hashed_password": get_password_hash(password),
        "role": role,
        "description": description
    }
    
    # Save to database
    user = await user_repo.create_user(user_data)
    return user


async def get_user_by_id(user_id: str) -> Optional[dict]:
    """
    Get user by ID
    
    Args:
        user_id: User ID
        
    Returns:
        User document or None
    """
    user_repo = get_user_repository()
    return await user_repo.get_user_by_id(user_id)


async def get_user_by_email(email: str) -> Optional[dict]:
    """
    Get user by email
    
    Args:
        email: User email
        
    Returns:
        User document or None
    """
    user_repo = get_user_repository()
    return await user_repo.get_user_by_email(email)


async def initialize_admin_user():
    """
    Initialize admin user from environment variables if not exists
    """
    user_repo = get_user_repository()
    
    # Check if admin exists
    admin_exists = await user_repo.user_exists(settings.admin_email)
    
    if not admin_exists:
        print(f"Creating admin user: {settings.admin_email}")
        await register_user(
            email=settings.admin_email,
            password=settings.admin_password,
            username=settings.admin_username,
            role="admin",
            description="System administrator"
        )
        print("Admin user created successfully")
    else:
        print("Admin user already exists")
