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
      address: '0xA0b86a33E6417Aa971AED0D0F3D7c3bBf83C7F0D',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
  ],
};
