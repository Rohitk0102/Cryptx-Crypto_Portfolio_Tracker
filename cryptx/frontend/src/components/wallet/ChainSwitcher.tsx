import { useSwitchChain, useAccount } from 'wagmi'
import { useState } from 'react'

interface ChainInfo {
  id: number
  name: string
  icon: string
  color: string
  description: string
}

const supportedChains: ChainInfo[] = [
  {
    id: 1,
    name: 'Ethereum',
    icon: '⟠',
    color: 'from-blue-500 to-blue-600',
    description: 'Ethereum Mainnet'
  },
  {
    id: 137,
    name: 'Polygon',
    icon: '⬡',
    color: 'from-purple-500 to-purple-600',
    description: 'Polygon PoS Chain'
  },
  {
    id: 56,
    name: 'BSC',
    icon: '◆',
    color: 'from-yellow-500 to-yellow-600',
    description: 'Binance Smart Chain'
  }
]

export function ChainSwitcher() {
  const { chain } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const [showMenu, setShowMenu] = useState(false)

  const currentChain = supportedChains.find(c => c.id === chain?.id)

  const handleSwitchChain = (chainId: number) => {
    switchChain({ chainId })
    setShowMenu(false)
  }

  if (!chain) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 px-4 py-2 border border-border rounded-lg bg-card text-sm hover:bg-secondary transition-colors"
      >
        {currentChain && (
          <>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {currentChain.icon}
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">{currentChain.name}</div>
              <div className="text-xs text-muted-foreground">Switch Network</div>
            </div>
            <span className="text-sm">{showMenu ? '▲' : '▼'}</span>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Select Network
            </div>
            {supportedChains.map((chainInfo) => {
              const isActive = chainInfo.id === chain?.id
              const isLoading = isPending

              return (
                <button
                  key={chainInfo.id}
                  onClick={() => handleSwitchChain(chainInfo.id)}
                  disabled={isActive || isLoading}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-secondary border border-primary/30'
                      : 'hover:bg-secondary'
                  } disabled:cursor-not-allowed`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {chainInfo.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">{chainInfo.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {chainInfo.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="px-2 py-1 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                      Active
                    </div>
                  )}
                  {isLoading && !isActive && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Info Footer */}
          <div className="border-t border-border p-3 bg-primary/5">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <span>💡</span>
              <p>
                Switching networks will update your portfolio to show assets on the selected chain.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
