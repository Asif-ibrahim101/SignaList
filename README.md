# SignaList

A real-time stock market intelligence platform that combines multi-provider financial data, a custom signal ranking engine, composite alerting, news sentiment analysis, and an AI-powered research assistant with RAG (Retrieval-Augmented Generation).

**Live Demo:** [signalist.vercel.app](https://signalist.vercel.app)

---

## Features

### Signal Ranking Engine
- Computes composite strength scores (0-100) for 40+ stock symbols
- Multi-factor analysis: momentum (30%), volume anomaly (20%), news sentiment (20%), volatility regime (15%), and provider agreement (15%)
- Score bands: Strong Bullish, Bullish, Neutral, Cautious, High Risk
- Two refresh modes: intraday (~5 min) and batch (hourly)

### Signal Leaderboard
- Sortable table with strength, move, news sentiment, and confidence columns
- Expandable detail panels with per-factor contribution bars, trend history, and auto-generated narratives
- Data sourced from Finnhub, Alpha Vantage, and Yahoo Finance with hybrid fallback

### Composite Alerts (Smart Rule Builder)
- Custom rule-based alerts on signal metrics (score, sentiment, volumeZScore, changePercent, etc.)
- AND/OR logic modes with configurable cooldown (1-1440 min)
- Pre-built templates: Momentum Breakout, Volume Spike, Sentiment Divergence
- Trigger history log with per-symbol event tracking

### News Aggregation & Sentiment
- Aggregates articles from Finnhub and Alpha Vantage
- 7 categories: technology, finance, energy, healthcare, consumer goods, economy, general
- Sentiment labels: Bullish, Somewhat-Bullish, Neutral, Somewhat-Bearish, Bearish
- Per-ticker relevance scoring, deduplication, and personalized feeds based on user preferences

### AI Insight Chat (RAG Pipeline)
- Floating AI assistant for stock analysis
- RAG architecture: query embedding via Ollama (`nomic-embed-text`) + Supabase pgvector semantic search + Llama 3 response generation
- Smart topic detection with rate limiting and response caching

### TradingView Market Widgets
- Heatmap switcher: Stocks/S&P500, Crypto, ETFs, Forex views
- Per-symbol charts: candlestick, technical analysis, company profile, financials
- Scrolling market ticker tape

### Authentication & User Profiles
- Custom session-based auth with scrypt password hashing
- User profiles with investment goals, risk tolerance, and preferred industries
- 7-day session TTL with auto-expiry

### Onboarding Tour
- Interactive guided walkthrough using driver.js
- Covers: Quick Actions, Market Heatmap, Signal Leaderboard, Smart Alerts, AI Assistant

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Frontend** | React 19, Tailwind CSS 4 |
| **UI Components** | Radix UI, Lucide Icons |
| **Database** | MongoDB Atlas + Mongoose |
| **Vector DB** | Supabase (pgvector) |
| **LLM** | Ollama (Llama 3, nomic-embed-text) |
| **LLM Framework** | LangChain |
| **Financial APIs** | Finnhub, Alpha Vantage, Yahoo Finance |
| **Charts** | TradingView Embedded Widgets |
| **Forms** | React Hook Form |
| **Tour** | driver.js |
| **Deployment** | Vercel |

---

## Project Structure

```
SignaList/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── sign-in/ & sign-up/      # Authentication pages
│   ├── app/                      # Authenticated dashboard
│   │   ├── page.tsx              # Home dashboard
│   │   ├── signals/[symbol]/     # Stock detail page
│   │   ├── news/                 # News feed
│   │   └── profile/              # User profile
│   └── api/
│       ├── auth/                 # login, register, logout, me
│       ├── signals/              # signal rankings & recompute
│       ├── alerts/               # CRUD + trigger history
│       ├── news/                 # news feed + personalized
│       └── ai/                   # RAG insight endpoint
├── components/
│   ├── landing/                  # Landing page sections
│   ├── ui/                       # Radix UI primitives
│   ├── HomeDashboard.tsx         # Main dashboard layout
│   ├── SignalLeaderboard.tsx     # Signal ranking table
│   ├── CompositeAlertsPanel.tsx  # Alert rule builder
│   ├── NewsFeed.tsx              # News articles feed
│   ├── StockDetailDashboard.tsx  # Per-symbol detail view
│   ├── AiInsightChat.tsx         # AI chat widget
│   ├── HeatmapSwitcher.tsx       # Market heatmap views
│   └── OnboardingTour.tsx        # Guided tour
├── lib/
│   ├── signal-engine.ts          # Scoring algorithm
│   ├── news-engine.ts            # News aggregation
│   ├── alerts.ts                 # Alert validation
│   ├── auth.ts                   # Password hashing
│   ├── session.ts                # Session management
│   └── constants.ts              # Configs & symbol lists
├── models/                       # Mongoose schemas
│   ├── User.ts, Session.ts
│   ├── SignalProfile.ts, SignalSnapshot.ts
│   ├── AlertRule.ts, AlertEvent.ts
│   └── NewsArticle.ts
├── scripts/
│   └── scrape-finance.ts         # Yahoo Finance → Supabase
└── Database/
    └── Mongoose.ts               # MongoDB connection
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current user (auth required) |

### Signals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/signals` | List ranked signals |
| GET | `/api/signals/[symbol]` | Single symbol detail + history |
| POST | `/api/signals/recompute` | Trigger refresh (auth required) |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | List user alert rules |
| POST | `/api/alerts` | Create alert rule |
| PATCH | `/api/alerts/[id]` | Update alert rule |
| DELETE | `/api/alerts/[id]` | Delete alert rule |
| GET | `/api/alerts/history` | Get trigger event history |

### News
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/news` | Filtered news feed |
| GET | `/api/news/personalized` | User-preference news (auth required) |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/insight` | RAG-augmented stock analysis |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Finnhub API key
- Alpha Vantage API key
- Supabase project (for RAG vector search)
- Ollama running locally (for AI features)

### Environment Variables

Create a `.env.local` file:

```env
MONGODB_URL=mongodb+srv://...
FINNHUB_API_KEY=your_key
ALPHA_VANTAGE_API_KEY=your_key
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Seeding Vector Data (for AI features)

```bash
# Requires Ollama running on http://127.0.0.1:11434
npx tsx scripts/scrape-finance.ts ALL
```

---

## Deployment

The app is deployed on [Vercel](https://vercel.com). Pushing to `main` triggers automatic deployment.

Environment variables must be configured in the Vercel dashboard.

---

## License

This project was built as a final year university project.
