'use client'

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

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

type DataStatus = 'live' | 'partial_fallback' | 'fallback';

type SignalListResponse = {
  items: SignalProfileView[];
  fallbackUsed: boolean;
  syntheticCount: number;
  liveCount: number;
  fallbackRatio: number;
  dataStatus: DataStatus;
  refreshedAt: string;
};

type DetailTab = 'overview' | 'factors' | 'trend';

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

const scoreBandGuide = [
  { range: '80-100', label: 'Strong Bullish', tone: 'bg-success' },
  { range: '65-79', label: 'Bullish', tone: 'bg-yellow-500' },
  { range: '50-64', label: 'Neutral', tone: 'bg-muted-foreground' },
  { range: '35-49', label: 'Cautious', tone: 'bg-orange-500' },
  { range: '0-34', label: 'High Risk', tone: 'bg-red-500' },
];

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

const SignalLeaderboard = () => {
  const [signals, setSignals] = useState<SignalProfileView[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [detail, setDetail] = useState<SignalDetailResponse | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [dataStatus, setDataStatus] = useState<DataStatus>('live');
  const [fallbackRatio, setFallbackRatio] = useState(0);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

  const fetchSignals = useCallback(async () => {
    setLoadingList(true);
    setListError(null);

    try {
      const response = await fetch('/api/signals?limit=24', { cache: 'no-store' });
      const payload = (await response.json()) as Partial<SignalListResponse> & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load signals.');
      }

      const items = Array.isArray(payload.items) ? payload.items : [];
      setSignals(items);
      setDataStatus(payload.dataStatus ?? 'live');
      setFallbackRatio(payload.fallbackRatio ?? 0);
      setLastRefreshAt(payload.refreshedAt ?? new Date().toISOString());

      setSelectedSymbol((current) => {
        if (current && items.some((item) => item.symbol === current)) return current;
        return items[0]?.symbol ?? '';
      });
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load signals.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  const fetchDetail = useCallback(async (symbol: string) => {
    setLoadingDetail(true);
    setDetailError(null);

    try {
      const response = await fetch(`/api/signals/${encodeURIComponent(symbol)}`, { cache: 'no-store' });
      const payload = (await response.json()) as Partial<SignalDetailResponse> & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? `Failed to load ${symbol} details.`);
      }

      if (!payload.profile || !Array.isArray(payload.history)) {
        throw new Error('Signal detail payload is invalid.');
      }

      setDetail({
        profile: payload.profile,
        history: payload.history,
      });
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Failed to load detail.');
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void fetchSignals();
    const interval = setInterval(() => {
      void fetchSignals();
    }, 60_000);

    return () => clearInterval(interval);
  }, [fetchSignals]);

  useEffect(() => {
    if (!selectedSymbol) return;
    void fetchDetail(selectedSymbol);
  }, [fetchDetail, selectedSymbol]);

  const triggerBatchRecompute = useCallback(async () => {
    setIsRecomputing(true);
    try {
      const response = await fetch('/api/signals/recompute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'batch' }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to run batch recompute.');
      }

      await fetchSignals();
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to run batch recompute.');
    } finally {
      setIsRecomputing(false);
    }
  }, [fetchSignals]);

  const selectedProfile = useMemo(() => {
    if (detail?.profile) return detail.profile;
    return signals.find((item) => item.symbol === selectedSymbol) ?? null;
  }, [detail?.profile, selectedSymbol, signals]);

  const dataStatusBadge = useMemo(() => {
    if (dataStatus === 'live') {
      return {
        className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500',
        label: 'Live Data',
        title: 'All rows are from provider data.',
      };
    }
    if (dataStatus === 'partial_fallback') {
      return {
        className: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500',
        label: `Partial Fallback \u00b7 ${Math.round(fallbackRatio * 100)}%`,
        title: 'Some rows use fallback due to temporary provider limits/timeouts.',
      };
    }
    return {
      className: 'border-red-500/40 bg-red-500/10 text-red-500',
      label: `Fallback Active \u00b7 ${Math.round(fallbackRatio * 100)}%`,
      title: 'Many rows currently use fallback data.',
    };
  }, [dataStatus, fallbackRatio]);

  const detailTabs: Array<{ key: DetailTab; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'factors', label: 'Score Breakdown' },
    { key: 'trend', label: 'Trend' },
  ];

  return (
    <div className="flex h-full flex-col border-2 border-border bg-card brutalist-shadow">
      {/* ── Header ── */}
      <div className="shrink-0 p-4 md:p-6 border-b-2 border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Signal Rankings</h3>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Symbols ranked by custom scoring model. Select to analyze.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`border-2 px-3 py-1 text-xs font-bold uppercase tracking-wider font-mono ${dataStatusBadge.className}`}
              title={dataStatusBadge.title}
            >
              {dataStatusBadge.label}
            </span>
          </div>
        </div>

        {/* Actions row */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="text-muted-foreground uppercase tracking-wider">
            Updated {lastRefreshAt ? formatRelativeTime(lastRefreshAt) : '...'}
          </span>
          <span className="text-border">|</span>
          <button
            type="button"
            onClick={() => void fetchSignals()}
            className="font-bold text-primary uppercase tracking-wider transition-colors hover:text-foreground"
          >
            [ Refresh ]
          </button>
          <button
            type="button"
            onClick={() => void triggerBatchRecompute()}
            disabled={isRecomputing}
            className="font-bold text-primary uppercase tracking-wider transition-colors hover:text-foreground disabled:opacity-60"
            title="Runs a deeper recompute pulling fresh data from all providers"
          >
            [ {isRecomputing ? 'Recomputing...' : 'Deep Recompute'} ]
          </button>
          <span className="text-border">|</span>
          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            className="text-muted-foreground uppercase tracking-wider font-bold transition-colors hover:text-foreground"
          >
            [ {showGuide ? 'Hide guide' : 'Score guide'} ]
          </button>
        </div>

        {/* Collapsible score guide */}
        {showGuide && (
          <div className="mt-4 border-2 border-border bg-muted/20 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground font-mono">Score Reference</p>
            <div className="grid grid-cols-5 gap-2">
              {scoreBandGuide.map((band) => (
                <div key={band.range} className="text-center border border-border p-2 bg-card">
                  <div className={`mx-auto h-2 w-full ${band.tone}`} />
                  <p className="mt-2 text-[11px] font-black text-foreground font-mono">{band.range}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{band.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Main content: list + detail ── */}
      <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[1.2fr_1fr]">
        {/* Symbol list */}
        <div className="flex flex-col border-t-2 border-border xl:border-r-2">
          <div className="shrink-0 grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 border-b-2 border-border bg-muted/20 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
            <span>Symbol</span>
            <span className="text-right">Score</span>
            <span className="text-right">Move</span>
            <span className="text-right">Sentiment</span>
            <span className="text-right">Conf</span>
            <span className="text-right">View</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading signals...</div>
            ) : listError ? (
              <div className="p-4">
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                  {listError}
                </div>
              </div>
            ) : !signals.length ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No signals yet.</div>
            ) : (
              signals.map((signal, index) => {
                const isSelected = signal.symbol === selectedSymbol;

                return (
                  <div
                    key={signal.symbol}
                    className={`grid w-full grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-3 border-b border-border px-4 py-3 text-sm transition-colors hover:bg-foreground hover:text-background ${
                      isSelected ? 'bg-primary/10 border-primary border-l-4' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSymbol(signal.symbol)}
                      className="min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-muted-foreground bg-muted">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-foreground">{signal.symbol}</span>
                      </div>
                      <div className="mt-0.5 pl-7">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1 w-12 rounded-full bg-muted">
                            <div
                              className={`h-1 rounded-full ${scoreBg(signal.score)}`}
                              style={{ width: `${Math.min(100, signal.score)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{scoreBandLabel(signal.score)}</span>
                        </div>
                      </div>
                    </button>

                    <button type="button" onClick={() => setSelectedSymbol(signal.symbol)} className={`text-right font-bold tabular-nums ${scoreTone(signal.score)}`}>
                      {signal.score.toFixed(1)}
                    </button>

                    <button type="button" onClick={() => setSelectedSymbol(signal.symbol)} className={`text-right tabular-nums ${signal.scoreDelta >= 0 ? 'text-success' : 'text-red-500'}`}>
                      {signal.scoreDelta >= 0 ? '+' : ''}
                      {signal.scoreDelta.toFixed(1)}
                    </button>

                    <button type="button" onClick={() => setSelectedSymbol(signal.symbol)} className={`text-right tabular-nums ${signal.sentiment >= 0 ? 'text-success' : 'text-red-500'}`}>
                      {signal.sentiment >= 0 ? '+' : ''}
                      {signal.sentiment.toFixed(2)}
                    </button>

                    <button type="button" onClick={() => setSelectedSymbol(signal.symbol)} className="text-right tabular-nums text-muted-foreground">
                      {(signal.confidence * 100).toFixed(0)}%
                    </button>

                    <Link
                      href={`/app/signals/${encodeURIComponent(signal.symbol)}`}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-yellow-500 transition-colors hover:text-yellow-400 hover:bg-yellow-500/10"
                      title={`Open ${signal.symbol} deep dive`}
                    >
                      <span>View</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex flex-col border-t-2 border-border overflow-y-auto">
          {loadingDetail ? (
            <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground uppercase font-mono tracking-wider">
              Loading...
            </div>
          ) : detailError ? (
            <div className="p-4">
              <div className="border-2 border-destructive bg-destructive/10 p-4 text-sm text-destructive font-bold">
                {detailError}
              </div>
            </div>
          ) : selectedProfile ? (
            <div>
              {/* Detail header */}
              <div className="flex items-center justify-between gap-3 border-b-2 border-border bg-muted/20 px-4 py-4 md:px-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-2xl font-black uppercase tracking-tighter text-foreground">{selectedProfile.symbol}</h4>
                    <Link
                      href={`/app/signals/${encodeURIComponent(selectedProfile.symbol)}`}
                      className="border-2 border-primary bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground font-mono"
                    >
                      Full Analysis →
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono font-bold mt-1">
                    {sourceLabel[selectedProfile.source]} · {formatRelativeTime(selectedProfile.updatedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold tabular-nums ${scoreTone(selectedProfile.score)}`}>
                    {selectedProfile.score.toFixed(1)}
                  </p>
                  <p className={`text-xs font-medium ${scoreTone(selectedProfile.score)}`}>
                    {scoreBandLabel(selectedProfile.score)}
                  </p>
                </div>
              </div>

              {/* Detail tabs */}
              <div className="flex border-b-2 border-border px-4 md:px-6 bg-border gap-px">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDetailTab(tab.key)}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors font-mono ${
                      detailTab === tab.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-foreground hover:text-background'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4 md:p-6">
                {/* ── Overview tab ── */}
                {detailTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Narrative */}
                    <div className="border-2 border-border bg-muted/20 p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground font-mono mb-3">AI Summary</p>
                      <p className="text-sm leading-relaxed font-medium text-foreground">{selectedProfile.narrative}</p>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 border-2 border-border bg-border gap-px">
                      <div className="bg-card p-4">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold font-mono">Price</p>
                        <p className="mt-2 text-lg font-black tabular-nums text-foreground">
                          ${selectedProfile.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-card p-4">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold font-mono">Daily Change</p>
                        <p className={`mt-2 text-lg font-black tabular-nums ${selectedProfile.changePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {selectedProfile.changePercent >= 0 ? '+' : ''}
                          {selectedProfile.changePercent.toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-card p-4">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold font-mono">Volume</p>
                        <p className="mt-2 text-lg font-black tabular-nums text-foreground">
                          {formatCompactNumber(selectedProfile.volume)}
                        </p>
                      </div>
                      <div className="bg-card p-4">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold font-mono">Volume Spike</p>
                        <p className={`mt-2 text-lg font-black tabular-nums ${selectedProfile.volumeZScore >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {selectedProfile.volumeZScore >= 0 ? '+' : ''}
                          {selectedProfile.volumeZScore.toFixed(2)}z
                        </p>
                      </div>
                    </div>

                    {/* Quick score delta */}
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <span className="text-xs text-muted-foreground">Score moved since last snapshot</span>
                      <span className={`text-sm font-bold tabular-nums ${selectedProfile.scoreDelta >= 0 ? 'text-success' : 'text-red-500'}`}>
                        {selectedProfile.scoreDelta >= 0 ? '+' : ''}
                        {selectedProfile.scoreDelta.toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Factors tab ── */}
                {detailTab === 'factors' && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Each factor contributes positively or negatively to the overall score. Longer bars mean more impact.
                    </p>
                    {selectedProfile.factors.map((factor) => {
                      const absContribution = Math.abs(factor.contribution);
                      const maxWidth = Math.max(6, Math.min(100, absContribution * 5));
                      const isPositive = factor.contribution >= 0;

                      return (
                        <div key={factor.name} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{factor.label}</span>
                            <span className={`text-sm font-bold tabular-nums ${isPositive ? 'text-success' : 'text-red-500'}`}>
                              {isPositive ? '+' : ''}{factor.contribution.toFixed(1)}
                            </span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full transition-all ${isPositive ? 'bg-success' : 'bg-red-500'}`}
                              style={{ width: `${maxWidth}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Raw score: {factor.score.toFixed(1)} &middot; Weight: {(factor.weight * 100).toFixed(0)}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Trend tab ── */}
                {detailTab === 'trend' && (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Score history over recent snapshots. Taller bars indicate a stronger signal at that time.
                    </p>

                    {(detail?.history ?? []).length > 0 ? (
                      <div>
                        <div className="flex h-[140px] items-end gap-1">
                          {(detail?.history ?? []).slice(-12).map((point) => {
                            const height = Math.max(8, Math.min(100, point.score));
                            return (
                              <div
                                key={point.timestamp}
                                className="group relative flex-1"
                                title={`${new Date(point.timestamp).toLocaleString()} \u00b7 Score ${point.score.toFixed(1)}`}
                              >
                                <div
                                  className={`w-full rounded-t transition-colors ${scoreBg(point.score)} group-hover:opacity-80`}
                                  style={{ height: `${height}%` }}
                                />
                                <div className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-card px-1 py-0.5 text-[9px] font-medium text-foreground opacity-0 shadow-sm border border-border group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {point.score.toFixed(1)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                          <span>Older</span>
                          <span>Latest</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-[140px] items-center justify-center rounded-lg border border-border bg-muted/20">
                        <p className="text-sm text-muted-foreground">No history data available yet.</p>
                      </div>
                    )}

                    {/* Trend stats */}
                    {(detail?.history ?? []).length >= 2 && (() => {
                      const points = detail?.history ?? [];
                      const latest = points[points.length - 1];
                      const oldest = points[0];
                      const trendDelta = latest.score - oldest.score;
                      const max = Math.max(...points.map((p) => p.score));
                      const min = Math.min(...points.map((p) => p.score));

                      return (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg border border-border p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Period Change</p>
                            <p className={`text-sm font-bold tabular-nums ${trendDelta >= 0 ? 'text-success' : 'text-red-500'}`}>
                              {trendDelta >= 0 ? '+' : ''}{trendDelta.toFixed(1)}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">High</p>
                            <p className="text-sm font-bold tabular-nums text-foreground">{max.toFixed(1)}</p>
                          </div>
                          <div className="rounded-lg border border-border p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Low</p>
                            <p className="text-sm font-bold tabular-nums text-foreground">{min.toFixed(1)}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <p className="text-sm text-muted-foreground">Select a symbol from the list to see its analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignalLeaderboard;
