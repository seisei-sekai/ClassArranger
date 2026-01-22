"""
Mock Authentication Service
用于演示和开发环境，不需要Firebase
"""
from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext

# JWT配置
SECRET_KEY = "mock_secret_key_for_development_only_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7天

# 密码加密
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Mock用户数据库（内存中）- 使用已经hash好的密码避免启动时的bcrypt问题
# Pre-hashed passwords to avoid bcrypt issues at startup
MOCK_USERS = {
    "test@example.com": {
        "id": "mock-user-1",
        "email": "test@example.com",
        "username": "测试用户",
        # password: "password"
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyC6Fq4G8RUy",
        "created_at": datetime.utcnow(),
    },
    "admin@example.com": {
        "id": "mock-user-2",
        "email": "admin@example.com",
        "username": "管理员",
        # password: "admin123"
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
        "created_at": datetime.utcnow(),
    },
}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """加密密码"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """创建JWT Token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """解码JWT Token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def authenticate_user(email: str, password: str) -> Optional[dict]:
    """认证用户"""
    user = MOCK_USERS.get(email)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


def register_user(email: str, password: str, username: str) -> dict:
    """注册新用户（Mock版本，保存到内存）"""
    if email in MOCK_USERS:
        raise ValueError("用户已存在")
    
    user_id = f"mock-user-{len(MOCK_USERS) + 1}"
    user = {
        "id": user_id,
        "email": email,
        "username": username,
        "hashed_password": get_password_hash(password),
        "created_at": datetime.utcnow(),
    }
    MOCK_USERS[email] = user
    return user


def get_user_by_email(email: str) -> Optional[dict]:
    """根据邮箱获取用户"""
    return MOCK_USERS.get(email)


def get_user_by_id(user_id: str) -> Optional[dict]:
    """根据ID获取用户"""
    for user in MOCK_USERS.values():
        if user["id"] == user_id:
            return user
    return None

