"""Pytest configuration and shared fixtures."""

import pytest
from decimal import Decimal
from datetime import datetime


@pytest.fixture
def sample_symbol():
    """Sample trading symbol."""
    return "BTC-USDT"


@pytest.fixture
def base_price():
    """Base price for test orders."""
    return Decimal("50000.00")
