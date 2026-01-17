import Anthropic from '@anthropic-ai/sdk';
import { Address } from 'viem';
import { getTokenPrice, getTokenMarketData, checkTokenSafety, getMarketOverview, getHistoricalPrices } from './marketData.js';
import { checkAccess } from './nftGating.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Tool definitions for the AI assistant
const tools: Anthropic.Tool[] = [
  {
    name: 'get_token_info',
    description: 'Get comprehensive information about a token including price, market data, and safety score. Use this when the user asks about a specific token.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chainId: {
          type: 'number',
          description: 'The chain ID (1=Ethereum, 8453=Base, 137=Polygon, 42161=Arbitrum)',
        },
        tokenAddress: {
          type: 'string',
          description: 'The token contract address',
        },
        tokenSymbol: {
          type: 'string',
          description: 'The token symbol (e.g., ETH, USDC, MBDAO)',
        },
      },
      required: ['chainId', 'tokenAddress'],
    },
  },
  {
    name: 'get_market_overview',
    description: 'Get an overview of the crypto market including total market cap, BTC/ETH dominance, and trending coins. Use this for general market questions.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_price_history',
    description: 'Get historical price data for a token to analyze trends.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chainId: {
          type: 'number',
          description: 'The chain ID',
        },
        tokenAddress: {
          type: 'string',
          description: 'The token contract address',
        },
        days: {
          type: 'number',
          description: 'Number of days of history (default 7)',
        },
      },
      required: ['chainId', 'tokenAddress'],
    },
  },
  {
    name: 'prepare_swap',
    description: 'Prepare a token swap for the user. Returns swap details that the user must approve in their wallet.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chainId: {
          type: 'number',
          description: 'The chain ID for the swap',
        },
        sellToken: {
          type: 'string',
          description: 'The token address to sell',
        },
        buyToken: {
          type: 'string',
          description: 'The token address to buy',
        },
        sellAmount: {
          type: 'string',
          description: 'The amount to sell (in human readable format, e.g., "0.1" for 0.1 ETH)',
        },
      },
      required: ['chainId', 'sellToken', 'buyToken', 'sellAmount'],
    },
  },
  {
    name: 'set_price_alert',
    description: 'Set a price alert for a token. The user will be notified when the price reaches the target.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chainId: {
          type: 'number',
          description: 'The chain ID',
        },
        tokenAddress: {
          type: 'string',
          description: 'The token contract address',
        },
        tokenSymbol: {
          type: 'string',
          description: 'The token symbol',
        },
        targetPrice: {
          type: 'number',
          description: 'The target price in USD',
        },
        condition: {
          type: 'string',
          enum: ['above', 'below'],
          description: 'Alert when price goes above or below target',
        },
      },
      required: ['chainId', 'tokenAddress', 'tokenSymbol', 'targetPrice', 'condition'],
    },
  },
  {
    name: 'create_dca_strategy',
    description: 'Create a Dollar Cost Averaging (DCA) strategy for automated recurring purchases.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chainId: {
          type: 'number',
          description: 'The chain ID',
        },
        buyToken: {
          type: 'string',
          description: 'The token address to buy',
        },
        buyTokenSymbol: {
          type: 'string',
          description: 'The token symbol to buy',
        },
        sellToken: {
          type: 'string',
          description: 'The token address to sell (usually a stablecoin)',
        },
        amountPerPurchase: {
          type: 'string',
          description: 'Amount to spend per purchase (in USD or the sell token)',
        },
        frequency: {
          type: 'string',
          enum: ['daily', 'weekly', 'biweekly', 'monthly'],
          description: 'How often to make purchases',
        },
        totalPurchases: {
          type: 'number',
          description: 'Total number of purchases to make (optional, 0 for unlimited)',
        },
      },
      required: ['chainId', 'buyToken', 'buyTokenSymbol', 'sellToken', 'amountPerPurchase', 'frequency'],
    },
  },
  {
    name: 'create_limit_order',
    description: 'Create a limit order to buy or sell at a specific price.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chainId: {
          type: 'number',
          description: 'The chain ID',
        },
        sellToken: {
          type: 'string',
          description: 'The token address to sell',
        },
        buyToken: {
          type: 'string',
          description: 'The token address to buy',
        },
        sellAmount: {
          type: 'string',
          description: 'Amount to sell',
        },
        targetPrice: {
          type: 'number',
          description: 'The price at which to execute the order',
        },
        expiresIn: {
          type: 'string',
          enum: ['1h', '24h', '7d', '30d', 'never'],
          description: 'When the order expires',
        },
      },
      required: ['chainId', 'sellToken', 'buyToken', 'sellAmount', 'targetPrice'],
    },
  },
  {
    name: 'get_user_portfolio',
    description: 'Get the user\'s portfolio including all token holdings and their current values.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

// Tool execution functions
async function executeGetTokenInfo(params: { chainId: number; tokenAddress: string; tokenSymbol?: string }) {
  const [price, marketData, safety, history] = await Promise.all([
    getTokenPrice(params.chainId, params.tokenAddress as Address),
    getTokenMarketData(params.chainId, params.tokenAddress as Address),
    checkTokenSafety(params.chainId, params.tokenAddress as Address),
    getHistoricalPrices(params.chainId, params.tokenAddress as Address, 7),
  ]);

  let weekChange = 0;
  if (history && history.length > 1) {
    weekChange = ((history[history.length - 1].price - history[0].price) / history[0].price) * 100;
  }

  return {
    symbol: params.tokenSymbol || 'Unknown',
    price: price ? {
      current: price.usd,
      change24h: price.usd_24h_change,
      change7d: weekChange,
    } : null,
    marketData: marketData ? {
      marketCap: marketData.marketCap,
      volume24h: marketData.volume24h,
      ath: marketData.ath,
      athChangePercent: marketData.athChangePercent,
    } : null,
    safety: {
      score: safety.score,
      isVerified: safety.isVerified,
      hasLiquidity: safety.hasLiquidity,
      risks: safety.risks,
      warnings: safety.warnings,
    },
  };
}

async function executeGetMarketOverview() {
  const overview = await getMarketOverview();
  return overview;
}

async function executeGetPriceHistory(params: { chainId: number; tokenAddress: string; days?: number }) {
  const history = await getHistoricalPrices(params.chainId, params.tokenAddress as Address, params.days || 7);
  if (!history || history.length === 0) {
    return { error: 'No price history available' };
  }

  const prices = history.map(h => h.price);
  const highest = Math.max(...prices);
  const lowest = Math.min(...prices);
  const change = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;

  return {
    periodDays: params.days || 7,
    startPrice: prices[0],
    endPrice: prices[prices.length - 1],
    highPrice: highest,
    lowPrice: lowest,
    changePercent: change,
    volatility: ((highest - lowest) / lowest) * 100,
    dataPoints: history.length,
  };
}

// In-memory storage for alerts and strategies (in production, use database)
const priceAlerts: Map<string, {
  userId: string;
  chainId: number;
  tokenAddress: string;
  tokenSymbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
}> = new Map();

const dcaStrategies: Map<string, {
  userId: string;
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
}> = new Map();

const limitOrders: Map<string, {
  userId: string;
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  targetPrice: number;
  expiresAt: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
}> = new Map();

function executeSetPriceAlert(userId: string, params: {
  chainId: number;
  tokenAddress: string;
  tokenSymbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
}) {
  const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  priceAlerts.set(id, {
    userId,
    ...params,
    createdAt: Date.now(),
    triggered: false,
  });

  return {
    success: true,
    alertId: id,
    message: `Price alert set for ${params.tokenSymbol}. You'll be notified when price goes ${params.condition} $${params.targetPrice}`,
  };
}

function executeCreateDCAStrategy(userId: string, params: {
  chainId: number;
  buyToken: string;
  buyTokenSymbol: string;
  sellToken: string;
  amountPerPurchase: string;
  frequency: string;
  totalPurchases?: number;
}) {
  const id = `dca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  dcaStrategies.set(id, {
    userId,
    ...params,
    totalPurchases: params.totalPurchases || 0,
    completedPurchases: 0,
    active: true,
    createdAt: Date.now(),
  });

  return {
    success: true,
    strategyId: id,
    message: `DCA strategy created! Will buy ${params.buyTokenSymbol} ${params.frequency} with $${params.amountPerPurchase} each time.${params.totalPurchases ? ` Total of ${params.totalPurchases} purchases.` : ' Running indefinitely until cancelled.'}`,
    nextPurchase: new Date(Date.now() + getFrequencyMs(params.frequency)).toISOString(),
  };
}

function getFrequencyMs(frequency: string): number {
  const frequencies: Record<string, number> = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    biweekly: 14 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
  };
  return frequencies[frequency] || frequencies.weekly;
}

function executeCreateLimitOrder(userId: string, params: {
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  targetPrice: number;
  expiresIn?: string;
}) {
  const expiryMs: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    never: 365 * 24 * 60 * 60 * 1000,
  };

  const id = `limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = Date.now() + (expiryMs[params.expiresIn || '24h'] || expiryMs['24h']);

  limitOrders.set(id, {
    userId,
    chainId: params.chainId,
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    sellAmount: params.sellAmount,
    targetPrice: params.targetPrice,
    expiresAt,
    status: 'pending',
    createdAt: Date.now(),
  });

  return {
    success: true,
    orderId: id,
    message: `Limit order created! Will execute when price reaches $${params.targetPrice}`,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

function executePrepareSwap(params: {
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
}) {
  // Return swap preparation details - actual execution happens on frontend
  return {
    action: 'SWAP_PREPARED',
    chainId: params.chainId,
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    sellAmount: params.sellAmount,
    message: `Swap prepared: ${params.sellAmount} of sell token for buy token. Please confirm in your wallet.`,
    requiresApproval: true,
  };
}

function getUserAlerts(userId: string) {
  const userAlerts = Array.from(priceAlerts.values()).filter(a => a.userId === userId && !a.triggered);
  return userAlerts;
}

function getUserDCAStrategies(userId: string) {
  const userStrategies = Array.from(dcaStrategies.values()).filter(s => s.userId === userId && s.active);
  return userStrategies;
}

function getUserLimitOrders(userId: string) {
  const userOrders = Array.from(limitOrders.values()).filter(o => o.userId === userId && o.status === 'pending');
  return userOrders;
}

// Export for use in routes
export { priceAlerts, dcaStrategies, limitOrders, getUserAlerts, getUserDCAStrategies, getUserLimitOrders };

// Token info for common tokens
const COMMON_TOKENS: Record<number, Record<string, { address: Address; symbol: string; name: string }>> = {
  8453: { // Base
    ETH: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ethereum' },
    WETH: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether' },
    USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin' },
    MBDAO: { address: '0x0dd7913197bfb6d2b1f03f9772ced06298f1a644', symbol: 'MBDAO', name: 'MoonBoots DAO' },
  },
  1: { // Ethereum
    ETH: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ethereum' },
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin' },
  },
  137: { // Polygon
    MATIC: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'MATIC', name: 'Polygon' },
    USDC: { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin' },
  },
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  action?: {
    type: 'swap' | 'alert' | 'dca' | 'limit_order' | 'none';
    data?: unknown;
  };
}

export async function processChat(
  messages: ChatMessage[],
  walletAddress: Address,
  chainId: number
): Promise<ChatResponse> {
  // Check access
  const access = await checkAccess(walletAddress);
  if (!access.hasAccess) {
    return {
      message: "I'd love to help you trade, but you need to hold a MoonBoots MB1 or Chappyz NFT to access my trading features. Would you like me to help you find where to get one?",
    };
  }

  // Get user's active alerts, strategies, and orders for context
  const userAlerts = getUserAlerts(walletAddress);
  const userDCA = getUserDCAStrategies(walletAddress);
  const userLimitOrders = getUserLimitOrders(walletAddress);

  const systemPrompt = `You are Luna, the AI trading assistant for MoonBoots Trading Agency. You help users trade crypto, analyze tokens, and manage their trading strategies.

CAPABILITIES:
- Look up real-time token prices, market data, and safety scores
- Prepare token swaps (user must approve in wallet)
- Set price alerts
- Create DCA (Dollar Cost Averaging) strategies
- Create limit orders
- Analyze market trends

USER CONTEXT:
- Wallet: ${walletAddress}
- Current Chain: ${chainId} (${chainId === 8453 ? 'Base' : chainId === 1 ? 'Ethereum' : chainId === 137 ? 'Polygon' : 'Unknown'})
- VIP Status: ${access.isVIP ? 'Yes (20% fee discount)' : 'No'}
- MBDAO Holder: ${access.isMBDAOHolder ? 'Yes (additional 5% discount)' : 'No'}
- Fee Rate: ${(access.effectiveFeeBps / 100).toFixed(2)}%
- Active Price Alerts: ${userAlerts.length}
- Active DCA Strategies: ${userDCA.length}
- Pending Limit Orders: ${userLimitOrders.length}

COMMON TOKENS ON BASE (Chain ID 8453):
- ETH (Native): 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
- WETH: 0x4200000000000000000000000000000000000006
- USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
- MBDAO: 0x0dd7913197bfb6d2b1f03f9772ced06298f1a644

GUIDELINES:
- Be helpful, friendly, and concise
- Always check token safety before recommending trades
- Warn about risks clearly
- For swaps, always prepare them and tell the user to confirm in their wallet
- When users ask about prices, use the get_token_info tool
- For market questions, use get_market_overview
- Be proactive about suggesting DCA for volatile assets
- Remind users about their active strategies when relevant`;

  // Convert messages to Anthropic format
  const anthropicMessages: Anthropic.MessageParam[] = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    tools,
    messages: anthropicMessages,
  });

  // Process tool calls
  let action: ChatResponse['action'] = { type: 'none' };

  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      let result: unknown;

      try {
        switch (toolUse.name) {
          case 'get_token_info':
            result = await executeGetTokenInfo(toolUse.input as { chainId: number; tokenAddress: string; tokenSymbol?: string });
            break;
          case 'get_market_overview':
            result = await executeGetMarketOverview();
            break;
          case 'get_price_history':
            result = await executeGetPriceHistory(toolUse.input as { chainId: number; tokenAddress: string; days?: number });
            break;
          case 'prepare_swap':
            result = executePrepareSwap(toolUse.input as { chainId: number; sellToken: string; buyToken: string; sellAmount: string });
            action = { type: 'swap', data: result };
            break;
          case 'set_price_alert':
            result = executeSetPriceAlert(walletAddress, toolUse.input as { chainId: number; tokenAddress: string; tokenSymbol: string; targetPrice: number; condition: 'above' | 'below' });
            action = { type: 'alert', data: result };
            break;
          case 'create_dca_strategy':
            result = executeCreateDCAStrategy(walletAddress, toolUse.input as { chainId: number; buyToken: string; buyTokenSymbol: string; sellToken: string; amountPerPurchase: string; frequency: string; totalPurchases?: number });
            action = { type: 'dca', data: result };
            break;
          case 'create_limit_order':
            result = executeCreateLimitOrder(walletAddress, toolUse.input as { chainId: number; sellToken: string; buyToken: string; sellAmount: string; targetPrice: number; expiresIn?: string });
            action = { type: 'limit_order', data: result };
            break;
          case 'get_user_portfolio':
            // Return user's NFT holdings and fee status as portfolio for now
            result = {
              nftHoldings: access.holdings,
              feeStatus: {
                isVIP: access.isVIP,
                isMBDAOHolder: access.isMBDAOHolder,
                effectiveFee: access.effectiveFeeBps / 100,
              },
              activeAlerts: userAlerts.length,
              activeDCA: userDCA.length,
              pendingOrders: userLimitOrders.length,
            };
            break;
          default:
            result = { error: 'Unknown tool' };
        }
      } catch (error) {
        result = { error: (error as Error).message };
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }

    // Continue conversation with tool results
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      tools,
      messages: [
        ...anthropicMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ],
    });
  }

  // Extract final text response
  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );

  return {
    message: textBlock?.text || "I'm not sure how to respond to that. Could you try rephrasing?",
    action,
  };
}
