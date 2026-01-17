import { useState } from 'react';
import { X, Plus, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { isAddress } from 'viem';
import { usePublicClient } from 'wagmi';
import type { Address } from 'viem';
import { useTradingStore, getTokenList, type TokenInfo } from '../lib/store';

// ERC20 ABI for token metadata
const erc20Abi = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface AddCustomTokenProps {
  isOpen: boolean;
  onClose: () => void;
  chainId: number;
}

function AddCustomToken({ isOpen, onClose, chainId }: AddCustomTokenProps) {
  const [contractAddress, setContractAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenPreview, setTokenPreview] = useState<TokenInfo | null>(null);

  const publicClient = usePublicClient({ chainId });
  const { customTokens, addCustomToken, removeCustomToken } = useTradingStore();

  const userCustomTokens = customTokens[chainId] || [];

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContractAddress(value);
    setError('');
    setTokenPreview(null);
  };

  const fetchTokenMetadata = async () => {
    if (!contractAddress.trim()) {
      setError('Please enter a contract address');
      return;
    }

    if (!isAddress(contractAddress)) {
      setError('Invalid contract address format');
      return;
    }

    // Check if token already exists
    const existingTokens = getTokenList(chainId, customTokens);
    const exists = existingTokens.some(
      (t) => t.address.toLowerCase() === contractAddress.toLowerCase()
    );
    if (exists) {
      setError('This token is already in your list');
      return;
    }

    if (!publicClient) {
      setError('Unable to connect to blockchain');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [name, symbol, decimals] = await Promise.all([
        publicClient.readContract({
          address: contractAddress as Address,
          abi: erc20Abi,
          functionName: 'name',
        }),
        publicClient.readContract({
          address: contractAddress as Address,
          abi: erc20Abi,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: contractAddress as Address,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
      ]);

      setTokenPreview({
        address: contractAddress as Address,
        name: name as string,
        symbol: symbol as string,
        decimals: decimals as number,
        isCustom: true,
      });
    } catch (err) {
      console.error('Failed to fetch token metadata:', err);
      setError('Could not fetch token data. Make sure this is a valid ERC20 token on the selected chain.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToken = () => {
    if (!tokenPreview) return;

    addCustomToken(chainId, tokenPreview);
    setContractAddress('');
    setTokenPreview(null);
  };

  const handleRemoveToken = (address: Address) => {
    removeCustomToken(chainId, address);
  };

  const handleClose = () => {
    setContractAddress('');
    setError('');
    setTokenPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-moonboots-dark-light border border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Add Custom Token</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Token Contract Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={contractAddress}
                onChange={handleAddressChange}
                placeholder="0x..."
                className="flex-1 px-4 py-3 bg-moonboots-dark border border-gray-700 rounded-lg focus:outline-none focus:border-moonboots-purple transition-colors text-sm"
              />
              <button
                onClick={fetchTokenMetadata}
                disabled={isLoading || !contractAddress.trim()}
                className="px-4 py-3 bg-moonboots-purple hover:bg-moonboots-purple-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Lookup'
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Token Preview */}
          {tokenPreview && (
            <div className="p-4 bg-moonboots-dark rounded-lg border border-moonboots-purple/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-moonboots-purple/30 flex items-center justify-center text-sm font-bold">
                    {tokenPreview.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{tokenPreview.symbol}</p>
                    <p className="text-sm text-gray-400">{tokenPreview.name}</p>
                  </div>
                </div>
                <button
                  onClick={handleAddToken}
                  className="flex items-center gap-2 px-4 py-2 bg-moonboots-purple hover:bg-moonboots-purple-dark rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Decimals: {tokenPreview.decimals}
              </p>
            </div>
          )}

          {/* Custom Tokens List */}
          {userCustomTokens.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Your Custom Tokens
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {userCustomTokens.map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center justify-between p-3 bg-moonboots-dark rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{token.symbol}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">
                          {token.address}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveToken(token.address)}
                      className="p-2 hover:bg-red-900/30 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Custom tokens are saved locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AddCustomToken;
