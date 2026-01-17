import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { isAddress, Address } from 'viem';
import { checkAccess } from '../services/nftGating.js';
import {
  researchAgent,
  analysisAgent,
  learningAgent,
  getFullAnalysis,
  TradeResult,
} from '../services/agent.js';

const router = Router();

// Validation schemas
const addressSchema = z.string().refine(isAddress, 'Invalid Ethereum address');

const analysisSchema = z.object({
  tokenSymbol: z.string().min(1).max(20),
  chainId: z.number().int().positive(),
  currentPrice: z.string().min(1),
  userBalance: z.string().min(1),
  walletAddress: addressSchema,
});

const researchSchema = z.object({
  tokenSymbol: z.string().min(1).max(20),
  chainId: z.number().int().positive(),
  walletAddress: addressSchema,
});

// Get market research analysis
router.post('/research', async (req: Request, res: Response) => {
  try {
    const params = researchSchema.parse(req.body);
    
    // Verify access
    const accessStatus = await checkAccess(params.walletAddress as Address);
    if (!accessStatus.hasAccess) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You must hold a MoonBoots MB1 or Chappyz NFT to use AI agents',
      });
      return;
    }

    const analysis = await researchAgent(params.tokenSymbol, params.chainId);
    res.json(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid parameters', details: error.errors });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get market research' });
    }
  }
});

// Get full analysis with trade recommendation
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const params = analysisSchema.parse(req.body);
    
    // Verify access
    const accessStatus = await checkAccess(params.walletAddress as Address);
    if (!accessStatus.hasAccess) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You must hold a MoonBoots MB1 or Chappyz NFT to use AI agents',
      });
      return;
    }

    const analysis = await getFullAnalysis(
      params.tokenSymbol,
      params.chainId,
      params.currentPrice,
      params.userBalance
    );

    res.json({
      ...analysis,
      access: {
        isVIP: accessStatus.isVIP,
        feeDiscount: accessStatus.feeDiscount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid parameters', details: error.errors });
    } else if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to analyze trade' });
    }
  }
});

// Get insights from past trades
router.post('/learn', async (req: Request, res: Response) => {
  try {
    const { pastTrades, walletAddress } = req.body;
    
    if (!walletAddress || !isAddress(walletAddress)) {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }

    // Verify access
    const accessStatus = await checkAccess(walletAddress as Address);
    if (!accessStatus.hasAccess) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You must hold a MoonBoots MB1 or Chappyz NFT to use AI agents',
      });
      return;
    }

    if (!Array.isArray(pastTrades)) {
      res.status(400).json({ error: 'pastTrades must be an array' });
      return;
    }

    // Get current market conditions for context
    const currentMarket = await researchAgent('ETH', 8453);
    
    const insights = await learningAgent(pastTrades as TradeResult[], currentMarket);
    res.json({ insights });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  }
});

export default router;
