# AI Service - Crypto Portfolio Tracker

Python-based AI service providing machine learning analytics for cryptocurrency portfolios.

## Architecture Layer

This is **Layer 3** of the 3-layer architecture:
- Receives requests from Backend (Layer 2)
- Provides AI-powered analytics
- Independent microservice

## Tech Stack

- Python 3.10+
- FastAPI
- TensorFlow/Keras (LSTM models)
- PyPortfolioOpt (MPT optimization)
- NumPy, Pandas (data processing)

## Project Structure

```
ai-service/
├── models/              # Trained ML models
│   ├── lstm_price_forecast.h5
│   └── mpt_optimizer.pkl
├── services/            # AI service implementations
│   ├── lstm_forecast.py    # LSTM price forecasting
│   ├── mpt_optimizer.py    # Portfolio optimization
│   └── risk_analysis.py    # Risk analysis
├── utils/               # Data processing utilities
├── main.py              # FastAPI application
└── requirements.txt
```

## Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `LSTM_MODEL_PATH`: Path to LSTM model file
- `MPT_MODEL_PATH`: Path to MPT model file
- `DATA_SOURCE_URL`: Historical data API URL

## Development

```bash
# Start development server with hot reload
uvicorn main:app --reload

# Run tests
pytest

# Run linting
flake8 .

# Format code
black .

# Type checking
mypy .
```

## API Endpoints

### Price Forecasting
- `POST /api/forecast-prices` - Generate price forecasts using LSTM

### Portfolio Optimization
- `POST /api/analyze-diversification` - Optimize portfolio allocation using MPT

### Risk Analysis
- `POST /api/analyze-risk` - Analyze portfolio risk metrics

### Health
- `GET /health` - Health check endpoint

## AI Models

### LSTM Price Forecasting
- **Purpose**: Predict cryptocurrency prices
- **Input**: Historical price data
- **Output**: 7-day and 30-day forecasts with confidence intervals
- **Model**: Long Short-Term Memory neural network

### MPT Portfolio Optimization
- **Purpose**: Optimize asset allocation
- **Input**: Current portfolio composition
- **Output**: Recommended allocation, Sharpe ratio, risk metrics
- **Model**: Modern Portfolio Theory (Markowitz)

### Risk Analysis
- **Purpose**: Assess portfolio risk
- **Input**: Portfolio composition and market data
- **Output**: Risk score, concentration risk, volatility, VaR
- **Model**: Statistical analysis

## Layer Communication

```
Backend (Layer 2)
    ↓ HTTP REST API
AI Service (Layer 3) ← You are here
    ↓
Historical Market Data APIs
```

## Development Guidelines

- Keep models in separate service classes
- Cache predictions for 24 hours
- Validate all inputs with Pydantic
- Handle errors gracefully
- Log model performance metrics
- Use async/await for I/O operations

## Port

Default: `8000`

## Model Training

Models should be trained separately and saved to the `models/` directory. Training scripts are not included in this service.
