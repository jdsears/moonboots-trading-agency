# 🌙 MoonBoots Trading Agency

**AI-Powered Crypto Trading for VIP Community Members**

A sophisticated multi-agent trading system with NFT-gated access, competitive fees, and automatic MBDAO token buybacks.

---

## ✨ Features

### 🔐 NFT-Gated Access
- **Required**: Own at least 1 [MoonBoots MB1](https://opensea.io/collection/moonboots-mb1) OR [Chappyz](https://opensea.io/collection/chappyz) NFT
- **VIP Discount**: [MBDAO VIP](https://opensea.io/collection/mbdao-vip) holders get **20% off fees**
- **Holder Bonus**: 1000+ [MBDAO tokens](https://opensea.io/token/base/0x0dd7913197bfb6d2b1f03f9772ced06298f1a644) = extra **5% off**

### 💰 Competitive Fee Structure
| User Type | Fee | Comparison |
|-----------|-----|------------|
| Standard | 0.5% | vs Bankr 0.8%, BONKbot 1% |
| VIP (MBDAO VIP NFT) | 0.4% | 20% discount |
| VIP + 1000 MBDAO | 0.375% | Max 25% discount |

### 🔄 Automatic MBDAO Buybacks
- **50% of all fees** automatically buy MBDAO tokens
- Executed via admin wallet when threshold is met
- Transparent on-chain buyback history
- Supports MBDAO token value for the community

### 🤖 AI Trading Agents
- **Research Agent**: Market analysis & opportunity detection
- **Analysis Agent**: Risk assessment & recommendations
- **Execution Agent**: Transaction optimization
- **Learning Agent**: Performance tracking & improvement

### 🔗 Multi-Chain Support
- Ethereum Mainnet
- Base (primary)
- Polygon
- Arbitrum

### ⚡ Best Price Execution
- Powered by 0x Protocol
- 150+ liquidity sources
- Smart order routing
- MEV protection

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or WalletConnect-compatible wallet
- MoonBoots MB1 or Chappyz NFT

### 1. Clone & Install

```bash
git clone https://github.com/moonboots/trading-agency.git
cd trading-agency
npm run install:all
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your keys (see `.env.example` for all options).

### 3. Run Development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
│  │Dashboard│  │  Trade  │  │Portfolio│  │   Settings  │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬──────┘   │
│       │            │            │               │          │
│       └────────────┴────────────┴───────────────┘          │
│                           │                                 │
│                    wagmi + viem                            │
│                    (MetaMask)                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  NFT Gating  │  │  AI Agents   │  │  0x Trading API  │ │
│  │  Service     │  │  (Claude)    │  │  (Best Prices)   │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Automatic Buyback Service               │  │
│  │         (50% fees → MBDAO token purchases)           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
moonboots-trading-agency/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # wagmi config, API, store
│   │   └── styles/         # Tailwind CSS
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   │   ├── zerox.ts    # 0x trading integration
│   │   │   ├── agent.ts    # AI agents (Claude)
│   │   │   ├── nftGating.ts # Access control
│   │   │   └── buyback.ts  # Auto MBDAO buybacks
│   │   └── utils/          # Helpers
│   └── package.json
├── .env.example
└── README.md
```

---

## 🔧 API Endpoints

### Access Control
```
GET /api/trade/access?address=0x...
```
Returns NFT holdings, access status, and fee discount.

### Trading
```
GET /api/trade/quote?chainId=8453&sellToken=...&buyToken=...&sellAmount=...&taker=0x...
```
Returns swap quote with VIP discount applied.

### AI Analysis
```
POST /api/agent/analyze
```
Get AI-powered market analysis and recommendations.

### Revenue & Buybacks
```
GET /api/revenue/stats
POST /api/revenue/buyback/trigger  (admin only)
```

---

## 🚂 Deploy to Railway

### 1. Create Railway Project

```bash
npm install -g @railway/cli
railway login
railway init
```

### 2. Add Services

Create two services in Railway:
- **Backend**: Point to `/backend` directory
- **Frontend**: Point to `/frontend` directory

### 3. Set Environment Variables

Add all variables from `.env.example` in Railway dashboard under each service.

### 4. Deploy

```bash
railway up
```

Or connect to GitHub for automatic deployments.

---

## 🔒 Security Considerations

1. **Admin Wallet**: Use a dedicated hot wallet with limited funds
2. **Private Keys**: Never commit to git, use Railway secrets
3. **NFT Gating**: Verified on-chain, cannot be bypassed
4. **Rate Limiting**: Enabled by default in production
5. **Audit**: Consider smart contract audit for high-value deployments

---

## 📊 Fee Flow

```
User Trade ($1000)
       │
       ▼
┌──────────────────┐
│  0.5% Fee = $5   │ (0.4% for VIP, 0.375% max discount)
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│ 50%   │ │ 50%   │
│ $2.50 │ │ $2.50 │
│       │ │       │
│MBDAO  │ │Ops &  │
│Buyback│ │Growth │
└───────┘ └───────┘
```

---

## 🛠️ Development

### Run Both Services
```bash
npm run dev
```

### Frontend Only
```bash
npm run dev:frontend
```

### Backend Only
```bash
npm run dev:backend
```

### Build for Production
```bash
npm run build
```

---

## 📝 License

MIT License - Built for the MoonBoots community.

---

## 🔗 Links

- [MoonBoots MB1 Collection](https://opensea.io/collection/moonboots-mb1)
- [Chappyz Collection](https://opensea.io/collection/chappyz)
- [MBDAO VIP Collection](https://opensea.io/collection/mbdao-vip)
- [MBDAO Token](https://opensea.io/token/base/0x0dd7913197bfb6d2b1f03f9772ced06298f1a644)
- [0x Protocol](https://0x.org)
- [Railway](https://railway.app)

---

**Built with 💜 for MoonBoots VIP Community**
