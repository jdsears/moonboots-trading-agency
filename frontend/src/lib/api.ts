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

// Market Data Types
export interface TokenPrice {
  usd: number;
  usd_24h_change: number;
  usd_24h_vol?: number;
  usd_market_cap?: number;
}

export interface TokenMarketData {
  price: number;
  priceChange24h: number;
  priceChange7d?: number;
  volume24h: number;
  marketCap: number;
  totalSupply?: number;
  circulatingSupply?: number;
  ath?: number;
  athChangePercent?: number;
}

export interface TokenSafetyScore {
  score: number;
  risks: string[];
  warnings: string[];
  isVerified: boolean;
  hasLiquidity: boolean;
  liquidityLocked: boolean;
  contractAge: number;
}

export interface MarketOverview {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  fearGreedIndex: number;
  trending: Array<{ symbol: string; name: string; priceChange24h: number }>;
}

export interface GasPrices {
  slow: number;
  standard: number;
  fast: number;
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
  tokenAddress?: Address;
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

// Market Data API Functions
export async function getMarketOverview(): Promise<MarketOverview> {
  const response = await fetch(`${API_BASE}/market/overview`);
  if (!response.ok) {
    throw new Error('Failed to get market overview');
  }
  return response.json();
}

export async function getTokenPrice(chainId: number, token: Address): Promise<TokenPrice | null> {
  const response = await fetch(`${API_BASE}/market/price?chainId=${chainId}&token=${token}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function getTokenData(chainId: number, token: Address): Promise<{
  price: TokenPrice | null;
  marketData: TokenMarketData | null;
  safety: TokenSafetyScore;
}> {
  const response = await fetch(`${API_BASE}/market/token?chainId=${chainId}&token=${token}`);
  if (!response.ok) {
    throw new Error('Failed to get token data');
  }
  return response.json();
}

export async function getTokenSafety(chainId: number, token: Address): Promise<TokenSafetyScore> {
  const response = await fetch(`${API_BASE}/market/safety?chainId=${chainId}&token=${token}`);
  if (!response.ok) {
    throw new Error('Failed to get token safety');
  }
  return response.json();
}

export async function getGasPrices(chainId: number): Promise<GasPrices | null> {
  const response = await fetch(`${API_BASE}/market/gas?chainId=${chainId}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function getHistoricalPrices(
  chainId: number,
  token: Address,
  days = 7
): Promise<Array<{ timestamp: number; price: number }> | null> {
  const response = await fetch(`${API_BASE}/market/history?chainId=${chainId}&token=${token}&days=${days}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

// Chat API Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatAction {
  type: 'swap' | 'alert' | 'dca' | 'limit_order' | 'none';
  data?: unknown;
}

export interface ChatResponse {
  message: string;
  action?: ChatAction;
}

export interface PriceAlert {
  chainId: number;
  tokenAddress: string;
  tokenSymbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
}

export interface DCAStrategy {
  chainId: number;
  buyToken: string;
  buyTokenSymbol: string;
  sellToken: string;
  amountPerPurchase: string;
  frequency: string;
  totalPurchases: number;
  completedPurchases: number;
  active: boolean;
  createdAt: number;
}

export interface LimitOrder {
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  targetPrice: number;
  expiresAt: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
}

// Chat API Functions
export async function sendChatMessage(
  messages: ChatMessage[],
  walletAddress: Address,
  chainId: number
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, walletAddress, chainId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send message');
  }
  return response.json();
}

export async function getUserAlerts(walletAddress: Address): Promise<PriceAlert[]> {
  const response = await fetch(`${API_BASE}/chat/alerts?walletAddress=${walletAddress}`);
  if (!response.ok) {
    throw new Error('Failed to get alerts');
  }
  const data = await response.json();
  return data.alerts;
}

export async function deleteAlert(alertId: string, walletAddress: Address): Promise<void> {
  const response = await fetch(`${API_BASE}/chat/alerts/${alertId}?walletAddress=${walletAddress}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete alert');
  }
}

export async function getUserDCAStrategies(walletAddress: Address): Promise<DCAStrategy[]> {
  const response = await fetch(`${API_BASE}/chat/dca?walletAddress=${walletAddress}`);
  if (!response.ok) {
    throw new Error('Failed to get DCA strategies');
  }
  const data = await response.json();
  return data.strategies;
}

export async function cancelDCAStrategy(strategyId: string, walletAddress: Address): Promise<void> {
  const response = await fetch(`${API_BASE}/chat/dca/${strategyId}?walletAddress=${walletAddress}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to cancel DCA strategy');
  }
}

export async function getUserLimitOrders(walletAddress: Address): Promise<LimitOrder[]> {
  const response = await fetch(`${API_BASE}/chat/orders?walletAddress=${walletAddress}`);
  if (!response.ok) {
    throw new Error('Failed to get limit orders');
  }
  const data = await response.json();
  return data.orders;
}

export async function cancelLimitOrder(orderId: string, walletAddress: Address): Promise<void> {
  const response = await fetch(`${API_BASE}/chat/orders/${orderId}?walletAddress=${walletAddress}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to cancel order');
  }
}
