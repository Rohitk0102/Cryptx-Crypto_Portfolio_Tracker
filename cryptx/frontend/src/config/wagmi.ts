import { http, createConfig } from 'wagmi'
import { mainnet, polygon, bsc } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Get environment variables
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || ''

// Configure chains
export const chains = [mainnet, polygon, bsc] as const

// Configure connectors
const connectors = [
  injected({ target: 'metaMask' }),
  walletConnect({
    projectId: walletConnectProjectId,
    metadata: {
      name: 'Crypto Portfolio Tracker',
      description: 'Track your cryptocurrency portfolio across multiple chains',
      url: 'https://crypto-portfolio-tracker.app',
      icons: ['https://crypto-portfolio-tracker.app/icon.png']
    },
    showQrModal: true
  })
]

// Configure transports (RPC providers)
const transports = {
  [mainnet.id]: http(
    alchemyApiKey 
      ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
      : undefined
  ),
  [polygon.id]: http(
    alchemyApiKey
      ? `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
      : undefined
  ),
  [bsc.id]: http('https://bsc-dataseed.binance.org')
}

// Create Wagmi config
export const config = createConfig({
  chains,
  connectors,
  transports,
  ssr: false
})
