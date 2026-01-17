import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Address, isAddress } from 'viem';
import { checkAccess } from '../services/nftGating.js';
import { getSwapQuote, getPrice } from '../services/zerox.js';
import { recordFee } from '../services/buyback.js';

const router = Router();

// Validation schemas
const addressSchema = z.string().refine(isAddress, 'Invalid Ethereum address');

const quoteSchema = z.object({
  chainId: z.coerce.number().int().positive(),
  sellToken: addressSchema,
  buyToken: addressSchema,
  sellAmount: z.string().min(1),
  taker: addressSchema,
});

const priceSchema = z.object({
  chainId: z.coerce.number().int().positive(),
  sellToken: addressSchema,
  buyToken: addressSchema,
  sellAmount: z.string().min(1),
});

// Check access status for an address
router.get('/access', async (req: Request, res: Response) => {
  try {
    const address = addressSchema.parse(req.query.address);
    const accessStatus = await checkAccess(address as Address);
    res.json(accessStatus);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid address', details: error.errors });
    } else {
      console.error('Access check error:', error);
      res.status(500).json({ error: 'Failed to check access' });
    }
  }
});

// Get price quote (no transaction data)
router.get('/price', async (req: Request, res: Response) => {
  try {
    const params = priceSchema.parse(req.query);
    
    const priceData = await getPrice({
      chainId: params.chainId,
      sellToken: params.sellToken as Address,
      buyToken: params.buyToken as Address,
      sellAmount: params.sellAmount,
    });

    res.json(priceData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid parameters', details: error.errors });
    } else if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get price' });
    }
  }
});

// Get swap quote with transaction data
router.get('/quote', async (req: Request, res: Response) => {
  try {
    const params = quoteSchema.parse(req.query);
    
    // Check user access and get their fee rate
    const accessStatus = await checkAccess(params.taker as Address);
    
    if (!accessStatus.hasAccess) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You must hold a MoonBoots MB1 or Chappyz NFT to trade',
        holdings: accessStatus.holdings,
      });
      return;
    }

    // Get quote with user's effective fee
    const quote = await getSwapQuote({
      chainId: params.chainId,
      sellToken: params.sellToken as Address,
      buyToken: params.buyToken as Address,
      sellAmount: params.sellAmount,
      taker: params.taker as Address,
      feeBps: accessStatus.effectiveFeeBps,
    });

    // Return quote with access info
    res.json({
      ...quote,
      access: {
        isVIP: accessStatus.isVIP,
        isMBDAOHolder: accessStatus.isMBDAOHolder,
        feeDiscount: accessStatus.feeDiscount,
        effectiveFeeBps: accessStatus.effectiveFeeBps,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid parameters', details: error.errors });
    } else if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get quote' });
    }
  }
});

// Report completed trade (for fee tracking)
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { txHash, feeAmountUSD } = req.body;
    
    if (!txHash || typeof feeAmountUSD !== 'number') {
      res.status(400).json({ error: 'Missing txHash or feeAmountUSD' });
      return;
    }

    // Record the fee for buyback tracking
    recordFee(feeAmountUSD);

    res.json({ success: true, message: 'Trade recorded' });
  } catch (error) {
    console.error('Trade completion error:', error);
    res.status(500).json({ error: 'Failed to record trade' });
  }
});

export default router;
