from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Development mode
    dev_mode: bool = True

    # MongoDB
    mongodb_url: str = "mongodb://mongodb:27017"
    mongodb_db_name: str = "xdf_class_arranger"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
