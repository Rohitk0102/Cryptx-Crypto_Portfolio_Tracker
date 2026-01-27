"""Configuration management using Pydantic settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Settings can be overridden by creating a .env file in the project root.
    """
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # Performance Configuration
    max_websocket_connections: int = 1000
    order_queue_size: int = 10000
    
    # Logging Configuration
    log_level: str = "INFO"
    log_format: str = "json"  # "json" or "console"
    
    # Persistence Configuration (Optional)
    enable_persistence: bool = False
    snapshot_interval_seconds: int = 60
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """
    Get application settings.
    
    Returns:
        Settings instance
    """
    return settings
