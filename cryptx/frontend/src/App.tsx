import { useAccount } from 'wagmi'
import { WalletConnect, ChainSwitcher } from './components/wallet'
import { PortfolioDashboard } from './components/portfolio'
import { TransactionHistory } from './components/transactions/TransactionHistory'

function App() {
  const { address, isConnected, chain } = useAccount()

  const handleConnect = (address: string, chainId: number) => {
    console.log('Wallet connected:', { address, chainId })
  }

  const handleDisconnect = () => {
    console.log('Wallet disconnected')
  }

  const handleError = (error: Error) => {
    console.error('Wallet connection error:', error)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-64 border-r border-border bg-card">
          <div className="flex flex-col h-full">
            <div className="h-16 flex items-center px-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  CT
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">CryptoTracker</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Beta</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Portfolio workspace</span>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 text-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Navigation</div>
              <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2 bg-secondary text-foreground font-medium">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>Portfolio</span>
              </button>
              <button className="mt-1 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary">
                <span className="h-1 w-4 rounded-full bg-muted" />
                <span>AI Diversification</span>
              </button>
              <button className="mt-1 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary">
                <span className="h-1 w-4 rounded-full bg-muted" />
                <span>Forecasting</span>
              </button>
              <button className="mt-1 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary">
                <span className="h-1 w-4 rounded-full bg-muted" />
                <span>Risk Analysis</span>
              </button>
            </nav>

            <div className="border-t border-border px-6 py-4 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Total Value</span>
                <span className="font-semibold">$ -</span>
              </div>
              <div className="flex items-center justify-between">
                <span>24h Change</span>
                <span className="text-success font-medium">--</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b border-border bg-card">
            <div className="max-w-7xl mx-auto flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">CryptoTracker</p>
                <h1 className="text-sm sm:text-base font-semibold">Portfolio Dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                {isConnected && address && (
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="hidden md:inline">Connected</span>
                    <span className="font-mono">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-success" />
                  </div>
                )}
                {isConnected && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <ChainSwitcher />
                    <WalletConnect
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onError={handleError}
                    />
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {!isConnected ? (
                <div className="max-w-6xl mx-auto">
                  {/* Hero Section */}
                  <div className="text-center py-16 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
                      Track, Analyze & Optimize<br/>Your <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Crypto Portfolio</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                      Get real-time insights, advanced analytics, and AI-powered recommendations for your cryptocurrency investments.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
                      <WalletConnect
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                        onError={handleError}
                        className="px-8 py-3 text-base font-medium"
                      />
                      <button className="px-8 py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors font-medium">
                        Learn More
                      </button>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-4 bg-background text-sm text-muted-foreground">TRUSTED BY THOUSANDS OF TRADERS</span>
                      </div>
                    </div>
                  </div>

                  {/* Features Grid */}
                  <div className="grid md:grid-cols-3 gap-6 px-4 sm:px-6 lg:px-8 mb-20">
                    {[
                      {
                        icon: '📊',
                        title: 'Portfolio Tracking',
                        description: 'Monitor all your crypto assets in one place with real-time price updates and performance metrics.'
                      },
                      {
                        icon: '🤖',
                        title: 'AI Analysis',
                        description: 'Get personalized investment insights and recommendations powered by advanced AI algorithms.'
                      },
                      {
                        icon: '📱',
                        title: 'Cross-Platform',
                        description: 'Access your portfolio from any device with our responsive web interface.'
                      }
                    ].map((feature, index) => (
                      <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
                        <div className="text-3xl mb-4">{feature.icon}</div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA Section */}
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8 md:p-12 text-center mb-16 mx-4 sm:mx-6 lg:mx-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to take control of your crypto journey?</h2>
                    <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                      Join thousands of traders who trust our platform for their portfolio management needs.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <WalletConnect
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                        onError={handleError}
                        className="px-8 py-3 text-base font-medium"
                      />
                      <button className="px-8 py-3 bg-background border border-border text-foreground rounded-xl hover:bg-secondary transition-colors font-medium">
                        Watch Demo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {address && chain && (
                    <>
                      <section>
                        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm card-hover flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-base text-primary">
                              💼
                            </div>
                            <div>
                              <h2 className="text-sm font-semibold">Connected wallet</h2>
                              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                You are connected with a non-custodial wallet. Manage your network and connection from the header.
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-start md:items-end gap-1 text-xs">
                            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-2.5 py-1 text-green-700 border border-green-100">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              <span>Active session</span>
                            </div>
                            <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                              {address.slice(0, 6)}...{address.slice(-4)}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Network: <span className="font-medium">{chain.name}</span>
                            </div>
                          </div>
                        </div>
                      </section>

                      <PortfolioDashboard address={address} chainId={chain.id} />
                      <TransactionHistory address={address} chainId={chain.id} />
                    </>
                  )}
                </div>
              )}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-border bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="text-center sm:text-left">
                  <p>© 2024 CryptoTracker. Built with React & Web3.</p>
                  <p>Your data is never stored. All information is fetched directly from the blockchain.</p>
                </div>
                <div className="flex items-center gap-4">
                  <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                  <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                  <a href="#" className="hover:text-foreground transition-colors">Docs</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default App
