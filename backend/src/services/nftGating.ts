import { createPublicClient, http, Address, parseAbi } from 'viem';
import { base, mainnet, polygon, arbitrum } from 'viem/chains';

// NFT Contract addresses from environment
const NFT_CONTRACTS = {
  MOONBOOTS_MB1: process.env.MOONBOOTS_MB1_CONTRACT as Address,
  CHAPPYZ: process.env.CHAPPYZ_CONTRACT as Address,
  MBDAO_VIP: process.env.MBDAO_VIP_CONTRACT as Address,
};

const MBDAO_TOKEN = process.env.MBDAO_TOKEN_ADDRESS as Address;
const MBDAO_HOLDER_THRESHOLD = 10000n * 10n ** 18n; // 10000 tokens

// Simple ERC721 and ERC20 ABIs for balance checking
const ERC721_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
]);

const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
]);

// Chain clients
const clients = {
  base: createPublicClient({
    chain: base,
    transport: http(),
  }),
  mainnet: createPublicClient({
    chain: mainnet,
    transport: http(),
  }),
  polygon: createPublicClient({
    chain: polygon,
    transport: http(),
  }),
  arbitrum: createPublicClient({
    chain: arbitrum,
    transport: http(),
  }),
};

export interface NFTHoldings {
  moonbootsMB1: number;
  chappyz: number;
  mbdaoVIP: number;
  mbdaoTokens: string;
}

export interface AccessStatus {
  hasAccess: boolean;
  isVIP: boolean;
  isMBDAOHolder: boolean;
  holdings: NFTHoldings;
  feeDiscount: number;
  effectiveFeeBps: number;
}

// Base fee in basis points (0.5%)
const BASE_FEE_BPS = 50;
const VIP_DISCOUNT = 0.20; // 20% off for VIP
const MBDAO_HOLDER_DISCOUNT = 0.05; // Additional 5% off for 10000+ MBDAO holders

export async function checkNFTHoldings(address: Address): Promise<NFTHoldings> {
  // NFTs are on Ethereum mainnet, MBDAO token is on Base
  const mainnetClient = clients.mainnet;
  const baseClient = clients.base;

  try {
    const [moonbootsMB1, chappyz, mbdaoVIP, mbdaoTokens] = await Promise.all([
      NFT_CONTRACTS.MOONBOOTS_MB1
        ? mainnetClient.readContract({
            address: NFT_CONTRACTS.MOONBOOTS_MB1,
            abi: ERC721_ABI,
            functionName: 'balanceOf',
            args: [address],
          })
        : 0n,
      NFT_CONTRACTS.CHAPPYZ
        ? mainnetClient.readContract({
            address: NFT_CONTRACTS.CHAPPYZ,
            abi: ERC721_ABI,
            functionName: 'balanceOf',
            args: [address],
          })
        : 0n,
      NFT_CONTRACTS.MBDAO_VIP
        ? mainnetClient.readContract({
            address: NFT_CONTRACTS.MBDAO_VIP,
            abi: ERC721_ABI,
            functionName: 'balanceOf',
            args: [address],
          })
        : 0n,
      MBDAO_TOKEN
        ? baseClient.readContract({
            address: MBDAO_TOKEN,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          })
        : 0n,
    ]);

    return {
      moonbootsMB1: Number(moonbootsMB1),
      chappyz: Number(chappyz),
      mbdaoVIP: Number(mbdaoVIP),
      mbdaoTokens: mbdaoTokens.toString(),
    };
  } catch (error) {
    console.error('Error checking NFT holdings:', error);
    // Return zeros on error - user won't have access
    return {
      moonbootsMB1: 0,
      chappyz: 0,
      mbdaoVIP: 0,
      mbdaoTokens: '0',
    };
  }
}

export async function checkAccess(address: Address): Promise<AccessStatus> {
  const holdings = await checkNFTHoldings(address);

  // Access requires at least 1 MoonBoots MB1 OR 1 Chappyz NFT
  const hasAccess = holdings.moonbootsMB1 > 0 || holdings.chappyz > 0;

  // VIP status requires MBDAO VIP NFT
  const isVIP = holdings.mbdaoVIP > 0;

  // MBDAO holder bonus requires 10000+ tokens
  const isMBDAOHolder = BigInt(holdings.mbdaoTokens) >= MBDAO_HOLDER_THRESHOLD;

  // Calculate fee discount
  let feeDiscount = 0;
  if (isVIP) {
    feeDiscount += VIP_DISCOUNT;
  }
  if (isMBDAOHolder) {
    feeDiscount += MBDAO_HOLDER_DISCOUNT;
  }

  // Calculate effective fee
  const effectiveFeeBps = Math.round(BASE_FEE_BPS * (1 - feeDiscount));

  return {
    hasAccess,
    isVIP,
    isMBDAOHolder,
    holdings,
    feeDiscount,
    effectiveFeeBps,
  };
}

export function calculateFee(amountWei: bigint, feeBps: number): bigint {
  return (amountWei * BigInt(feeBps)) / 10000n;
}
