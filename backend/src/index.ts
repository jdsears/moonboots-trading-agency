import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import tradeRoutes from './routes/trade.js';
import agentRoutes from './routes/agent.js';
import revenueRoutes from './routes/revenue.js';
import marketRoutes from './routes/market.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway/cloud deployments
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/trade', tradeRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/market', marketRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🌙 MoonBoots Trading API running on port ${PORT}`);
});
