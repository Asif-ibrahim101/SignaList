# Signalist Feature Overview

This document explains the custom features implemented on top of the existing TradingView widgets. It is written for both evaluators and developers to understand what each feature does, how it works, and how to verify it.

## Quick Summary

- TradingView heatmap and widgets are retained for visual market context.
- A custom **Signal Ranking Engine** was added to score symbols from 0-100.
- A **Signal Leaderboard UI** explains why each symbol score is high/low.
- A **Composite Alerts Builder** lets users create custom rule-based alerts.
- **Alert Trigger History** stores and displays which rule fired and when.
- Data handling supports **live provider mode** and **fallback mode**.
- Recompute controls were added for intraday refresh and deeper batch refresh.

## 1) TradingView Heatmap (Kept)

TradingView heatmap remains the core visual map of market movement.

What it does:
- Shows quick market-level movement using TradingView UI.
- Supports multiple heatmap types (stocks, crypto, ETF, forex).

What changed:
- Nothing was removed from TradingView usage.
- New custom modules are additive and sit alongside TradingView.

Relevant files:
- `components/HeatmapSwitcher.tsx`
- `components/TradingViewWidget.tsx`
- `components/HomeDashboard.tsx`

## 2) Custom Signal Ranking Engine

The Signal Ranking Engine computes a custom score (0-100) for each symbol. It is designed to go beyond price-only widgets by combining multiple factors.

### What the engine measures

For each symbol, the engine computes factor scores and weighted contributions from:
- **Momentum**: recent price direction/strength.
- **Volume anomaly**: unusual volume compared to baseline behavior.
- **News sentiment**: positive/negative signal from provider sentiment endpoints.
- **Volatility regime**: stability vs extreme movement profile.
- **Provider agreement**: consistency between provider quote values.

### Main output fields

Each ranked symbol includes:
- `score`: overall strength score (0-100).
- `scoreDelta`: score change vs previous snapshot.
- `confidence`: data reliability estimate.
- `source`: `hybrid`, `finnhub`, `alpha_vantage`, or `synthetic`.
- `factors`: per-factor score and contribution list.
- `narrative`: plain-language explanation of key drivers.

### Refresh behavior

- Intraday refresh interval: every ~5 minutes (freshness logic).
- Batch mode interval: hourly-style deep recompute behavior.
- Single-flight refresh lock avoids duplicate concurrent recomputes.

Relevant file:
- `lib/signal-engine.ts`

## 3) Signal Leaderboard UI

The Signal Leaderboard is the end-user view of the custom ranking system.

What users see:
- **Table columns**: Symbol, Strength, Move, News, Confidence.
- **Symbol detail panel**: score summary, explanation, factor impact bars, recent trend bars.
- **Status metadata**: data source and update recency.

User actions:
- **Quick Refresh**: pull fresh ranking list.
- **Deep Recompute**: trigger batch recompute endpoint.

### Score Bands shown in UI

- `80-100`: Strong Bullish
- `65-79`: Bullish
- `50-64`: Neutral
- `35-49`: Cautious
- `0-34`: High Risk

Relevant file:
- `components/SignalLeaderboard.tsx`

## 4) Composite Alerts (Smart Rule Builder)

Composite alerts allow users to define custom conditions and get notified when those conditions match current signal snapshots.

### Rule structure

A rule can include:
- Rule name
- Optional symbol scope (`AAPL,NVDA,...`) or all symbols
- One or more conditions
- Condition logic: `AND` or `OR`
- Cooldown (minutes) to prevent duplicate alert spam
- Active/paused status

### Condition fields and operators

Allowed condition fields:
- `score`
- `scoreDelta`
- `sentiment`
- `volumeZScore`
- `confidence`
- `changePercent`

Allowed operators:
- `>`
- `>=`
- `<`
- `<=`
- `==`

### Builder UX features

- Ready templates for quick setup
- Human-readable rule preview
- Per-condition hints
- Active rules list with pause/delete controls
- Trigger history list

Relevant file:
- `components/CompositeAlertsPanel.tsx`

## 5) Data Sources and Modes

The engine uses provider APIs when available and falls back safely when needed.

### Source values

- `hybrid`: both Finnhub + Alpha Vantage used
- `finnhub`: Finnhub-only for that symbol snapshot
- `alpha_vantage`: Alpha Vantage-only for that symbol snapshot
- `synthetic`: fallback data used for that symbol snapshot

### Why fallback can happen even with valid keys

Fallback may appear for some symbols due to:
- provider rate limits
- temporary endpoint failures
- request timeouts

This means partial fallback does **not** automatically indicate bad API key configuration.

### `/api/signals` status fields

The signal API returns:
- `fallbackUsed` (compatibility boolean)
- `syntheticCount`
- `liveCount`
- `fallbackRatio`
- `dataStatus`: `live`, `partial_fallback`, `fallback`

Relevant file:
- `app/api/signals/route.ts`

## 6) API Endpoints Added

### Signals

- `GET /api/signals`
  - Returns ranked signal list and data status metrics.
- `GET /api/signals/[symbol]`
  - Returns one symbol detail + recent history snapshots.
- `POST /api/signals/recompute`
  - Auth required.
  - Triggers recompute in `intraday` or `batch` mode.

### Alerts

- `GET /api/alerts`
  - Auth required.
  - Lists user rules.
- `POST /api/alerts`
  - Auth required.
  - Creates a new rule.
- `PATCH /api/alerts/[id]`
  - Auth required.
  - Updates rule fields (name, symbols, conditions, logic, cooldown, active state).
- `DELETE /api/alerts/[id]`
  - Auth required.
  - Deletes a rule.
- `GET /api/alerts/history`
  - Auth required.
  - Returns recent trigger events.

Relevant files:
- `app/api/signals/route.ts`
- `app/api/signals/[symbol]/route.ts`
- `app/api/signals/recompute/route.ts`
- `app/api/alerts/route.ts`
- `app/api/alerts/[id]/route.ts`
- `app/api/alerts/history/route.ts`

## 7) Database Models Added

The following MongoDB models were added:

- `SignalProfile`
  - Current/latest snapshot per symbol for fast reads.
- `SignalSnapshot`
  - Historical snapshots used for trend/history views.
- `AlertRule`
  - User-defined composite alert rules.
- `AlertEvent`
  - Trigger event log used in recent history.

Relevant files:
- `models/SignalProfile.ts`
- `models/SignalSnapshot.ts`
- `models/AlertRule.ts`
- `models/AlertEvent.ts`

## 8) Environment Variables

Set these in:
- `SignaList/.env.local`

Required keys for live provider integration:

```env
FINNHUB_API_KEY=your_finnhub_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
```

Notes:
- API key names must match exactly.
- Restart dev server after changing env values.

## 9) How to Verify Features

1. Start app:

```bash
cd SignaList
npm run dev
```

2. Verify ranking API:
- Open: `http://localhost:3000/api/signals?limit=5`
- Confirm `items` exists and inspect `source`, `fallbackRatio`, `dataStatus`.

3. Verify single-symbol live test:
- Open: `http://localhost:3000/api/signals?symbols=AAPL&limit=1&refresh=1`
- Expect source often `hybrid` when providers respond.

4. Verify symbol explanation:
- Open dashboard and click a symbol in Signal Rankings.
- Confirm explanation panel and factor bars update.

5. Verify alerts:
- Create a rule in Smart Alerts panel.
- Ensure it appears in Active Rules.
- After trigger conditions match, confirm event appears in Recent Triggers and `/api/alerts/history`.

## 10) Known Limitations

- Provider rate limits can cause partial fallback states.
- Confidence is heuristic and can vary by provider availability.
- Alerts are in-app/history based; no email/push channel is implemented yet.
- Score model weights are static (not ML-trained in this version).

## 11) Disclaimer

This project is for educational/research use and product prototyping.
It does not provide financial advice.
