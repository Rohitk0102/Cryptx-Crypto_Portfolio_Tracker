import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi'
import { useEffect, useState } from 'react'

interface WalletConnectProps {
  onConnect?: (address: string, chainId: number) => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  className?: string
}

// Wallet icons and metadata
const walletMetadata: Record<string, { icon: string; description: string; color: string }> = {
  'MetaMask': {
    icon: '🦊',
    description: 'Connect with MetaMask browser extension',
    color: 'from-orange-500 to-orange-600'
  },
  'WalletConnect': {
    icon: '🔗',
    description: 'Scan QR code with your mobile wallet',
    color: 'from-blue-500 to-blue-600'
  },
  'Coinbase Wallet': {
    icon: '💼',
    description: 'Connect with Coinbase Wallet',
    color: 'from-blue-600 to-blue-700'
  },
  'Injected': {
    icon: '🔌',
    description: 'Connect with browser wallet',
    color: 'from-purple-500 to-purple-600'
  }
}

// Chain metadata
const chainMetadata: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: 'Ethereum', icon: '⟠', color: 'bg-blue-500' },
  137: { name: 'Polygon', icon: '⬡', color: 'bg-purple-500' },
  56: { name: 'BSC', icon: '◆', color: 'bg-yellow-500' }
}

export function WalletConnect({
  onConnect,
  onDisconnect,
  onError,
  className = ''
}: WalletConnectProps) {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const [showMenu, setShowMenu] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  // Handle connection callback
  useEffect(() => {
    if (isConnected && address && chainId && onConnect) {
      onConnect(address, chainId)
    }
  }, [isConnected, address, chainId, onConnect])

  // Handle error callback
  useEffect(() => {
    if (error && onError) {
      onError(error)
    }
  }, [error, onError])

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect()
    setShowMenu(false)
    if (onDisconnect) {
      onDisconnect()
    }
  }

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  // Get chain info
  const chainInfo = chainId ? chainMetadata[chainId] : null

  if (isConnected && address) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`flex items-center gap-3 px-4 py-2 border border-border bg-card rounded-lg text-sm hover:bg-secondary transition-colors ${className}`}
        >
          {chainInfo && (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {chainInfo.icon}
            </div>
          )}
          <div className="text-left">
            <div className="text-sm font-bold">
              {ensName || formatAddress(address)}
            </div>
            {chainInfo && (
              <div className="text-xs opacity-90">
                {chainInfo.name}
              </div>
            )}
          </div>
          <span className="text-lg">{showMenu ? '▲' : '▼'}</span>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
            {/* Header */}
            <div className="bg-secondary p-4 border-b border-border">
              <div className="flex items-center gap-3 mb-3">
                {chainInfo && (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {chainInfo.icon}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Connected to</div>
                  <div className="font-bold">{chainInfo?.name || 'Unknown Chain'}</div>
                </div>
              </div>
              
              {/* Address Display */}
              <div className="bg-white rounded-lg border border-border/60 p-3">
                <div className="text-xs text-muted-foreground mb-1">Wallet Address</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm">
                    {ensName || formatAddress(address)}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="px-3 py-1 rounded-md border border-border text-xs font-medium hover:bg-secondary transition-colors"
                  >
                    {copiedAddress ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={copyAddress}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors text-left ${className}`}
              >
                <span className="text-xl">📋</span>
                <div className="flex-1">
                  <div className="font-medium">Copy Address</div>
                  <div className="text-xs text-muted-foreground">Copy wallet address to clipboard</div>
                </div>
              </button>

              <a
                href={`https://etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors text-left"
              >
                <span className="text-xl">🔍</span>
                <div className="flex-1">
                  <div className="font-medium">View on Explorer</div>
                  <div className="text-xs text-muted-foreground">See your wallet on blockchain explorer</div>
                </div>
              </a>

              <div className="border-t border-border my-2"></div>

              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/5 transition-colors text-left"
              >
                <span className="text-xl">🚪</span>
                <div className="flex-1">
                  <div className="font-medium">Disconnect</div>
                  <div className="text-xs opacity-70">Disconnect your wallet</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Wallet Options */}
      <div className="grid gap-4">
        {connectors.map((connector) => {
          const metadata = walletMetadata[connector.name] || {
            icon: '🔌',
            description: 'Connect with your wallet',
            color: 'from-gray-500 to-gray-600'
          }

          return (
            <button
              key={connector.id}
              onClick={() => connect({ connector })}
              disabled={isPending}
              className="relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-2xl">
                {metadata.icon}
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <div className="font-bold text-lg mb-1">{connector.name}</div>
                <div className="text-sm text-muted-foreground">
                  {metadata.description}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {isPending ? (
                  <div className="flex items-center gap-2 text-primary">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm font-medium">Connecting...</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Connect</div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <div className="font-medium text-red-500 mb-1">Connection Failed</div>
              <p className="text-sm text-red-500/80">
                {error.message || 'Failed to connect wallet. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">🔒</span>
          <div className="flex-1 text-sm">
            <div className="font-medium mb-1">Secure Connection</div>
            <p className="text-muted-foreground text-xs">
              We never store your private keys. Your wallet data is fetched directly from the blockchain.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
