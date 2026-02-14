# AI Forecasting & Risk Analysis - Setup Guide

## ✅ Implementation Complete

The AI Forecasting feature has been successfully implemented using **Hugging Face Chronos API** for price predictions.

## 🏗️ Architecture

### Backend Components:
1. **AIForecaster** (`apps/api/src/services/aiForecaster.ts`)
   - Calls Hugging Face Chronos API for AI-powered predictions
   - Falls back to trend-based forecasting if API fails
   - Generates 24h, 7d, and 30d forecasts

2. **ForecastingService** (`apps/api/src/services/forecasting.service.ts`)
   - Orchestrates market data fetching, technical analysis, risk analysis, and AI forecasting
   - Implements 1-hour caching to reduce API calls
   - Supports 12 major cryptocurrencies

3. **ForecastingController** (`apps/api/src/controllers/forecasting.controller.ts`)
   - API endpoints for forecasts and supported symbols

4. **Routes** (`apps/api/src/routes/forecasting.routes.ts`)
   - `GET /api/forecasting/:symbol` - Get forecast for a symbol
   - `GET /api/forecasting/supported-symbols` - List supported symbols

### Frontend Components:
1. **Forecasting API Client** (`apps/web/lib/forecastingApi.ts`)
2. **Forecasting Dashboard** (`apps/web/app/dashboard/forecasting/page.tsx`)
3. **Navigation** - Added to dashboard nav

## 🔧 Setup Instructions

### 1. Get Hugging Face API Key (Free)
1. Go to https://huggingface.co/settings/tokens
2. Create a new token (read access is sufficient)
3. Copy the token

### 2. Configure Environment Variables
Add to `apps/api/.env`:
```bash
HUGGINGFACE_API_KEY=your_hf_token_here
```

### 3. Run Database Migration
The ForecastCache model already exists in the schema:
```bash
cd apps/api
npx prisma generate
```

### 4. Start the Application
```bash
# Terminal 1 - Backend
cd apps/api
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

### 5. Access the Feature
Navigate to: http://localhost:3000/dashboard/forecasting

## 📊 Supported Cryptocurrencies
- BTC/USDT
- ETH/USDT
- BNB/USDT
- SOL/USDT
- ADA/USDT
- XRP/USDT
- DOT/USDT
- MATIC/USDT
- LINK/USDT
- UNI/USDT
- AVAX/USDT
- TRX/USDT

## 🎯 Features

### AI-Powered Forecasts:
- **24-hour forecast** - Short-term price predictions
- **7-day forecast** - Weekly trend analysis
- **30-day forecast** - Long-term projections
- **Confidence levels** - Adjusted based on volatility
- **Price ranges** - Low, mid, and high estimates

### Risk Analysis:
- **Risk Score** (0-100) - Overall risk assessment
- **Risk Category** - Low/Medium/High classification
- **Volatility Metrics** - Annualized volatility percentage
- **Market Sentiment** - Bullish/Bearish/Neutral classification
- **Recommendations** - Actionable advice based on analysis

### Technical Indicators:
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands
- Moving Averages (7d, 30d, 90d)

## 🔄 How It Works

1. **User selects a cryptocurrency** from the dropdown
2. **System checks cache** (1-hour expiration)
3. **If cache miss**:
   - Fetches 90 days of historical data from CoinGecko
   - Calculates technical indicators
   - Performs risk analysis
   - Calls Hugging Face Chronos API for AI predictions
   - Caches the result
4. **Displays forecast** with visualizations and recommendations

## 🚀 API Usage

### Get Forecast
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/forecasting/BTC_USDT
```

### Get Supported Symbols
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/forecasting/supported-symbols
```

## 🎨 UI Features

- **Symbol Selector** - Dropdown to choose cryptocurrency
- **Loading States** - Spinner while generating forecast
- **Error Handling** - Retry button on failures
- **Responsive Design** - Works on mobile and desktop
- **Dark Mode Support** - Follows system theme

## 📝 Notes

- **Free Tier**: Hugging Face Inference API has rate limits on the free tier
- **Fallback**: If HF API fails, system uses trend-based forecasting
- **Caching**: Forecasts are cached for 1 hour to reduce API calls
- **Data Source**: Uses CoinGecko API for market data (free, no key required)

## 🐛 Troubleshooting

### "Failed to generate forecast"
- Check if HUGGINGFACE_API_KEY is set in `.env`
- Verify the API key is valid
- Check if the symbol is supported

### "Insufficient historical data"
- The system needs at least 30 days of data
- Try a different cryptocurrency

### Rate Limit Errors
- Wait a few minutes and try again
- Consider upgrading to HF Pro for higher limits
- System will automatically fall back to trend-based forecasting

## ✨ Future Enhancements

- Add chart visualizations for forecasts
- Support more cryptocurrencies
- Add historical forecast accuracy tracking
- Implement ML model fine-tuning
- Add portfolio-level risk analysis
