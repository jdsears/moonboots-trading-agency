import { useAccount, useBalance } from 'wagmi';
import { Wallet, ExternalLink } from 'lucide-react';
import { useTradingStore, TOKEN_LIST } from '../lib/store';
import { CHAIN_INFO } from '../lib/wagmi';

function Portfolio() {
  const { address } = useAccount();
  const { selectedChainId } = useTradingStore();

  // Get native balance
  const { data: nativeBalance } = useBalance({
    address,
  });

  const tokens = TOKEN_LIST[selectedChainId] || [];
  const chainInfo = CHAIN_INFO[selectedChainId as keyof typeof CHAIN_INFO];

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-gray-400 mt-1">Your token holdings on {chainInfo?.name || 'Base'}</p>
      </div>

      {/* Wallet Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-moonboots-purple/20 rounded-lg">
              <Wallet className="w-6 h-6 text-moonboots-purple" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Connected Wallet</p>
              <p className="font-mono">{address && truncateAddress(address)}</p>
            </div>
          </div>
          <a
            href={`${chainInfo?.explorer || 'https://basescan.org'}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-moonboots-purple hover:underline"
          >
            View on Explorer
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Native Balance */}
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg">
                {chainInfo?.icon || '⟠'}
              </div>
              <div>
                <p className="font-medium">ETH</p>
                <p className="text-sm text-gray-500">Native Token</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold">
                {nativeBalance ? parseFloat(nativeBalance.formatted).toFixed(4) : '0.0000'}
              </p>
              <p className="text-sm text-gray-500">{nativeBalance?.symbol}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Token List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Token Balances</h2>
        
        <div className="space-y-4">
          {tokens.filter(t => t.symbol !== 'ETH').map((token) => (
            <TokenBalanceRow
              key={token.address}
              address={address!}
              token={token}
            />
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-500">
            Token balances are fetched in real-time from the blockchain
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <a
          href="/trade"
          className="card flex items-center gap-4 hover:border-moonboots-purple transition-colors"
        >
          <div className="p-3 bg-moonboots-purple/20 rounded-lg">
            <Wallet className="w-6 h-6 text-moonboots-purple" />
          </div>
          <div>
            <p className="font-semibold">Trade Tokens</p>
            <p className="text-sm text-gray-400">Swap with best prices via 0x</p>
          </div>
        </a>
        
        <a
          href="https://opensea.io/collection/moonboots-mb1"
          target="_blank"
          rel="noopener noreferrer"
          className="card flex items-center gap-4 hover:border-moonboots-gold transition-colors"
        >
          <div className="p-3 bg-moonboots-gold/20 rounded-lg">
            <ExternalLink className="w-6 h-6 text-moonboots-gold" />
          </div>
          <div>
            <p className="font-semibold">View NFTs</p>
            <p className="text-sm text-gray-400">See your MoonBoots collection</p>
          </div>
        </a>
      </div>
    </div>
  );
}

// Token balance row component
function TokenBalanceRow({
  address,
  token,
}: {
  address: `0x${string}`;
  token: {
    address: `0x${string}`;
    symbol: string;
    name: string;
    decimals: number;
  };
}) {
  const { data: balance } = useBalance({
    address,
    token: token.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? undefined : token.address,
  });

  return (
    <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-sm">
          {token.symbol.slice(0, 2)}
        </div>
        <div>
          <p className="font-medium">{token.symbol}</p>
          <p className="text-sm text-gray-500">{token.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">
          {balance ? parseFloat(balance.formatted).toFixed(4) : '0.0000'}
        </p>
        <p className="text-sm text-gray-500">{token.symbol}</p>
      </div>
    </div>
  );
}

export default Portfolio;
