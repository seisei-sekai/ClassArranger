from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Development mode
    dev_mode: bool = True

    # MongoDB
    mongodb_url: str = "mongodb://mongodb:27017"
    mongodb_db_name: str = "xdf_class_arranger"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # JWT Authentication
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Admin Account (from environment variables)
    admin_email: str = "admin@xdf.com"
    admin_password: str = "admin123"
    admin_username: str = "Administrator"
    
    # Backup Settings
    backup_enabled: bool = False
    backup_path: str = "./backups"
    
    # OpenAI API (optional)
    openai_api_key: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
