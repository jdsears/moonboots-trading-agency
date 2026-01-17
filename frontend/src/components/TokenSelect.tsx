import { useState } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';
import type { Address } from 'viem';
import { getTokenList, useTradingStore } from '../lib/store';
import AddCustomToken from './AddCustomToken';

interface TokenSelectProps {
  chainId: number;
  selectedToken: Address | null;
  onSelect: (token: Address) => void;
  label: string;
}

function TokenSelect({ chainId, selectedToken, onSelect, label }: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isAddTokenOpen, setIsAddTokenOpen] = useState(false);

  const { customTokens } = useTradingStore();
  const tokens = getTokenList(chainId, customTokens);

  const filteredTokens = tokens.filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.address.toLowerCase().includes(search.toLowerCase())
  );

  const selectedTokenInfo = tokens.find((t) => t.address === selectedToken);

  return (
    <div className="relative">
      <label className="block text-sm text-gray-400 mb-2">{label}</label>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-moonboots-dark border border-gray-700 rounded-lg hover:border-moonboots-purple transition-colors"
      >
        {selectedTokenInfo ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
              {selectedTokenInfo.symbol.slice(0, 2)}
            </div>
            <span className="font-medium">{selectedTokenInfo.symbol}</span>
            {selectedTokenInfo.isCustom && (
              <span className="text-xs bg-moonboots-purple/30 text-moonboots-purple-light px-1.5 py-0.5 rounded">
                Custom
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-500">Select token</span>
        )}
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-moonboots-dark-light border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or paste address..."
                className="w-full pl-9 pr-4 py-2 bg-moonboots-dark border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-moonboots-purple"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-52">
            {filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => {
                  onSelect(token.address);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors ${
                  token.address === selectedToken ? 'bg-moonboots-purple/20' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                  {token.symbol.slice(0, 2)}
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{token.symbol}</p>
                    {token.isCustom && (
                      <span className="text-xs bg-moonboots-purple/30 text-moonboots-purple-light px-1.5 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{token.name}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Add Custom Token Button */}
          <div className="p-2 border-t border-gray-700">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsAddTokenOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-moonboots-purple/20 hover:bg-moonboots-purple/30 text-moonboots-purple-light rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Custom Token
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Token Modal */}
      <AddCustomToken
        isOpen={isAddTokenOpen}
        onClose={() => setIsAddTokenOpen(false)}
        chainId={chainId}
      />
    </div>
  );
}

export default TokenSelect;
