import { Router, Request, Response } from 'express';
import { isAddress, Address } from 'viem';
import {
  getRevenueStats,
  triggerManualBuyback,
  shouldTriggerBuyback,
} from '../services/buyback.js';

const router = Router();

// Get revenue statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = getRevenueStats();
    res.json(stats);
  } catch (error) {
    console.error('Revenue stats error:', error);
    res.status(500).json({ error: 'Failed to get revenue stats' });
  }
});

// Check if buyback can be triggered
router.get('/buyback/status', async (req: Request, res: Response) => {
  try {
    const canTrigger = shouldTriggerBuyback();
    const stats = getRevenueStats();
    
    res.json({
      canTrigger,
      buybackPoolUSD: stats.buybackPoolUSD,
      threshold: parseFloat(process.env.BUYBACK_THRESHOLD_USD || '100'),
    });
  } catch (error) {
    console.error('Buyback status error:', error);
    res.status(500).json({ error: 'Failed to check buyback status' });
  }
});

// Trigger manual buyback (admin only)
router.post('/buyback/trigger', async (req: Request, res: Response) => {
  try {
    const { adminAddress } = req.body;
    
    if (!adminAddress || !isAddress(adminAddress)) {
      res.status(400).json({ error: 'Invalid admin address' });
      return;
    }

    const result = await triggerManualBuyback(adminAddress as Address);
    
    if (!result) {
      res.status(400).json({
        error: 'Buyback not executed',
        message: 'Either threshold not met or execution failed',
      });
      return;
    }

    res.json({
      success: true,
      buyback: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      res.status(403).json({ error: error.message });
    } else {
      console.error('Buyback trigger error:', error);
      res.status(500).json({ error: 'Failed to trigger buyback' });
    }
  }
});

// Get buyback history
router.get('/buyback/history', async (req: Request, res: Response) => {
  try {
    const stats = getRevenueStats();
    res.json({
      history: stats.buybackHistory,
      totalMBDAOBought: stats.totalMBDAOBought,
    });
  } catch (error) {
    console.error('Buyback history error:', error);
    res.status(500).json({ error: 'Failed to get buyback history' });
  }
});

export default router;
