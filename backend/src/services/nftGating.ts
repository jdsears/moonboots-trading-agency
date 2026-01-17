import { createPublicClient, http, Address, parseAbi } from 'viem';
import { base, mainnet, polygon, arbitrum, bsc } from 'viem/chains';

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

// Chain clients with custom RPC URLs for reliability
const clients = {
  base: createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL),
  }),
  mainnet: createPublicClient({
    chain: mainnet,
    transport: http(process.env.ETH_RPC_URL),
  }),
  polygon: createPublicClient({
    chain: polygon,
    transport: http(process.env.POLYGON_RPC_URL),
  }),
  arbitrum: createPublicClient({
    chain: arbitrum,
    transport: http(process.env.ARBITRUM_RPC_URL),
  }),
  bsc: createPublicClient({
    chain: bsc,
    transport: http(process.env.BSC_RPC_URL),
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
  // MoonBoots MB1 & MBDAO VIP on Polygon, Chappyz on Ethereum, MBDAO token on Base
  const polygonClient = clients.polygon;
  const baseClient = clients.base;

  let moonbootsMB1 = 0n;
  let chappyz = 0n;
  let mbdaoVIP = 0n;
  let mbdaoTokens = 0n;

  // Check MoonBoots MB1 on Polygon
  if (NFT_CONTRACTS.MOONBOOTS_MB1) {
    try {
      console.log(`Checking MoonBoots MB1 at ${NFT_CONTRACTS.MOONBOOTS_MB1} for ${address}`);
      moonbootsMB1 = await polygonClient.readContract({
        address: NFT_CONTRACTS.MOONBOOTS_MB1,
        abi: ERC721_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      console.log(`MoonBoots MB1 balance: ${moonbootsMB1}`);
    } catch (error) {
      console.error('Error checking MoonBoots MB1:', error);
    }
  }

  // Check Chappyz on Ethereum mainnet
  if (NFT_CONTRACTS.CHAPPYZ) {
    try {
      console.log(`Checking Chappyz at ${NFT_CONTRACTS.CHAPPYZ} for ${address}`);
      chappyz = await clients.mainnet.readContract({
        address: NFT_CONTRACTS.CHAPPYZ,
        abi: ERC721_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      console.log(`Chappyz balance: ${chappyz}`);
    } catch (error) {
      console.error('Error checking Chappyz:', error);
    }
  }

  // Check MBDAO VIP on Polygon
  if (NFT_CONTRACTS.MBDAO_VIP) {
    try {
      console.log(`Checking MBDAO VIP at ${NFT_CONTRACTS.MBDAO_VIP} for ${address}`);
      mbdaoVIP = await polygonClient.readContract({
        address: NFT_CONTRACTS.MBDAO_VIP,
        abi: ERC721_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      console.log(`MBDAO VIP balance: ${mbdaoVIP}`);
    } catch (error) {
      console.error('Error checking MBDAO VIP:', error);
    }
  }

  // Check MBDAO tokens on Base
  if (MBDAO_TOKEN) {
    try {
      console.log(`Checking MBDAO token at ${MBDAO_TOKEN} for ${address}`);
      mbdaoTokens = await baseClient.readContract({
        address: MBDAO_TOKEN,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      console.log(`MBDAO token balance: ${mbdaoTokens}`);
    } catch (error) {
      console.error('Error checking MBDAO tokens:', error);
    }
  }

  return {
    moonbootsMB1: Number(moonbootsMB1),
    chappyz: Number(chappyz),
    mbdaoVIP: Number(mbdaoVIP),
    mbdaoTokens: mbdaoTokens.toString(),
  };
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
