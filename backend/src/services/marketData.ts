import { Address } from 'viem';

// CoinGecko API (free tier: 10-30 calls/min)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// DeFiLlama API (free, no rate limits)
const DEFILLAMA_API = 'https://api.llama.fi';
const DEFILLAMA_COINS_API = 'https://coins.llama.fi';

// Chain ID to CoinGecko platform mapping
const CHAIN_PLATFORMS: Record<number, string> = {
  1: 'ethereum',
  8453: 'base',
  137: 'polygon-pos',
  42161: 'arbitrum-one',
  56: 'binance-smart-chain',
};

// Chain ID to DeFiLlama chain name
const LLAMA_CHAINS: Record<number, string> = {
  1: 'ethereum',
  8453: 'base',
  137: 'polygon',
  42161: 'arbitrum',
  56: 'bsc',
};

// Native token placeholder address
const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase();

// Wrapped native token addresses for price lookups
const WRAPPED_NATIVE: Record<number, Address> = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,    // WETH on Ethereum
  8453: '0x4200000000000000000000000000000000000006' as Address,  // WETH on Base
  137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' as Address,   // WMATIC on Polygon
  42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as Address, // WETH on Arbitrum
  56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as Address,    // WBNB on BSC
};

// CoinGecko IDs for native tokens (for direct lookup)
const NATIVE_COINGECKO_IDS: Record<number, string> = {
  1: 'ethereum',
  8453: 'ethereum',  // Base uses ETH
  137: 'matic-network',
  42161: 'ethereum',  // Arbitrum uses ETH
  56: 'binancecoin',
};

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
  atl?: number;
  atlChangePercent?: number;
}

export interface TokenLiquidity {
  totalLiquidityUSD: number;
  pools: Array<{
    dex: string;
    pairAddress: string;
    liquidity: number;
    volume24h: number;
  }>;
}

export interface TokenSafetyScore {
  score: number; // 0-100
  risks: string[];
  warnings: string[];
  isVerified: boolean;
  hasLiquidity: boolean;
  liquidityLocked: boolean;
  contractAge: number; // days
}

export interface MarketOverview {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  fearGreedIndex: number;
  trending: Array<{ symbol: string; name: string; priceChange24h: number }>;
}

// Cache for API responses
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>, ttl = CACHE_TTL): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }
  const data = await fetcher();
  cache.set(key, { data, expiry: Date.now() + ttl });
  return data;
}

// Get token price from DeFiLlama (more reliable, no rate limits)
export async function getTokenPrice(chainId: number, tokenAddress: Address): Promise<TokenPrice | null> {
  const chain = LLAMA_CHAINS[chainId];
  if (!chain) return null;

  const cacheKey = `price:${chainId}:${tokenAddress}`;
  const isNativeToken = tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS;

  try {
    return await cachedFetch(cacheKey, async () => {
      // For native tokens, try CoinGecko simple price first (more reliable)
      if (isNativeToken) {
        const coinId = NATIVE_COINGECKO_IDS[chainId];
        if (coinId) {
          const cgResponse = await fetch(
            `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
          );
          if (cgResponse.ok) {
            const cgData = await cgResponse.json() as Record<string, { usd?: number; usd_24h_change?: number; usd_market_cap?: number }>;
            const coinData = cgData[coinId];
            if (coinData?.usd) {
              return {
                usd: coinData.usd,
                usd_24h_change: coinData.usd_24h_change || 0,
                usd_market_cap: coinData.usd_market_cap,
              };
            }
          }
        }

        // Fallback: use wrapped token address for native tokens
        const wrappedAddress = WRAPPED_NATIVE[chainId];
        if (wrappedAddress) {
          const tokenId = `${chain}:${wrappedAddress.toLowerCase()}`;
          const response = await fetch(`${DEFILLAMA_COINS_API}/prices/current/${tokenId}`);
          if (response.ok) {
            const data = await response.json() as { coins?: Record<string, { price: number; change24h?: number; mcap?: number }> };
            const coin = data.coins?.[tokenId];
            if (coin) {
              return {
                usd: coin.price,
                usd_24h_change: coin.change24h || 0,
                usd_market_cap: coin.mcap,
              };
            }
          }
        }
        return null;
      }

      // DeFiLlama format: chain:address
      const tokenId = `${chain}:${tokenAddress.toLowerCase()}`;
      const response = await fetch(`${DEFILLAMA_COINS_API}/prices/current/${tokenId}`);

      if (!response.ok) return null;

      const data = await response.json() as { coins?: Record<string, { price: number; change24h?: number; mcap?: number }> };
      const coin = data.coins?.[tokenId];

      if (!coin) return null;

      return {
        usd: coin.price,
        usd_24h_change: coin.change24h || 0,
        usd_market_cap: coin.mcap,
      };
    });
  } catch (error) {
    console.error('Error fetching token price:', error);
    return null;
  }
}

// Get detailed market data from CoinGecko
export async function getTokenMarketData(chainId: number, tokenAddress: Address): Promise<TokenMarketData | null> {
  const platform = CHAIN_PLATFORMS[chainId];
  if (!platform) return null;

  const cacheKey = `market:${chainId}:${tokenAddress}`;

  try {
    return await cachedFetch(cacheKey, async () => {
      const response = await fetch(
        `${COINGECKO_API}/coins/${platform}/contract/${tokenAddress.toLowerCase()}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) return null;

      const data = await response.json() as { market_data?: {
        current_price?: { usd?: number };
        price_change_percentage_24h?: number;
        price_change_percentage_7d?: number;
        total_volume?: { usd?: number };
        market_cap?: { usd?: number };
        total_supply?: number;
        circulating_supply?: number;
        ath?: { usd?: number };
        ath_change_percentage?: { usd?: number };
        atl?: { usd?: number };
        atl_change_percentage?: { usd?: number };
      } };
      const market = data.market_data;

      if (!market) return null;

      return {
        price: market.current_price?.usd || 0,
        priceChange24h: market.price_change_percentage_24h || 0,
        priceChange7d: market.price_change_percentage_7d,
        volume24h: market.total_volume?.usd || 0,
        marketCap: market.market_cap?.usd || 0,
        totalSupply: market.total_supply,
        circulatingSupply: market.circulating_supply,
        ath: market.ath?.usd,
        athChangePercent: market.ath_change_percentage?.usd,
        atl: market.atl?.usd,
        atlChangePercent: market.atl_change_percentage?.usd,
      };
    }, CACHE_TTL * 5); // Cache for 5 minutes
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}

// Get token liquidity from DeFiLlama
export async function getTokenLiquidity(chainId: number, tokenAddress: Address): Promise<TokenLiquidity | null> {
  const chain = LLAMA_CHAINS[chainId];
  if (!chain) return null;

  const cacheKey = `liquidity:${chainId}:${tokenAddress}`;

  try {
    return await cachedFetch(cacheKey, async () => {
      // Get DEX TVL data
      const response = await fetch(`${DEFILLAMA_API}/protocols`);
      if (!response.ok) return null;

      // For now, return a simplified response
      // In production, you'd query specific DEX subgraphs for accurate pool data
      return {
        totalLiquidityUSD: 0,
        pools: [],
      };
    }, CACHE_TTL * 10);
  } catch (error) {
    console.error('Error fetching liquidity:', error);
    return null;
  }
}

// Get market overview
export async function getMarketOverview(): Promise<MarketOverview | null> {
  const cacheKey = 'market:overview';

  try {
    return await cachedFetch(cacheKey, async () => {
      const [globalResponse, trendingResponse] = await Promise.all([
        fetch(`${COINGECKO_API}/global`),
        fetch(`${COINGECKO_API}/search/trending`),
      ]);

      if (!globalResponse.ok) return null;

      const globalData = await globalResponse.json() as { data?: {
        total_market_cap?: { usd?: number };
        total_volume?: { usd?: number };
        market_cap_percentage?: { btc?: number; eth?: number };
      } };
      const trendingData = trendingResponse.ok
        ? await trendingResponse.json() as { coins?: Array<{ item: { symbol: string; name: string; data?: { price_change_percentage_24h?: { usd?: number } } } }> }
        : { coins: [] };

      const global = globalData.data;

      if (!global) return null;

      return {
        totalMarketCap: global.total_market_cap?.usd || 0,
        totalVolume24h: global.total_volume?.usd || 0,
        btcDominance: global.market_cap_percentage?.btc || 0,
        ethDominance: global.market_cap_percentage?.eth || 0,
        fearGreedIndex: 50, // Would need separate API
        trending: trendingData.coins?.slice(0, 5).map((c) => ({
          symbol: c.item.symbol,
          name: c.item.name,
          priceChange24h: c.item.data?.price_change_percentage_24h?.usd || 0,
        })) || [],
      };
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return null;
  }
}

// Get gas prices for a chain
export async function getGasPrices(chainId: number): Promise<{ slow: number; standard: number; fast: number } | null> {
  const cacheKey = `gas:${chainId}`;

  try {
    return await cachedFetch(cacheKey, async () => {
      // Use different gas APIs based on chain
      if (chainId === 1) {
        // Ethereum - use Etherscan gas tracker
        const response = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
        if (!response.ok) return null;
        const data = await response.json() as { status: string; result: { SafeGasPrice: string; ProposeGasPrice: string; FastGasPrice: string } };
        if (data.status !== '1') return null;
        return {
          slow: parseFloat(data.result.SafeGasPrice),
          standard: parseFloat(data.result.ProposeGasPrice),
          fast: parseFloat(data.result.FastGasPrice),
        };
      }

      // For other chains, return defaults (in production, use chain-specific APIs)
      return {
        slow: 1,
        standard: 2,
        fast: 5,
      };
    }, 15000); // 15 second cache for gas
  } catch (error) {
    console.error('Error fetching gas prices:', error);
    return null;
  }
}

// Token safety check
export async function checkTokenSafety(chainId: number, tokenAddress: Address): Promise<TokenSafetyScore> {
  const cacheKey = `safety:${chainId}:${tokenAddress}`;

  try {
    return await cachedFetch(cacheKey, async () => {
      const risks: string[] = [];
      const warnings: string[] = [];
      let score = 100;

      // Get price data to check liquidity
      const price = await getTokenPrice(chainId, tokenAddress);
      const hasLiquidity = price !== null && price.usd > 0;

      if (!hasLiquidity) {
        risks.push('No liquidity detected');
        score -= 30;
      }

      // Check if it's a known token (has market cap on CoinGecko)
      const marketData = await getTokenMarketData(chainId, tokenAddress);
      const isVerified = marketData !== null && marketData.marketCap > 0;

      if (!isVerified) {
        warnings.push('Token not verified on major tracking sites');
        score -= 10;
      }

      if (marketData && marketData.volume24h < 10000) {
        warnings.push('Low 24h trading volume');
        score -= 15;
      }

      if (marketData && marketData.marketCap < 100000) {
        warnings.push('Very low market cap');
        score -= 10;
      }

      // In production, you'd also check:
      // - Contract source code verification
      // - Honeypot detection
      // - Owner privileges
      // - Liquidity lock status

      return {
        score: Math.max(0, score),
        risks,
        warnings,
        isVerified,
        hasLiquidity,
        liquidityLocked: false, // Would need contract analysis
        contractAge: 0, // Would need to query contract creation
      };
    }, CACHE_TTL * 10);
  } catch (error) {
    console.error('Error checking token safety:', error);
    return {
      score: 50,
      risks: ['Unable to verify token safety'],
      warnings: [],
      isVerified: false,
      hasLiquidity: false,
      liquidityLocked: false,
      contractAge: 0,
    };
  }
}

// Historical price data for charts
export async function getHistoricalPrices(
  chainId: number,
  tokenAddress: Address,
  days: number = 7
): Promise<Array<{ timestamp: number; price: number }> | null> {
  const chain = LLAMA_CHAINS[chainId];
  if (!chain) return null;

  const cacheKey = `history:${chainId}:${tokenAddress}:${days}`;
  const isNativeToken = tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS;

  try {
    return await cachedFetch(cacheKey, async () => {
      // For native tokens, try CoinGecko market chart first
      if (isNativeToken) {
        const coinId = NATIVE_COINGECKO_IDS[chainId];
        if (coinId) {
          const cgResponse = await fetch(
            `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
          );
          if (cgResponse.ok) {
            const cgData = await cgResponse.json() as { prices?: Array<[number, number]> };
            if (cgData.prices && cgData.prices.length > 0) {
              return cgData.prices.map(([timestamp, price]) => ({
                timestamp: Math.floor(timestamp / 1000),
                price,
              }));
            }
          }
        }

        // Fallback: use wrapped token address
        const wrappedAddress = WRAPPED_NATIVE[chainId];
        if (wrappedAddress) {
          const tokenId = `${chain}:${wrappedAddress.toLowerCase()}`;
          const end = Math.floor(Date.now() / 1000);
          const start = end - (days * 24 * 60 * 60);

          const response = await fetch(
            `${DEFILLAMA_COINS_API}/chart/${tokenId}?start=${start}&span=${days}`
          );

          if (response.ok) {
            const data = await response.json() as { coins?: Record<string, { prices?: Array<{ timestamp: number; price: number }> }> };
            return data.coins?.[tokenId]?.prices?.map((p) => ({
              timestamp: p.timestamp,
              price: p.price,
            })) || null;
          }
        }
        return null;
      }

      const tokenId = `${chain}:${tokenAddress.toLowerCase()}`;
      const end = Math.floor(Date.now() / 1000);
      const start = end - (days * 24 * 60 * 60);

      const response = await fetch(
        `${DEFILLAMA_COINS_API}/chart/${tokenId}?start=${start}&span=${days}`
      );

      if (!response.ok) return null;

      const data = await response.json() as { coins?: Record<string, { prices?: Array<{ timestamp: number; price: number }> }> };
      return data.coins?.[tokenId]?.prices?.map((p) => ({
        timestamp: p.timestamp,
        price: p.price,
      })) || null;
    }, CACHE_TTL * 5);
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    return null;
  }
}
