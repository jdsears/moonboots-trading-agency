import { useAccount, useDisconnect } from 'wagmi';
import { Settings as SettingsIcon, Shield, Bell, LogOut, ExternalLink, Moon } from 'lucide-react';
import { useTradingStore } from '../lib/store';
import { CHAIN_INFO } from '../lib/wagmi';

function Settings() {
  const { address, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { accessStatus, selectedChainId, setSelectedChainId } = useTradingStore();

  const chains = Object.entries(CHAIN_INFO);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your trading preferences</p>
      </div>

      {/* Account Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-moonboots-purple" />
          <h2 className="text-xl font-semibold">Account</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div>
              <p className="text-sm text-gray-400">Wallet Address</p>
              <p className="font-mono">{address}</p>
            </div>
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-moonboots-purple hover:underline"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div>
              <p className="text-sm text-gray-400">Connected Network</p>
              <p>{chain?.name || 'Unknown'}</p>
            </div>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
              Connected
            </span>
          </div>

          <button
            onClick={() => disconnect()}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Disconnect Wallet
          </button>
        </div>
      </div>

      {/* Membership Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Moon className="w-6 h-6 text-moonboots-gold" />
          <h2 className="text-xl font-semibold">Membership Status</h2>
        </div>

        {accessStatus && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Access Level</p>
                <p className="font-semibold">
                  {accessStatus.hasAccess ? (
                    accessStatus.isVIP ? (
                      <span className="text-moonboots-gold">VIP Member</span>
                    ) : (
                      <span className="text-green-400">Standard Member</span>
                    )
                  ) : (
                    <span className="text-red-400">No Access</span>
                  )}
                </p>
              </div>
              {accessStatus.isVIP && (
                <span className="px-3 py-1 bg-moonboots-gold/20 text-moonboots-gold text-sm rounded-full">
                  VIP
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Trading Fee Rate</p>
                <p className="text-2xl font-bold">
                  {(accessStatus.effectiveFeeBps / 100).toFixed(2)}%
                </p>
              </div>
              {accessStatus.feeDiscount > 0 && (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                  {(accessStatus.feeDiscount * 100).toFixed(0)}% Off
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                <p className="text-sm text-gray-400 mb-1">MB1 NFTs</p>
                <p className="text-2xl font-bold">{accessStatus.holdings.moonbootsMB1}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                <p className="text-sm text-gray-400 mb-1">Chappyz NFTs</p>
                <p className="text-2xl font-bold">{accessStatus.holdings.chappyz}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                <p className="text-sm text-gray-400 mb-1">VIP NFTs</p>
                <p className="text-2xl font-bold">{accessStatus.holdings.mbdaoVIP}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                <p className="text-sm text-gray-400 mb-1">MBDAO Tokens</p>
                <p className="text-2xl font-bold">
                  {(BigInt(accessStatus.holdings.mbdaoTokens) / BigInt(10 ** 18)).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Upgrade Tips */}
            {!accessStatus.isVIP && accessStatus.hasAccess && (
              <div className="p-4 bg-moonboots-purple/10 border border-moonboots-purple/30 rounded-lg">
                <p className="font-medium mb-2">Upgrade to VIP</p>
                <p className="text-sm text-gray-400 mb-3">
                  Get 20% off trading fees with an MBDAO VIP NFT
                </p>
                <a
                  href="https://opensea.io/collection/mbdao-vip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center gap-2 text-sm"
                >
                  Get VIP NFT
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Network Selection */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-6 h-6 text-moonboots-purple" />
          <h2 className="text-xl font-semibold">Default Network</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {chains.map(([chainId, info]) => (
            <button
              key={chainId}
              onClick={() => setSelectedChainId(parseInt(chainId))}
              className={`p-4 rounded-lg border transition-colors ${
                selectedChainId === parseInt(chainId)
                  ? 'border-moonboots-purple bg-moonboots-purple/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <span className="text-2xl">{info.icon}</span>
              <p className="font-medium mt-2">{info.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications (Placeholder) */}
      <div className="card opacity-50">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-moonboots-purple" />
          <h2 className="text-xl font-semibold">Notifications</h2>
          <span className="px-2 py-1 bg-gray-700 text-xs rounded">Coming Soon</span>
        </div>
        <p className="text-gray-400 text-sm">
          Get notified about trade executions, buybacks, and market opportunities.
        </p>
      </div>
    </div>
  );
}

export default Settings;
