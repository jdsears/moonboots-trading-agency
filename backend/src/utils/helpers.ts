import { formatUnits, parseUnits } from 'viem';

// Format token amounts for display
export function formatTokenAmount(
  amount: bigint | string,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const formatted = formatUnits(value, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  if (num < 0.0001) return '<0.0001';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  });
}

// Parse user input to token amount
export function parseTokenAmount(
  amount: string,
  decimals: number = 18
): bigint {
  // Remove commas and whitespace
  const cleaned = amount.replace(/[,\s]/g, '');
  return parseUnits(cleaned, decimals);
}

// Format USD amounts
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format percentage
export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Calculate price impact
export function calculatePriceImpact(
  inputAmount: bigint,
  outputAmount: bigint,
  marketPrice: number,
  inputDecimals: number = 18,
  outputDecimals: number = 18
): number {
  const inputValue = parseFloat(formatUnits(inputAmount, inputDecimals));
  const outputValue = parseFloat(formatUnits(outputAmount, outputDecimals));
  
  const expectedOutput = inputValue * marketPrice;
  const impact = (expectedOutput - outputValue) / expectedOutput;
  
  return impact;
}

// Truncate address for display
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Chain ID to name mapping
export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  137: 'Polygon',
  42161: 'Arbitrum',
};

// Chain ID to explorer URL
export const BLOCK_EXPLORERS: Record<number, string> = {
  1: 'https://etherscan.io',
  8453: 'https://basescan.org',
  137: 'https://polygonscan.com',
  42161: 'https://arbiscan.io',
};

// Get transaction URL
export function getTxUrl(chainId: number, txHash: string): string {
  const explorer = BLOCK_EXPLORERS[chainId];
  if (!explorer) return '';
  return `${explorer}/tx/${txHash}`;
}

// Get address URL
export function getAddressUrl(chainId: number, address: string): string {
  const explorer = BLOCK_EXPLORERS[chainId];
  if (!explorer) return '';
  return `${explorer}/address/${address}`;
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}
