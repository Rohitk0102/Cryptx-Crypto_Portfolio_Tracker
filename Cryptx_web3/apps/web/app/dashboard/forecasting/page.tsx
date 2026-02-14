'use client';

import { useState, useEffect } from 'react';
import { forecastingApi, ForecastData } from '@/lib/forecastingApi';

interface TokenOverview {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: string;
  icon: string;
}

export default function ForecastingPage() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<number>(1000);
  const [tokenOverviews, setTokenOverviews] = useState<TokenOverview[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'gainers' | 'losers'>('all');

  useEffect(() => {
    loadSymbols();
    loadTokenOverviews();
  }, []);

  useEffect(() => {
    // Auto-load forecast when symbol is selected
    if (selectedSymbol) {
      loadForecast(selectedSymbol);
    }
  }, [selectedSymbol]);

  const loadTokenOverviews = async () => {
    // Fetch current prices for all tokens
    const tokenData: TokenOverview[] = [
      { symbol: 'BTC_USDT', name: 'Bitcoin', price: 0, change24h: 0, marketCap: '', icon: '₿' },
      { symbol: 'ETH_USDT', name: 'Ethereum', price: 0, change24h: 0, marketCap: '', icon: 'Ξ' },
      { symbol: 'BNB_USDT', name: 'BNB', price: 0, change24h: 0, marketCap: '', icon: '🔶' },
      { symbol: 'SOL_USDT', name: 'Solana', price: 0, change24h: 0, marketCap: '', icon: '◎' },
      { symbol: 'ADA_USDT', name: 'Cardano', price: 0, change24h: 0, marketCap: '', icon: '₳' },
      { symbol: 'XRP_USDT', name: 'XRP', price: 0, change24h: 0, marketCap: '', icon: '✕' },
      { symbol: 'DOT_USDT', name: 'Polkadot', price: 0, change24h: 0, marketCap: '', icon: '●' },
      { symbol: 'MATIC_USDT', name: 'Polygon', price: 0, change24h: 0, marketCap: '', icon: '⬡' },
      { symbol: 'LINK_USDT', name: 'Chainlink', price: 0, change24h: 0, marketCap: '', icon: '🔗' },
      { symbol: 'UNI_USDT', name: 'Uniswap', price: 0, change24h: 0, marketCap: '', icon: '🦄' },
      { symbol: 'AVAX_USDT', name: 'Avalanche', price: 0, change24h: 0, marketCap: '', icon: '🔺' },
      { symbol: 'TRX_USDT', name: 'TRON', price: 0, change24h: 0, marketCap: '', icon: '◬' },
    ];

    // Fetch real prices from CoinGecko
    try {
      const coinIds = [
        'bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano', 'ripple',
        'polkadot', 'polygon', 'chainlink', 'uniswap', 'avalanche-2', 'tron'
      ];
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc`
      );
      
      if (response.ok) {
        const data = await response.json();
        data.forEach((coin: any, index: number) => {
          if (tokenData[index]) {
            tokenData[index].price = coin.current_price;
            tokenData[index].change24h = coin.price_change_percentage_24h || 0;
            tokenData[index].marketCap = `$${(coin.market_cap / 1e9).toFixed(2)}B`;
          }
        });
      }
    } catch (err) {
      console.error('Error fetching token prices:', err);
    }

    setTokenOverviews(tokenData);
  };

  const loadSymbols = async () => {
    try {
      const data = await forecastingApi.getSupportedSymbols();
      setSymbols(data);
      if (data.length > 0) {
        setSelectedSymbol(data[0]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadForecast = async (symbol: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await forecastingApi.getForecast(symbol);
      setForecast(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    loadForecast(symbol);
  };

  const getRiskColor = (category: string) => {
    if (category.includes('High')) return 'text-red-500';
    if (category.includes('Medium')) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'bullish') return '📈';
    if (trend === 'bearish') return '📉';
    return '➡️';
  };

  const calculateProfitLoss = (currentPrice: number, predictedPrice: number) => {
    const change = ((predictedPrice - currentPrice) / currentPrice) * 100;
    const isProfit = change > 0;
    const amount = (investmentAmount * change) / 100;
    
    return {
      isProfit,
      percentage: Math.abs(change),
      amount: Math.abs(amount),
      change
    };
  };

  const getRecommendation = (trend: string, confidence: number, riskScore: number) => {
    if (riskScore > 70) {
      return { text: '⚠️ High Risk - Consider waiting', color: 'text-red-600 dark:text-red-400' };
    }
    if (trend === 'bullish' && confidence > 60) {
      return { text: '✅ Good time to invest', color: 'text-green-600 dark:text-green-400' };
    }
    if (trend === 'bearish' && confidence > 60) {
      return { text: '⚠️ Consider selling or waiting', color: 'text-orange-600 dark:text-orange-400' };
    }
    return { text: '⏸️ Market uncertain - be cautious', color: 'text-yellow-600 dark:text-yellow-400' };
  };

  const getFilteredTokens = () => {
    if (activeTab === 'gainers') {
      return tokenOverviews.filter(t => t.change24h > 0).sort((a, b) => b.change24h - a.change24h);
    }
    if (activeTab === 'losers') {
      return tokenOverviews.filter(t => t.change24h < 0).sort((a, b) => a.change24h - b.change24h);
    }
    return tokenOverviews;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Forecasting & Risk Analysis
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Get AI-powered predictions to make smarter investment decisions
        </p>

        {/* Token Cards Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Select Token for Forecast
            </h2>
            
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                All Tokens
              </button>
              <button
                onClick={() => setActiveTab('gainers')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'gainers'
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Gainers 📈
              </button>
              <button
                onClick={() => setActiveTab('losers')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'losers'
                    ? 'bg-red-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Losers 📉
              </button>
            </div>
          </div>

          {/* Token Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {getFilteredTokens().map((token) => (
              <button
                key={token.symbol}
                onClick={() => setSelectedSymbol(token.symbol)}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                  selectedSymbol === token.symbol
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{token.icon}</span>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">{token.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{token.symbol.replace('_', '/')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${token.price.toLocaleString()}
                  </p>
                  <p className={`text-sm font-semibold ${
                    token.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                  </p>
                </div>
                
                {token.marketCap && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    MCap: {token.marketCap}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Investment Amount Input */}
        {selectedSymbol && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Investment Amount (USD)
            </label>
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value))}
              min="1"
              step="100"
              className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Generating AI forecast...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={() => loadForecast(selectedSymbol)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Forecast Display */}
        {forecast && !loading && (
          <div className="space-y-6">
            {/* Quick Summary Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedSymbol.replace('_', '/')}</h2>
                  <p className="text-blue-100">Current Price: ${forecast.currentPrice.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  {(() => {
                    const rec = getRecommendation(
                      forecast.forecasts[1]?.trend || 'neutral',
                      forecast.forecasts[1]?.confidence || 0,
                      forecast.riskAnalysis.riskScore
                    );
                    return <p className="text-lg font-semibold bg-white/20 px-4 py-2 rounded-lg">{rec.text}</p>;
                  })()}
                </div>
              </div>
            </div>

            {/* Profit/Loss Predictions */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                💰 Profit/Loss Predictions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                If you invest ${investmentAmount.toLocaleString()} now, here's what you could expect:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {forecast.forecasts.map((f) => {
                  const pl = calculateProfitLoss(forecast.currentPrice, f.predictedPrice.mid);
                  const horizonLabels: Record<string, string> = {
                    '24h': '1 Day',
                    '7d': '1 Week',
                    '30d': '1 Month'
                  };
                  
                  return (
                    <div 
                      key={f.horizon} 
                      className={`rounded-lg shadow-lg p-6 border-2 ${
                        pl.isProfit 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                          : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {horizonLabels[f.horizon]}
                        </h3>
                        <span className="text-2xl">{getTrendIcon(f.trend)}</span>
                      </div>
                      
                      {/* Profit/Loss Badge */}
                      <div className={`text-center py-4 rounded-lg mb-4 ${
                        pl.isProfit 
                          ? 'bg-green-100 dark:bg-green-800/30' 
                          : 'bg-red-100 dark:bg-red-800/30'
                      }`}>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Expected {pl.isProfit ? 'Profit' : 'Loss'}
                        </p>
                        <p className={`text-3xl font-bold ${
                          pl.isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {pl.isProfit ? '+' : '-'}${pl.amount.toFixed(2)}
                        </p>
                        <p className={`text-lg font-semibold ${
                          pl.isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {pl.isProfit ? '+' : '-'}{pl.percentage.toFixed(2)}%
                        </p>
                      </div>

                      {/* Price Range */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Best Case:</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            ${f.predictedPrice.high.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Expected:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ${f.predictedPrice.mid.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Worst Case:</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            ${f.predictedPrice.low.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Confidence */}
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {f.confidence.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              f.confidence > 70 ? 'bg-green-500' : 
                              f.confidence > 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${f.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk Analysis - Beginner Friendly */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🛡️ Risk Analysis - Should You Invest?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Risk Score */}
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Risk Level</p>
                  <div className={`text-4xl font-bold mb-2 ${getRiskColor(forecast.riskAnalysis.riskCategory)}`}>
                    {forecast.riskAnalysis.riskScore.toFixed(0)}/100
                  </div>
                  <p className={`text-lg font-semibold ${getRiskColor(forecast.riskAnalysis.riskCategory)}`}>
                    {forecast.riskAnalysis.riskCategory}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {forecast.riskAnalysis.riskScore < 40 
                      ? 'Relatively safe investment' 
                      : forecast.riskAnalysis.riskScore < 70 
                      ? 'Moderate risk - be cautious' 
                      : 'High risk - only invest what you can afford to lose'}
                  </p>
                </div>

                {/* Volatility */}
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Price Volatility</p>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {forecast.riskAnalysis.volatility.toFixed(1)}%
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {forecast.riskAnalysis.volatility < 30 
                      ? 'Stable' 
                      : forecast.riskAnalysis.volatility < 60 
                      ? 'Moderate Swings' 
                      : 'Very Volatile'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    How much the price moves up and down
                  </p>
                </div>

                {/* Market Sentiment */}
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Market Sentiment</p>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2 capitalize">
                    {forecast.riskAnalysis.sentiment}
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {forecast.riskAnalysis.sentiment === 'bullish' 
                      ? '📈 Positive Outlook' 
                      : forecast.riskAnalysis.sentiment === 'bearish' 
                      ? '📉 Negative Outlook' 
                      : '➡️ Neutral Outlook'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Overall market mood
                  </p>
                </div>
              </div>

              {/* Beginner-Friendly Recommendations */}
              {forecast.riskAnalysis.recommendations.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="mr-2">💡</span>
                    What This Means For You
                  </h3>
                  <ul className="space-y-2">
                    {forecast.riskAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-500 mr-2 mt-1">•</span>
                        <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Educational Note */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <span className="mr-2">⚠️</span>
                Important Disclaimer
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                These predictions are based on AI analysis and historical data. Cryptocurrency markets are highly volatile 
                and unpredictable. Never invest more than you can afford to lose. This is not financial advice - always 
                do your own research and consider consulting with a financial advisor.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
