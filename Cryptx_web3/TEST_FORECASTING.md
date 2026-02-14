# Testing AI Forecasting Feature

## ✅ Setup Complete!

Your Hugging Face API key has been added to `.env`:
```
HUGGINGFACE_API_KEY=hf_***WIOO
```

## 🚀 Start the Application

### Terminal 1 - Backend API
```bash
cd apps/api
npm run dev
```

Expected output:
```
✅ Database connected
✅ Redis connected (or warning if disabled)
🚀 Server running on http://localhost:5001
```

### Terminal 2 - Frontend
```bash
cd apps/web
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

## 🧪 Test the Feature

### 1. Access the Dashboard
Open: http://localhost:3000/dashboard/forecasting

### 2. Test Flow:
1. **Login** (if not already logged in)
2. **Select a cryptocurrency** from the dropdown (e.g., BTC_USDT)
3. **Wait for forecast** (should take 2-5 seconds)
4. **View results**:
   - Current price
   - 24h, 7d, 30d forecasts
   - Risk score and category
   - Volatility metrics
   - Market sentiment
   - Recommendations

### 3. Test API Directly (Optional)

Get your auth token from browser DevTools (localStorage.token), then:

```bash
# Get supported symbols
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/forecasting/supported-symbols

# Get forecast for BTC
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/forecasting/BTC_USDT
```

## 🎯 Expected Behavior

### First Request (Cache Miss):
- Takes 2-5 seconds
- Fetches 90 days of historical data from CoinGecko
- Calculates technical indicators
- Performs risk analysis
- Calls Hugging Face Chronos API for predictions
- Caches result for 1 hour

### Subsequent Requests (Cache Hit):
- Returns instantly (<100ms)
- Serves cached forecast
- Cache expires after 1 hour

## 🐛 Troubleshooting

### "Failed to generate forecast"
**Check:**
1. Backend is running on port 5001
2. Database connection is working
3. HF API key is valid
4. Check backend logs for errors

**Solution:**
```bash
# Check backend logs
cd apps/api
npm run dev
# Look for error messages
```

### "Unsupported symbol"
**Supported symbols:**
- BTC_USDT, ETH_USDT, BNB_USDT
- SOL_USDT, ADA_USDT, XRP_USDT
- DOT_USDT, MATIC_USDT, LINK_USDT
- UNI_USDT, AVAX_USDT, TRX_USDT

### "Insufficient historical data"
**Cause:** CoinGecko doesn't have enough data for that symbol
**Solution:** Try a different cryptocurrency

### Rate Limit Errors
**Cause:** Too many requests to Hugging Face API
**Solution:** 
- Wait a few minutes
- System will automatically fall back to trend-based forecasting
- Consider upgrading to HF Pro for higher limits

## 📊 Sample Response

```json
{
  "symbol": "BTC_USDT",
  "currentPrice": 45000,
  "forecasts": [
    {
      "horizon": "24h",
      "predictedPrice": {
        "low": 44500,
        "mid": 45200,
        "high": 45900
      },
      "confidence": 75,
      "trend": "bullish",
      "trendStrength": 65,
      "momentum": 12
    }
  ],
  "riskAnalysis": {
    "riskScore": 55,
    "riskCategory": "Medium Risk",
    "volatility": 45.2,
    "sentiment": "Bullish",
    "recommendations": [
      "Consider position sizing based on Medium Risk classification",
      "Market sentiment is Bullish - monitor for trend continuation"
    ]
  },
  "technicalIndicators": { ... },
  "generatedAt": "2026-01-30T..."
}
```

## ✨ Features to Test

1. **Symbol Selection** - Try different cryptocurrencies
2. **Loading States** - Watch the spinner while generating
3. **Error Handling** - Try an invalid symbol
4. **Caching** - Request same symbol twice (second should be instant)
5. **Dark Mode** - Toggle system theme
6. **Responsive Design** - Test on mobile/tablet
7. **Navigation** - Use the "AI Forecasting" tab in dashboard nav

## 🎉 Success Indicators

✅ Backend starts without errors
✅ Frontend loads the forecasting page
✅ Can select a cryptocurrency
✅ Forecast generates successfully
✅ Risk metrics display correctly
✅ Recommendations appear
✅ Second request is instant (cached)

## 📝 Notes

- **First forecast** may take 5-10 seconds (fetching data + AI prediction)
- **Cached forecasts** return instantly
- **Cache expires** after 1 hour
- **Fallback** to trend-based forecasting if HF API fails
- **Free tier** has rate limits (consider upgrading for production)

Enjoy your AI-powered crypto forecasting! 🚀
