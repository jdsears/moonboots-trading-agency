import { useAccount, useBalance } from 'wagmi';
import { Wallet, ExternalLink } from 'lucide-react';
import { TOKEN_LIST } from '../lib/store';
import { CHAIN_INFO } from '../lib/wagmi';

// All supported chains
const SUPPORTED_CHAINS = [8453, 1, 137, 42161]; // Base, Ethereum, Polygon, Arbitrum

function Portfolio() {
  const { address } = useAccount();

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-gray-400 mt-1">Your token holdings across all chains</p>
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
        </div>
      </div>

      {/* Chain Sections */}
      {SUPPORTED_CHAINS.map((chainId) => {
        const chainInfo = CHAIN_INFO[chainId as keyof typeof CHAIN_INFO];
        const tokens = TOKEN_LIST[chainId] || [];

        if (tokens.length === 0) return null;

        return (
          <ChainSection
            key={chainId}
            chainId={chainId}
            chainInfo={chainInfo}
            tokens={tokens}
            address={address!}
          />
        );
      })}

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

// Chain section component
function ChainSection({
  chainId,
  chainInfo,
  tokens,
  address,
}: {
  chainId: number;
  chainInfo: { name: string; icon: string; explorer: string } | undefined;
  tokens: Array<{
    address: `0x${string}`;
    symbol: string;
    name: string;
    decimals: number;
  }>;
  address: `0x${string}`;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-lg">
            {chainInfo?.icon || '⟠'}
          </div>
          <h2 className="text-xl font-semibold">{chainInfo?.name || 'Unknown Chain'}</h2>
        </div>
        <a
          href={`${chainInfo?.explorer || 'https://etherscan.io'}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-moonboots-purple hover:underline"
        >
          Explorer
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="space-y-3">
        {tokens.map((token) => (
          <TokenBalanceRow
            key={`${chainId}-${token.address}`}
            address={address}
            token={token}
            chainId={chainId}
          />
        ))}
      </div>
    </div>
  );
}

// Token balance row component
function TokenBalanceRow({
  address,
  token,
  chainId,
}: {
  address: `0x${string}`;
  token: {
    address: `0x${string}`;
    symbol: string;
    name: string;
    decimals: number;
  };
  chainId: number;
}) {
  const isNative = token.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

  const { data: balance, isLoading } = useBalance({
    address,
    token: isNative ? undefined : token.address,
    chainId,
  });

  const formattedBalance = balance ? parseFloat(balance.formatted) : 0;
  const hasBalance = formattedBalance > 0.0001;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${hasBalance ? 'bg-gray-800/50' : 'bg-gray-800/20'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${hasBalance ? 'bg-moonboots-purple/30 text-moonboots-purple' : 'bg-gray-700 text-gray-400'}`}>
          {token.symbol.slice(0, 2)}
        </div>
        <div>
          <p className={`font-medium ${hasBalance ? 'text-white' : 'text-gray-400'}`}>{token.symbol}</p>
          <p className="text-xs text-gray-500">{token.name}</p>
        </div>
      </div>
      <div className="text-right">
        {isLoading ? (
          <p className="text-gray-500">...</p>
        ) : (
          <>
            <p className={`font-semibold ${hasBalance ? 'text-white' : 'text-gray-500'}`}>
              {formattedBalance.toFixed(4)}
            </p>
            <p className="text-xs text-gray-500">{token.symbol}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
