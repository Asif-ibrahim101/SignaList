'use client'

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import TradingViewWidget from '@/components/TradingViewWidget';
import { useTheme } from '@/components/ThemeProvider';
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from '@/lib/constants';

// ── Types ──

type SignalFactorContribution = {
  name: string;
  label: string;
  score: number;
  weight: number;
  contribution: number;
  direction: 'positive' | 'negative' | 'neutral';
};

type SignalProfileView = {
  symbol: string;
  score: number;
  scoreDelta: number;
  confidence: number;
  price: number;
  changePercent: number;
  volume: number;
  sentiment: number;
  volumeZScore: number;
  source: 'hybrid' | 'finnhub' | 'alpha_vantage' | 'synthetic';
  narrative: string;
  factors: SignalFactorContribution[];
  updatedAt: string;
  lastMode: 'intraday' | 'batch';
};

type SignalHistoryPoint = {
  timestamp: string;
  score: number;
  scoreDelta: number;
  changePercent: number;
  sentiment: number;
};

type SignalDetailResponse = {
  profile: SignalProfileView;
  history: SignalHistoryPoint[];
};

// ── Helpers ──

const scoreTone = (score: number) => {
  if (score >= 75) return 'text-success';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 45) return 'text-foreground';
  return 'text-red-500';
};

const scoreBg = (score: number) => {
  if (score >= 75) return 'bg-success';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 45) return 'bg-muted-foreground';
  return 'bg-red-500';
};

const sourceLabel: Record<SignalProfileView['source'], string> = {
  hybrid: 'Finnhub + Alpha Vantage',
  finnhub: 'Finnhub',
  alpha_vantage: 'Alpha Vantage',
  synthetic: 'Demo fallback',
};

const scoreBandLabel = (score: number) => {
  if (score >= 80) return 'Strong Bullish';
  if (score >= 65) return 'Bullish';
  if (score >= 50) return 'Neutral';
  if (score >= 35) return 'Cautious';
  return 'High Risk';
};

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const formatRelativeTime = (isoDate: string) => {
  const timestamp = new Date(isoDate).getTime();
  if (!Number.isFinite(timestamp)) return 'Unknown';

  const diffMs = Date.now() - timestamp;
  const diffSeconds = Math.max(Math.floor(diffMs / 1000), 0);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

// ── Component ──

const StockDetailDashboard = ({ symbol }: { symbol: string }) => {
  const normalized = symbol.trim().toUpperCase();
  const { theme } = useTheme();
  const widgetTheme = theme === 'dark' ? 'dark' : 'light';
  const scriptBase = 'https://s3.tradingview.com/external-embedding/embed-widget-';

  const [profile, setProfile] = useState<SignalProfileView | null>(null);
  const [history, setHistory] = useState<SignalHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const withTheme = useMemo(() => {
    const bg = widgetTheme === 'dark' ? '#141414' : '#FFFFFF';
    const grid = widgetTheme === 'dark' ? '#141414' : '#E5E7EB';

    return (config: Record<string, unknown>) => ({
      ...config,
      colorTheme: widgetTheme,
      theme: widgetTheme,
      backgroundColor: bg,
      gridColor: grid,
    });
  }, [widgetTheme]);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/signals/${encodeURIComponent(normalized)}`, { cache: 'no-store' });
      const payload = (await response.json()) as Partial<SignalDetailResponse> & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? `Could not load data for ${normalized}.`);
      }

      if (!payload.profile) {
        throw new Error(`No signal data found for ${normalized}.`);
      }

      setProfile(payload.profile);
      setHistory(Array.isArray(payload.history) ? payload.history : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [normalized]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  // ── Loading / Error states ──

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground uppercase font-mono tracking-wider">Loading {normalized}...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground font-bold uppercase tracking-wider font-mono">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
          [ Back to Dashboard ]
        </Link>
        <div className="border-2 border-destructive bg-destructive/10 p-8 text-center brutalist-shadow">
          <p className="text-2xl font-black uppercase tracking-tight text-destructive">{error ?? 'No data available'}</p>
          <p className="mt-3 text-sm text-muted-foreground font-medium">
            The symbol &ldquo;{normalized}&rdquo; may not be tracked yet. Try returning to the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // ── Trend stats ──
  const trendStats = history.length >= 2
    ? (() => {
        const latest = history[history.length - 1];
        const oldest = history[0];
        return {
          delta: latest.score - oldest.score,
          high: Math.max(...history.map((p) => p.score)),
          low: Math.min(...history.map((p) => p.score)),
        };
      })()
    : null;

  return (
    <div className="space-y-6">
      {/* ── Back link ── */}
      <Link href="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground font-bold uppercase tracking-wider font-mono">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
        [ Back to Dashboard ]
      </Link>

      {/* ── Stock header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">{profile.symbol}</h1>
          <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wider font-mono">
            {sourceLabel[profile.source]} &middot; Updated {formatRelativeTime(profile.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-4xl font-black tabular-nums ${scoreTone(profile.score)}`}>
              {profile.score.toFixed(1)}
            </p>
            <p className={`text-xs font-bold uppercase tracking-wide ${scoreTone(profile.score)}`}>
              {scoreBandLabel(profile.score)}
            </p>
          </div>
          <div className={`h-16 w-2 ${scoreBg(profile.score)}`} />
        </div>
      </div>

      {/* ── Symbol info widget ── */}
      <TradingViewWidget
        scriptUrl={`${scriptBase}symbol-info.js`}
        config={withTheme(SYMBOL_INFO_WIDGET_CONFIG(normalized))}
        height={170}
      />

      {/* ── Chart + Signal overview ── */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <TradingViewWidget
          title="Price Chart"
          description="Candlestick chart with volume. Drag to zoom, double-click to reset."
          scriptUrl={`${scriptBase}advanced-chart.js`}
          config={withTheme(CANDLE_CHART_WIDGET_CONFIG(normalized))}
          height={600}
        />

        <div className="space-y-4">
          {/* AI narrative */}
          <div className="border-2 border-border bg-card p-5 brutalist-shadow">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">AI Summary</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground">{profile.narrative}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border-2 border-border bg-card p-4 brutalist-shadow">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Price</p>
              <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                ${profile.price.toFixed(2)}
              </p>
            </div>
            <div className="border-2 border-border bg-card p-4 brutalist-shadow">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Daily Change</p>
              <p className={`mt-2 text-2xl font-black tabular-nums ${profile.changePercent >= 0 ? 'text-success' : 'text-red-500'}`}>
                {profile.changePercent >= 0 ? '+' : ''}{profile.changePercent.toFixed(2)}%
              </p>
            </div>
            <div className="border-2 border-border bg-card p-4 brutalist-shadow">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Volume</p>
              <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                {formatCompactNumber(profile.volume)}
              </p>
            </div>
            <div className="border-2 border-border bg-card p-4 brutalist-shadow">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Volume Spike</p>
              <p className={`mt-2 text-2xl font-black tabular-nums ${profile.volumeZScore >= 0 ? 'text-success' : 'text-red-500'}`}>
                {profile.volumeZScore >= 0 ? '+' : ''}{profile.volumeZScore.toFixed(2)}z
              </p>
            </div>
            <div className="border-2 border-border bg-card p-4 brutalist-shadow">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Score Move</p>
              <p className={`mt-2 text-2xl font-black tabular-nums ${profile.scoreDelta >= 0 ? 'text-success' : 'text-red-500'}`}>
                {profile.scoreDelta >= 0 ? '+' : ''}{profile.scoreDelta.toFixed(1)} pts
              </p>
            </div>
            <div className="border-2 border-border bg-card p-4 brutalist-shadow">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Confidence</p>
              <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                {(profile.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Technical Analysis + Score Breakdown + Trend ── */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Technical Analysis */}
        <TradingViewWidget
          title="Technical Analysis"
          description="Buy, sell, and neutral indicators based on moving averages and oscillators."
          scriptUrl={`${scriptBase}technical-analysis.js`}
          config={withTheme({ ...TECHNICAL_ANALYSIS_WIDGET_CONFIG(normalized), height: 500 })}
          height={500}
        />

        {/* Score Breakdown */}
        <div className="border-2 border-border bg-card p-4 md:p-6 brutalist-shadow">
          <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Score Breakdown</h3>
          <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wider font-mono">
            Each factor contributes positively or negatively. Longer bars mean more impact.
          </p>

          <div className="mt-5 space-y-3">
            {profile.factors.map((factor) => {
              const absContribution = Math.abs(factor.contribution);
              const barWidth = Math.max(6, Math.min(100, absContribution * 5));
              const isPositive = factor.contribution >= 0;

              return (
                <div key={factor.name} className="border-2 border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground uppercase tracking-wide">{factor.label}</span>
                    <span className={`text-sm font-black tabular-nums ${isPositive ? 'text-success' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{factor.contribution.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-3 h-3 bg-muted">
                    <div
                      className={`h-3 ${isPositive ? 'bg-success' : 'bg-red-500'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                    Raw score: {factor.score.toFixed(1)} &middot; Weight: {(factor.weight * 100).toFixed(0)}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score Trend */}
        <div className="border-2 border-border bg-card p-4 md:p-6 brutalist-shadow">
          <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Score Trend</h3>
          <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wider font-mono">
            Signal strength over recent snapshots. Taller bars mean a stronger score at that time.
          </p>

          <div className="mt-5">
            {history.length > 0 ? (
              <div>
                <div className="flex h-[180px] items-end gap-1">
                  {history.slice(-16).map((point) => {
                    const height = Math.max(8, Math.min(100, point.score));
                    return (
                      <div
                        key={point.timestamp}
                        className="group relative flex-1"
                        title={`${new Date(point.timestamp).toLocaleString()} \u00b7 Score ${point.score.toFixed(1)}`}
                      >
                        <div
                          className={`w-full transition-colors ${scoreBg(point.score)} group-hover:opacity-80`}
                          style={{ height: `${height}%` }}
                        />
                        <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap border-2 border-border bg-card px-2 py-0.5 text-[9px] font-black text-foreground opacity-0 transition-opacity group-hover:opacity-100" style={{boxShadow: '2px 2px 0 0 var(--border)'}}>
                          {point.score.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                  <span>Older</span>
                  <span>Latest</span>
                </div>
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center border-2 border-border bg-muted/20">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-mono">No history data available yet.</p>
              </div>
            )}

            {trendStats && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="border-2 border-border p-3 text-center brutalist-shadow">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">Period Change</p>
                  <p className={`mt-1 text-base font-black tabular-nums ${trendStats.delta >= 0 ? 'text-success' : 'text-red-500'}`}>
                    {trendStats.delta >= 0 ? '+' : ''}{trendStats.delta.toFixed(1)}
                  </p>
                </div>
                <div className="border-2 border-border p-3 text-center brutalist-shadow">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">High</p>
                  <p className="mt-1 text-base font-black tabular-nums text-foreground">{trendStats.high.toFixed(1)}</p>
                </div>
                <div className="border-2 border-border p-3 text-center brutalist-shadow">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">Low</p>
                  <p className="mt-1 text-base font-black tabular-nums text-foreground">{trendStats.low.toFixed(1)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Company Profile + Financials ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        <TradingViewWidget
          title="Company Profile"
          description="Business overview, sector, and key company details."
          scriptUrl={`${scriptBase}symbol-profile.js`}
          config={withTheme(COMPANY_PROFILE_WIDGET_CONFIG(normalized))}
          height={440}
        />
        <TradingViewWidget
          title="Financials"
          description="Revenue, earnings, and balance sheet data."
          scriptUrl={`${scriptBase}financials.js`}
          config={withTheme(COMPANY_FINANCIALS_WIDGET_CONFIG(normalized))}
          height={464}
        />
      </div>
    </div>
  );
};

export default StockDetailDashboard;
