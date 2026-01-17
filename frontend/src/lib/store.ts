import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Address } from 'viem';
import type { AccessStatus, MarketAnalysis, TradeRecommendation } from './api';

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  isCustom?: boolean;
}

interface TradingState {
  // User state
  accessStatus: AccessStatus | null;
  setAccessStatus: (status: AccessStatus | null) => void;

  // Trading state
  selectedChainId: number;
  setSelectedChainId: (chainId: number) => void;

  sellToken: Address | null;
  setSellToken: (token: Address | null) => void;

  buyToken: Address | null;
  setBuyToken: (token: Address | null) => void;

  sellAmount: string;
  setSellAmount: (amount: string) => void;

  // Custom tokens (persisted)
  customTokens: Record<number, TokenInfo[]>;
  addCustomToken: (chainId: number, token: TokenInfo) => void;
  removeCustomToken: (chainId: number, address: Address) => void;

  // AI Analysis
  marketAnalysis: MarketAnalysis | null;
  setMarketAnalysis: (analysis: MarketAnalysis | null) => void;

  tradeRecommendation: TradeRecommendation | null;
  setTradeRecommendation: (recommendation: TradeRecommendation | null) => void;

  // UI state
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;

  isSwapping: boolean;
  setIsSwapping: (swapping: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  accessStatus: null,
  selectedChainId: 8453, // Base
  sellToken: null,
  buyToken: null,
  sellAmount: '',
  customTokens: {},
  marketAnalysis: null,
  tradeRecommendation: null,
  isAnalyzing: false,
  isSwapping: false,
};

export const useTradingStore = create<TradingState>()(
  persist(
    (set) => ({
      ...initialState,

      setAccessStatus: (status) => set({ accessStatus: status }),
      setSelectedChainId: (chainId) => set({ selectedChainId: chainId }),
      setSellToken: (token) => set({ sellToken: token }),
      setBuyToken: (token) => set({ buyToken: token }),
      setSellAmount: (amount) => set({ sellAmount: amount }),
      setMarketAnalysis: (analysis) => set({ marketAnalysis: analysis }),
      setTradeRecommendation: (recommendation) => set({ tradeRecommendation: recommendation }),
      setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
      setIsSwapping: (swapping) => set({ isSwapping: swapping }),

      addCustomToken: (chainId, token) => set((state) => ({
        customTokens: {
          ...state.customTokens,
          [chainId]: [
            ...(state.customTokens[chainId] || []).filter(
              (t) => t.address.toLowerCase() !== token.address.toLowerCase()
            ),
            { ...token, isCustom: true },
          ],
        },
      })),

      removeCustomToken: (chainId, address) => set((state) => ({
        customTokens: {
          ...state.customTokens,
          [chainId]: (state.customTokens[chainId] || []).filter(
            (t) => t.address.toLowerCase() !== address.toLowerCase()
          ),
        },
      })),

      reset: () => set(initialState),
    }),
    {
      name: 'moonboots-trading-storage',
      partialize: (state) => ({
        customTokens: state.customTokens,
        selectedChainId: state.selectedChainId,
      }),
    }
  )
);

// Default token lists by chain - popular tokens
export const DEFAULT_TOKEN_LIST: Record<number, TokenInfo[]> = {
  // Base
  8453: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', decimals: 18 },
    { address: '0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c', symbol: 'rETH', name: 'Rocket Pool ETH', decimals: 18 },
    { address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452', symbol: 'wstETH', name: 'Wrapped Lido Staked ETH', decimals: 18 },
    { address: '0x0dd7913197bfb6d2b1f03f9772ced06298f1a644', symbol: 'MBDAO', name: 'MoonBoots DAO', decimals: 18 },
    { address: '0x532f27101965dd16442E59d40670FaF5eBB142E4', symbol: 'BRETT', name: 'Brett', decimals: 18 },
    { address: '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4', symbol: 'TOSHI', name: 'Toshi', decimals: 18 },
  ],
  // Ethereum
  1: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x6B175474E89094C44Da98b954EesdffdCD73040D', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', symbol: 'wstETH', name: 'Wrapped Lido Staked ETH', decimals: 18 },
    { address: '0xae78736Cd615f374D3085123A210448E74Fc6393', symbol: 'rETH', name: 'Rocket Pool ETH', decimals: 18 },
    { address: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704', symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', decimals: 18 },
    { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
    { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave', decimals: 18 },
  ],
  // Polygon
  137: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'MATIC', name: 'Polygon', decimals: 18 },
    { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', symbol: 'WMATIC', name: 'Wrapped Matic', decimals: 18 },
    { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
  ],
  // Arbitrum
  42161: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', symbol: 'ARB', name: 'Arbitrum', decimals: 18 },
    { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x5979D7b546E38E414F7E9822514be443A4800529', symbol: 'wstETH', name: 'Wrapped Lido Staked ETH', decimals: 18 },
    { address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
    { address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', symbol: 'GMX', name: 'GMX', decimals: 18 },
  ],
};

// Helper to get all tokens (default + custom) for a chain
export function getTokenList(chainId: number, customTokens: Record<number, TokenInfo[]> = {}): TokenInfo[] {
  const defaultTokens = DEFAULT_TOKEN_LIST[chainId] || [];
  const userTokens = customTokens[chainId] || [];

  // Merge, with custom tokens appearing after default ones
  // Avoid duplicates by address
  const seen = new Set(defaultTokens.map((t) => t.address.toLowerCase()));
  const uniqueCustom = userTokens.filter((t) => !seen.has(t.address.toLowerCase()));

  return [...defaultTokens, ...uniqueCustom];
}

// Legacy export for backwards compatibility
export const TOKEN_LIST = DEFAULT_TOKEN_LIST;
