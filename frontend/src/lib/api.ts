import type { Address } from 'viem';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Types
export interface AccessStatus {
  hasAccess: boolean;
  isVIP: boolean;
  isMBDAOHolder: boolean;
  holdings: {
    moonbootsMB1: number;
    chappyz: number;
    mbdaoVIP: number;
    mbdaoTokens: string;
  };
  feeDiscount: number;
  effectiveFeeBps: number;
}

export interface QuoteResponse {
  price: string;
  guaranteedPrice: string;
  buyAmount: string;
  sellAmount: string;
  gas: string;
  gasPrice: string;
  to: Address;
  data: string;
  value: string;
  access: {
    isVIP: boolean;
    isMBDAOHolder: boolean;
    feeDiscount: number;
    effectiveFeeBps: number;
  };
}

export interface MarketAnalysis {
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  riskLevel: 'low' | 'medium' | 'high';
  opportunities: string[];
  warnings: string[];
  recommendation: string;
}

export interface TradeRecommendation {
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string;
  suggestedAmount: string;
  stopLoss?: string;
  takeProfit?: string;
}

export interface FullAnalysis {
  market: MarketAnalysis;
  recommendation: TradeRecommendation;
  access: {
    isVIP: boolean;
    feeDiscount: number;
  };
}

export interface RevenueStats {
  totalFeesUSD: number;
  buybackPoolUSD: number;
  operationsPoolUSD: number;
  totalMBDAOBought: string;
  pendingBuyback: boolean;
  buybackHistory: Array<{
    timestamp: number;
    usdAmount: number;
    mbdaoAmount: string;
    txHash: string;
  }>;
}

// API Functions
export async function checkAccess(address: Address): Promise<AccessStatus> {
  const response = await fetch(`${API_BASE}/trade/access?address=${address}`);
  if (!response.ok) {
    throw new Error('Failed to check access');
  }
  return response.json();
}

export async function getQuote(params: {
  chainId: number;
  sellToken: Address;
  buyToken: Address;
  sellAmount: string;
  taker: Address;
}): Promise<QuoteResponse> {
  const queryParams = new URLSearchParams({
    chainId: params.chainId.toString(),
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    sellAmount: params.sellAmount,
    taker: params.taker,
  });

  const response = await fetch(`${API_BASE}/trade/quote?${queryParams}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get quote');
  }
  return response.json();
}

export async function getAnalysis(params: {
  tokenSymbol: string;
  chainId: number;
  currentPrice: string;
  userBalance: string;
  walletAddress: Address;
}): Promise<FullAnalysis> {
  const response = await fetch(`${API_BASE}/agent/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get analysis');
  }
  return response.json();
}

export async function getRevenueStats(): Promise<RevenueStats> {
  const response = await fetch(`${API_BASE}/revenue/stats`);
  if (!response.ok) {
    throw new Error('Failed to get revenue stats');
  }
  return response.json();
}

export async function reportTradeComplete(txHash: string, feeAmountUSD: number): Promise<void> {
  await fetch(`${API_BASE}/trade/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txHash, feeAmountUSD }),
  });
}
