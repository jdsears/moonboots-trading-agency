import { create } from 'zustand';
import type { Address } from 'viem';
import type { AccessStatus, MarketAnalysis, TradeRecommendation } from './api';

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
  marketAnalysis: null,
  tradeRecommendation: null,
  isAnalyzing: false,
  isSwapping: false,
};

export const useTradingStore = create<TradingState>((set) => ({
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
  
  reset: () => set(initialState),
}));

// Token lists by chain
export const TOKEN_LIST: Record<number, Array<{
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}>> = {
  // Base
  8453: [
    {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
    {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    {
      address: '0x0dd7913197bfb6d2b1f03f9772ced06298f1a644',
      symbol: 'MBDAO',
      name: 'MoonBoots DAO',
      decimals: 18,
    },
    {
      address: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
    },
  ],
  // Ethereum
  1: [
    {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
    },
  ],
  // Polygon
  137: [
    {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
    },
    {
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    {
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
    },
  ],
  // Arbitrum
  42161: [
    {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
    {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    {
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
    },
    {
      address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      symbol: 'ARB',
      name: 'Arbitrum',
      decimals: 18,
    },
  ],
};
