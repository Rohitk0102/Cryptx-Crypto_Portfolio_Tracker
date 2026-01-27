"""Custom exceptions for the matching engine."""


class MatchingEngineError(Exception):
    """Base exception for matching engine errors."""
    pass


class OrderValidationError(MatchingEngineError):
    """Raised when order parameters are invalid."""
    pass


class InsufficientLiquidityError(MatchingEngineError):
    """Raised when FOK order cannot be completely filled."""
    pass


class OrderNotFoundError(MatchingEngineError):
    """Raised when order ID is not found."""
    pass


class InvalidSymbolError(MatchingEngineError):
    """Raised when trading symbol is invalid or not supported."""
    pass
