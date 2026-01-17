import express from 'express';
import { Address } from 'viem';
import {
  getTokenPrice,
  getTokenMarketData,
  getTokenLiquidity,
  getMarketOverview,
  getGasPrices,
  checkTokenSafety,
  getHistoricalPrices,
} from '../services/marketData.js';

const router = express.Router();

// GET /api/market/overview - Get market overview
router.get('/overview', async (req, res) => {
  try {
    const overview = await getMarketOverview();
    if (!overview) {
      return res.status(503).json({ error: 'Unable to fetch market data' });
    }
    res.json(overview);
  } catch (error) {
    console.error('Market overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/market/price - Get token price
router.get('/price', async (req, res) => {
  try {
    const { chainId, token } = req.query;

    if (!chainId || !token) {
      return res.status(400).json({ error: 'chainId and token are required' });
    }

    const price = await getTokenPrice(Number(chainId), token as Address);
    if (!price) {
      return res.status(404).json({ error: 'Token price not found' });
    }
    res.json(price);
  } catch (error) {
    console.error('Token price error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/market/token - Get detailed token market data
router.get('/token', async (req, res) => {
  try {
    const { chainId, token } = req.query;

    if (!chainId || !token) {
      return res.status(400).json({ error: 'chainId and token are required' });
    }

    const [price, marketData, safety] = await Promise.all([
      getTokenPrice(Number(chainId), token as Address),
      getTokenMarketData(Number(chainId), token as Address),
      checkTokenSafety(Number(chainId), token as Address),
    ]);

    res.json({
      price,
      marketData,
      safety,
    });
  } catch (error) {
    console.error('Token data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/market/safety - Check token safety
router.get('/safety', async (req, res) => {
  try {
    const { chainId, token } = req.query;

    if (!chainId || !token) {
      return res.status(400).json({ error: 'chainId and token are required' });
    }

    const safety = await checkTokenSafety(Number(chainId), token as Address);
    res.json(safety);
  } catch (error) {
    console.error('Token safety error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/market/gas - Get gas prices
router.get('/gas', async (req, res) => {
  try {
    const { chainId } = req.query;

    if (!chainId) {
      return res.status(400).json({ error: 'chainId is required' });
    }

    const gas = await getGasPrices(Number(chainId));
    if (!gas) {
      return res.status(503).json({ error: 'Unable to fetch gas prices' });
    }
    res.json(gas);
  } catch (error) {
    console.error('Gas prices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/market/history - Get historical prices
router.get('/history', async (req, res) => {
  try {
    const { chainId, token, days } = req.query;

    if (!chainId || !token) {
      return res.status(400).json({ error: 'chainId and token are required' });
    }

    const history = await getHistoricalPrices(
      Number(chainId),
      token as Address,
      days ? Number(days) : 7
    );

    if (!history) {
      return res.status(404).json({ error: 'Historical data not found' });
    }
    res.json(history);
  } catch (error) {
    console.error('Historical prices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
