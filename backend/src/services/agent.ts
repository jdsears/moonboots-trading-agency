import Anthropic from '@anthropic-ai/sdk';
import { Address } from 'viem';
import {
  getTokenPrice,
  getTokenMarketData,
  checkTokenSafety,
  getMarketOverview,
  getHistoricalPrices,
} from './marketData.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

// Research Agent: Analyzes market conditions with real data
export async function researchAgent(
  tokenSymbol: string,
  chainId: number,
  tokenAddress?: Address
): Promise<MarketAnalysis> {
  // Fetch real market data
  let marketDataContext = '';

  if (tokenAddress) {
    const [price, marketData, safety, history, overview] = await Promise.all([
      getTokenPrice(chainId, tokenAddress),
      getTokenMarketData(chainId, tokenAddress),
      checkTokenSafety(chainId, tokenAddress),
      getHistoricalPrices(chainId, tokenAddress, 7),
      getMarketOverview(),
    ]);

    if (price) {
      marketDataContext += `\n\nREAL-TIME MARKET DATA:
- Current Price: $${price.usd.toFixed(6)}
- 24h Change: ${price.usd_24h_change?.toFixed(2)}%`;
    }

    if (marketData) {
      marketDataContext += `
- 7d Change: ${marketData.priceChange7d?.toFixed(2)}%
- 24h Volume: $${marketData.volume24h?.toLocaleString()}
- Market Cap: $${marketData.marketCap?.toLocaleString()}
- All-Time High: $${marketData.ath?.toFixed(6)} (${marketData.athChangePercent?.toFixed(2)}% from ATH)`;
    }

    if (safety) {
      marketDataContext += `\n\nTOKEN SAFETY ANALYSIS:
- Safety Score: ${safety.score}/100
- Verified: ${safety.isVerified ? 'Yes' : 'No'}
- Has Liquidity: ${safety.hasLiquidity ? 'Yes' : 'No'}`;
      if (safety.risks.length > 0) {
        marketDataContext += `\n- Risks: ${safety.risks.join(', ')}`;
      }
      if (safety.warnings.length > 0) {
        marketDataContext += `\n- Warnings: ${safety.warnings.join(', ')}`;
      }
    }

    if (history && history.length > 1) {
      const priceStart = history[0].price;
      const priceEnd = history[history.length - 1].price;
      const weekChange = ((priceEnd - priceStart) / priceStart) * 100;
      const highest = Math.max(...history.map(h => h.price));
      const lowest = Math.min(...history.map(h => h.price));
      marketDataContext += `\n\n7-DAY PRICE HISTORY:
- Week Change: ${weekChange.toFixed(2)}%
- Week High: $${highest.toFixed(6)}
- Week Low: $${lowest.toFixed(6)}
- Volatility: ${(((highest - lowest) / lowest) * 100).toFixed(2)}%`;
    }

    if (overview) {
      marketDataContext += `\n\nGLOBAL MARKET CONTEXT:
- Total Crypto Market Cap: $${(overview.totalMarketCap / 1e12).toFixed(2)}T
- BTC Dominance: ${overview.btcDominance.toFixed(1)}%
- ETH Dominance: ${overview.ethDominance.toFixed(1)}%`;
      if (overview.trending.length > 0) {
        marketDataContext += `\n- Trending: ${overview.trending.map(t => t.symbol).join(', ')}`;
      }
    }
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are a crypto market research analyst for the MoonBoots Trading Agency.
Your role is to provide objective market analysis for trading decisions.
You have access to REAL-TIME market data which you MUST use in your analysis.
Always respond in valid JSON format matching the specified schema.
Be concise but thorough. Focus on actionable insights based on the actual data.`,
    messages: [
      {
        role: 'user',
        content: `Analyze the current market conditions for ${tokenSymbol} on chain ID ${chainId}.
${marketDataContext}

Based on this REAL market data, provide your analysis in this exact JSON format:
{
  "summary": "Brief market overview referencing the actual data",
  "sentiment": "bullish" | "bearish" | "neutral",
  "riskLevel": "low" | "medium" | "high",
  "opportunities": ["opportunity 1", "opportunity 2"],
  "warnings": ["warning 1", "warning 2"],
  "recommendation": "Your overall recommendation"
}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text) as MarketAnalysis;
  } catch {
    // Return a default analysis if parsing fails
    return {
      summary: content.text.slice(0, 200),
      sentiment: 'neutral',
      riskLevel: 'medium',
      opportunities: [],
      warnings: ['Unable to parse detailed analysis'],
      recommendation: 'Proceed with caution',
    };
  }
}

// Analysis Agent: Provides trade recommendations
export async function analysisAgent(
  tokenSymbol: string,
  currentPrice: string,
  userBalance: string,
  marketAnalysis: MarketAnalysis
): Promise<TradeRecommendation> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are a trading analyst for the MoonBoots Trading Agency.
Your role is to provide specific trade recommendations based on market analysis.
Always respond in valid JSON format. Be precise with numbers.
Consider risk management and position sizing.`,
    messages: [
      {
        role: 'user',
        content: `Based on this market analysis, provide a trade recommendation:

Token: ${tokenSymbol}
Current Price: ${currentPrice}
User Balance: ${userBalance}

Market Analysis:
${JSON.stringify(marketAnalysis, null, 2)}

Provide your recommendation in this exact JSON format:
{
  "action": "buy" | "sell" | "hold",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation",
  "suggestedAmount": "Amount in USD or percentage of balance",
  "stopLoss": "Price level (optional)",
  "takeProfit": "Price level (optional)"
}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text) as TradeRecommendation;
  } catch {
    return {
      action: 'hold',
      confidence: 0.5,
      reasoning: 'Unable to parse detailed recommendation. Suggest manual review.',
      suggestedAmount: '0',
    };
  }
}

// Learning Agent: Tracks and improves from past trades
export interface TradeResult {
  tokenSymbol: string;
  action: 'buy' | 'sell';
  entryPrice: string;
  exitPrice?: string;
  profit?: string;
  recommendation: TradeRecommendation;
  timestamp: number;
}

export async function learningAgent(
  pastTrades: TradeResult[],
  currentMarket: MarketAnalysis
): Promise<string[]> {
  if (pastTrades.length === 0) {
    return ['No trading history available for analysis'];
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are a trading performance analyst for the MoonBoots Trading Agency.
Analyze past trades to identify patterns and improve future recommendations.
Respond with a JSON array of insight strings.`,
    messages: [
      {
        role: 'user',
        content: `Analyze these past trades and provide insights:

Past Trades:
${JSON.stringify(pastTrades, null, 2)}

Current Market Conditions:
${JSON.stringify(currentMarket, null, 2)}

Respond with a JSON array of 3-5 actionable insights, like:
["insight 1", "insight 2", "insight 3"]`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text) as string[];
  } catch {
    return ['Unable to parse detailed insights from trading history'];
  }
}

// Combined analysis function
export async function getFullAnalysis(
  tokenSymbol: string,
  chainId: number,
  currentPrice: string,
  userBalance: string,
  tokenAddress?: Address
): Promise<{
  market: MarketAnalysis;
  recommendation: TradeRecommendation;
}> {
  const market = await researchAgent(tokenSymbol, chainId, tokenAddress);
  const recommendation = await analysisAgent(
    tokenSymbol,
    currentPrice,
    userBalance,
    market
  );

  return { market, recommendation };
}
