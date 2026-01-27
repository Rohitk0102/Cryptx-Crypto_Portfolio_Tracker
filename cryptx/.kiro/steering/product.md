# Product Overview

## Crypto Portfolio Tracker

A web-based cryptocurrency portfolio tracking application that enables users to connect their wallets (MetaMask and WalletConnect) and monitor their digital assets across multiple blockchain networks with AI-powered analytics.

## Core Features

- **Wallet Integration**: Connect MetaMask or WalletConnect wallets to view portfolio holdings
- **Multi-Chain Support**: Track assets across Ethereum, Polygon, and Binance Smart Chain
- **Real-Time Portfolio Dashboard**: Display total portfolio value, token balances, allocation percentages, and 24-hour price changes with automatic updates every 60 seconds
- **Transaction History**: View paginated transaction history with details and blockchain explorer links
- **AI-Powered Analytics**:
  - Portfolio diversification recommendations using Modern Portfolio Theory (MPT)
  - Price forecasting (7-day and 30-day) using LSTM neural networks
  - Risk analysis with concentration, volatility, and liquidity metrics
- **Decentralized Data Management**: All portfolio data fetched directly from blockchain networks with no centralized storage of wallet addresses or private keys

## Key Principles

- **Security First**: Never store private keys; all wallet operations through Wagmi library
- **Privacy**: Client-side only data handling with optional local encryption
- **Performance**: Initial page load under 2 seconds, portfolio data fetch under 3 seconds
- **Responsive**: Support for mobile (320px+), tablet (768px+), and desktop (1024px+) devices
- **Progressive Web App**: Offline capability with service workers
