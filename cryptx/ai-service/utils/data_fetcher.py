import httpx
import os
from typing import List, Dict, Optional
from datetime import datetime, timedelta

class DataFetcher:
    """Utility class for fetching historical cryptocurrency data"""
    
    def __init__(self):
        self.base_url = os.getenv("DATA_SOURCE_URL", "https://api.coingecko.com/api/v3")
        self.api_key = os.getenv("COINGECKO_API_KEY", "")
    
    async def fetch_historical_prices(
        self, 
        token_id: str, 
        days: int = 365,
        currency: str = "usd"
    ) -> List[Dict]:
        """
        Fetch historical price data for a token
        
        Args:
            token_id: CoinGecko token ID (e.g., 'bitcoin', 'ethereum')
            days: Number of days of historical data
            currency: Currency for prices (default: 'usd')
        
        Returns:
            List of price data points
        """
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/coins/{token_id}/market_chart"
                params = {
                    "vs_currency": currency,
                    "days": days,
                    "interval": "daily"
                }
                
                if self.api_key:
                    params["x_cg_pro_api_key"] = self.api_key
                
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()
                
                data = response.json()
                
                # Format data
                prices = []
                for timestamp, price in data.get("prices", []):
                    prices.append({
                        "timestamp": datetime.fromtimestamp(timestamp / 1000),
                        "price": price
                    })
                
                return prices
                
        except Exception as e:
            print(f"Error fetching historical prices for {token_id}: {e}")
            return []
    
    async def fetch_current_price(
        self, 
        token_ids: List[str],
        currency: str = "usd"
    ) -> Dict[str, float]:
        """
        Fetch current prices for multiple tokens
        
        Args:
            token_ids: List of CoinGecko token IDs
            currency: Currency for prices (default: 'usd')
        
        Returns:
            Dictionary mapping token_id to current price
        """
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/simple/price"
                params = {
                    "ids": ",".join(token_ids),
                    "vs_currencies": currency,
                    "include_24hr_change": "true",
                    "include_market_cap": "true"
                }
                
                if self.api_key:
                    params["x_cg_pro_api_key"] = self.api_key
                
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()
                
                data = response.json()
                
                # Extract prices
                prices = {}
                for token_id, token_data in data.items():
                    prices[token_id] = token_data.get(currency, 0)
                
                return prices
                
        except Exception as e:
            print(f"Error fetching current prices: {e}")
            return {}
    
    def normalize_data(self, prices: List[float]) -> List[float]:
        """
        Normalize price data for ML model input
        
        Args:
            prices: List of price values
        
        Returns:
            Normalized prices (0-1 range)
        """
        if not prices:
            return []
        
        min_price = min(prices)
        max_price = max(prices)
        
        if max_price == min_price:
            return [0.5] * len(prices)
        
        return [(p - min_price) / (max_price - min_price) for p in prices]
    
    def denormalize_data(
        self, 
        normalized_prices: List[float],
        original_min: float,
        original_max: float
    ) -> List[float]:
        """
        Denormalize price data back to original scale
        
        Args:
            normalized_prices: Normalized price values
            original_min: Original minimum price
            original_max: Original maximum price
        
        Returns:
            Denormalized prices
        """
        return [
            p * (original_max - original_min) + original_min 
            for p in normalized_prices
        ]
