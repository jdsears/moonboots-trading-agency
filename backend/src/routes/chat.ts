import { Router, Request, Response } from 'express';
import { isAddress, Address } from 'viem';
import { z } from 'zod';
import {
  processChat,
  ChatMessage,
  priceAlerts,
  dcaStrategies,
  limitOrders,
  getUserAlerts,
  getUserDCAStrategies,
  getUserLimitOrders,
} from '../services/chatbot.js';
import { checkAccess } from '../services/nftGating.js';

const router = Router();

// Helper to extract string from query param
function getQueryString(param: unknown): string | undefined {
  if (typeof param === 'string') return param;
  if (Array.isArray(param) && typeof param[0] === 'string') return param[0];
  return undefined;
}

// Validation schemas
const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  walletAddress: z.string().refine(isAddress, 'Invalid wallet address'),
  chainId: z.number().int().positive(),
});

// Main chat endpoint
router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, walletAddress, chainId } = chatSchema.parse(req.body);

    const response = await processChat(
      messages as ChatMessage[],
      walletAddress as Address,
      chainId
    );

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid parameters', details: error.errors });
    } else {
      console.error('Chat error:', error);
      res.status(500).json({ error: (error as Error).message || 'Failed to process chat' });
    }
  }
});

// Get user's active alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const walletAddress = getQueryString(req.query.walletAddress);

    if (!walletAddress || !isAddress(walletAddress)) {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }

    const access = await checkAccess(walletAddress as Address);
    if (!access.hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const alerts = getUserAlerts(walletAddress);
    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Delete a price alert
router.delete('/alerts/:alertId', async (req: Request, res: Response) => {
  try {
    const alertId = req.params.alertId as string;
    const walletAddress = getQueryString(req.query.walletAddress);

    if (!walletAddress || !isAddress(walletAddress)) {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }

    const alert = priceAlerts.get(alertId);
    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    if (alert.userId !== walletAddress) {
      res.status(403).json({ error: 'Not your alert' });
      return;
    }

    priceAlerts.delete(alertId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// Get user's DCA strategies
router.get('/dca', async (req: Request, res: Response) => {
  try {
    const walletAddress = getQueryString(req.query.walletAddress);

    if (!walletAddress || !isAddress(walletAddress)) {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }

    const access = await checkAccess(walletAddress as Address);
    if (!access.hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const strategies = getUserDCAStrategies(walletAddress);
    res.json({ strategies });
  } catch (error) {
    console.error('Get DCA error:', error);
    res.status(500).json({ error: 'Failed to get DCA strategies' });
  }
});

// Cancel a DCA strategy
router.delete('/dca/:strategyId', async (req: Request, res: Response) => {
  try {
    const strategyId = req.params.strategyId as string;
    const walletAddress = getQueryString(req.query.walletAddress);

    if (!walletAddress || !isAddress(walletAddress)) {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }

    const strategy = dcaStrategies.get(strategyId);
    if (!strategy) {
      res.status(404).json({ error: 'Strategy not found' });
      return;
    }

    if (strategy.userId !== walletAddress) {
      res.status(403).json({ error: 'Not your strategy' });
      return;
    }

    strategy.active = false;
    res.json({ success: true });
  } catch (error) {
    console.error('Cancel DCA error:', error);
    res.status(500).json({ error: 'Failed to cancel DCA strategy' });
  }
});

// Get user's limit orders
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const walletAddress = getQueryString(req.query.walletAddress);

    if (!walletAddress || !isAddress(walletAddress)) {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }

    const access = await checkAccess(walletAddress as Address);
    if (!access.hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const orders = getUserLimitOrders(walletAddress);
    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get limit orders' });
  }
});

// Cancel a limit order
router.delete('/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const walletAddress = getQueryString(req.query.walletAddress);

    if (!walletAddress || !isAddress(walletAddress)) {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }

    const order = limitOrders.get(orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.userId !== walletAddress) {
      res.status(403).json({ error: 'Not your order' });
      return;
    }

    order.status = 'cancelled';
    res.json({ success: true });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

export default router;
