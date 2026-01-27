"""Main entry point for the matching engine application."""

import uvicorn
from .utils.config import get_settings


def main():
    """Run the matching engine application."""
    settings = get_settings()
    
    uvicorn.run(
        "matching_engine.api.app:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=False,  # Set to True for development
        log_level=settings.log_level.lower()
    )


if __name__ == "__main__":
    main()
