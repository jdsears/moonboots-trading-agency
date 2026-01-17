import { createConfig, http } from 'wagmi';
import { mainnet, base, polygon, arbitrum } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const wagmiConfig = createConfig({
  chains: [base, mainnet, polygon, arbitrum],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
});

// Chain metadata for display
export const CHAIN_INFO = {
  [mainnet.id]: {
    name: 'Ethereum',
    icon: '⟠',
    color: '#627EEA',
    explorer: 'https://etherscan.io',
  },
  [base.id]: {
    name: 'Base',
    icon: '🔵',
    color: '#0052FF',
    explorer: 'https://basescan.org',
  },
  [polygon.id]: {
    name: 'Polygon',
    icon: '🟣',
    color: '#8247E5',
    explorer: 'https://polygonscan.com',
  },
  [arbitrum.id]: {
    name: 'Arbitrum',
    icon: '🔷',
    color: '#28A0F0',
    explorer: 'https://arbiscan.io',
  },
};

// Default chain
export const DEFAULT_CHAIN = base;
