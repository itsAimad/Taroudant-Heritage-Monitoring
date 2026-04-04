from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    APP_ENV:                str   = 'development'
    APP_SECRET_KEY:         str
    FRONTEND_URL:           str   = 'http://localhost:8080'

    # Database
    DB_HOST:                str   = '127.0.0.1'
    DB_PORT:                int   = 3308
    DB_NAME:                str
    DB_USER:                str
    DB_PASSWORD:            str

    # JWT
    JWT_SECRET_KEY:         str
    JWT_ALGORITHM:          str   = 'HS256'
    JWT_ACCESS_EXPIRE_MINUTES:  int = 60
    JWT_REFRESH_EXPIRE_DAYS:    int = 7

    # Cookie names
    ACCESS_COOKIE_NAME:     str   = 'heritage_access'
    REFRESH_COOKIE_NAME:    str   = 'heritage_refresh'

    # Cookie flags
    COOKIE_SECURE:          bool  = False
    COOKIE_SAMESITE:        str   = 'lax'
    COOKIE_HTTPONLY:        bool  = True
    COOKIE_PATH:            str   = '/'

    # SMTP Configuration
    SMTP_HOST:              str   = 'smtp.gmail.com'
    SMTP_PORT:              int   = 587
    SMTP_USER:              str
    SMTP_PASSWORD:          str
    SMTP_FROM:              str   = 'noreply@heritage-taroudant.ma'

    class Config:
        env_file = '.env'
        extra    = 'ignore'

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
