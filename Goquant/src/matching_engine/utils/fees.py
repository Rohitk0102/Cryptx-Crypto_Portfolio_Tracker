"""Fee calculation utilities for maker-taker fee model."""

from decimal import Decimal
from typing import Tuple


class FeeCalculator:
    """
    Calculates trading fees using maker-taker model.
    
    Maker fees are charged to orders that provide liquidity (resting orders).
    Taker fees are charged to orders that remove liquidity (incoming orders).
    """
    
    def __init__(
        self,
        maker_fee_rate: Decimal = Decimal("0.001"),  # 0.1% default
        taker_fee_rate: Decimal = Decimal("0.002")   # 0.2% default
    ):
        """
        Initialize fee calculator.
        
        Args:
            maker_fee_rate: Fee rate for makers (e.g., 0.001 = 0.1%)
            taker_fee_rate: Fee rate for takers (e.g., 0.002 = 0.2%)
        """
        self.maker_fee_rate = maker_fee_rate
        self.taker_fee_rate = taker_fee_rate
    
    def calculate_fees(
        self,
        trade_value: Decimal
    ) -> Tuple[Decimal, Decimal]:
        """
        Calculate maker and taker fees for a trade.
        
        Args:
            trade_value: Total value of trade (price * quantity)
            
        Returns:
            Tuple of (maker_fee, taker_fee)
        """
        maker_fee = trade_value * self.maker_fee_rate
        taker_fee = trade_value * self.taker_fee_rate
        
        # Round to 8 decimal places (standard for crypto)
        maker_fee = maker_fee.quantize(Decimal("0.00000001"))
        taker_fee = taker_fee.quantize(Decimal("0.00000001"))
        
        return maker_fee, taker_fee
    
    def calculate_maker_fee(self, trade_value: Decimal) -> Decimal:
        """Calculate maker fee only."""
        fee = trade_value * self.maker_fee_rate
        return fee.quantize(Decimal("0.00000001"))
    
    def calculate_taker_fee(self, trade_value: Decimal) -> Decimal:
        """Calculate taker fee only."""
        fee = trade_value * self.taker_fee_rate
        return fee.quantize(Decimal("0.00000001"))
    
    def get_net_proceeds(
        self,
        trade_value: Decimal,
        is_maker: bool
    ) -> Decimal:
        """
        Calculate net proceeds after fees.
        
        Args:
            trade_value: Total value of trade
            is_maker: True if maker, False if taker
            
        Returns:
            Net proceeds after fee deduction
        """
        if is_maker:
            fee = self.calculate_maker_fee(trade_value)
        else:
            fee = self.calculate_taker_fee(trade_value)
        
        return trade_value - fee
    
    def set_maker_fee_rate(self, rate: Decimal):
        """Update maker fee rate."""
        self.maker_fee_rate = rate
    
    def set_taker_fee_rate(self, rate: Decimal):
        """Update taker fee rate."""
        self.taker_fee_rate = rate
    
    def get_fee_rates(self) -> Tuple[Decimal, Decimal]:
        """Get current fee rates."""
        return self.maker_fee_rate, self.taker_fee_rate


# Default fee calculator instance
default_fee_calculator = FeeCalculator()
