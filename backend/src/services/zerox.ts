import { Address } from 'viem';

const ZEROX_API_KEY = process.env.ZEROX_API_KEY || '';
const FEE_RECIPIENT = process.env.FEE_RECIPIENT_ADDRESS as Address;

// 0x API endpoints by chain
const ZEROX_ENDPOINTS: Record<number, string> = {
  1: 'https://api.0x.org',
  8453: 'https://base.api.0x.org',
  137: 'https://polygon.api.0x.org',
  42161: 'https://arbitrum.api.0x.org',
};

export interface QuoteParams {
  chainId: number;
  sellToken: Address;
  buyToken: Address;
  sellAmount: string;
  taker: Address;
  feeBps: number;
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
  fees: {
    integratorFee: {
      amount: string;
      token: Address;
    };
  };
  route: {
    fills: Array<{
      source: string;
      proportionBps: string;
    }>;
  };
}

export async function getSwapQuote(params: QuoteParams): Promise<QuoteResponse> {
  const endpoint = ZEROX_ENDPOINTS[params.chainId];
  
  if (!endpoint) {
    throw new Error(`Unsupported chain ID: ${params.chainId}`);
  }

  const queryParams = new URLSearchParams({
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    sellAmount: params.sellAmount,
    taker: params.taker,
    // Integrate fee into the swap
    swapFeeRecipient: FEE_RECIPIENT,
    swapFeeBps: params.feeBps.toString(),
    swapFeeToken: params.sellToken,
  });

  const response = await fetch(`${endpoint}/swap/permit2/quote?${queryParams}`, {
    headers: {
      '0x-api-key': ZEROX_API_KEY,
      '0x-version': 'v2',
    },
  });

  if (!response.ok) {
    const error = await response.json() as { reason?: string };
    throw new Error(error.reason || 'Failed to get quote from 0x');
  }

  return response.json() as Promise<QuoteResponse>;
}

export interface PriceParams {
  chainId: number;
  sellToken: Address;
  buyToken: Address;
  sellAmount: string;
}

export interface PriceResponse {
  price: string;
  buyAmount: string;
  sellAmount: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
}

export async function getPrice(params: PriceParams): Promise<PriceResponse> {
  const endpoint = ZEROX_ENDPOINTS[params.chainId];

  if (!endpoint) {
    throw new Error(`Unsupported chain ID: ${params.chainId}`);
  }

  const queryParams = new URLSearchParams({
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    sellAmount: params.sellAmount,
  });

  const response = await fetch(`${endpoint}/swap/permit2/price?${queryParams}`, {
    headers: {
      '0x-api-key': ZEROX_API_KEY,
      '0x-version': 'v2',
    },
  });

  if (!response.ok) {
    const error = await response.json() as { reason?: string };
    throw new Error(error.reason || 'Failed to get price from 0x');
  }

  return response.json() as Promise<PriceResponse>;
}

// Common token addresses by chain
export const TOKENS: Record<number, Record<string, Address>> = {
  // Base
  8453: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    MBDAO: '0x0dd7913197bfb6d2b1f03f9772ced06298f1a644',
  },
  // Ethereum
  1: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86a33E6417Aa971AED0D0F3D7c3bBf83C7F0D',
  },
  // Polygon
  137: {
    MATIC: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  },
  // Arbitrum
  42161: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  },
};
