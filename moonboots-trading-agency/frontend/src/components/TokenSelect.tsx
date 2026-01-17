import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { Address } from 'viem';
import { TOKEN_LIST } from '../lib/store';

interface TokenSelectProps {
  chainId: number;
  selectedToken: Address | null;
  onSelect: (token: Address) => void;
  label: string;
}

function TokenSelect({ chainId, selectedToken, onSelect, label }: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const tokens = TOKEN_LIST[chainId] || [];
  const filteredTokens = tokens.filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase())
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
            <span className="font-medium">{selectedTokenInfo.symbol}</span>
            <span className="text-sm text-gray-500">{selectedTokenInfo.name}</span>
          </div>
        ) : (
          <span className="text-gray-500">Select token</span>
        )}
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-moonboots-dark-light border border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-hidden">
          <div className="p-2 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tokens..."
                className="w-full pl-9 pr-4 py-2 bg-moonboots-dark border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-moonboots-purple"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-48">
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
                <div className="text-left">
                  <p className="font-medium">{token.symbol}</p>
                  <p className="text-xs text-gray-500">{token.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenSelect;
