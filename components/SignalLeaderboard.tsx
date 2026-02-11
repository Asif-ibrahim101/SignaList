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
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* ── Header ── */}
      <div className="shrink-0 p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-foreground">Signal Rankings</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Symbols ranked by a custom scoring model. Pick one to see why it scored that way.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${dataStatusBadge.className}`}
              title={dataStatusBadge.title}
            >
              {dataStatusBadge.label}
            </span>
          </div>
        </div>

        {/* Actions row */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            Updated {lastRefreshAt ? formatRelativeTime(lastRefreshAt) : '...'}
          </span>
          <span className="text-border">|</span>
          <button
            type="button"
            onClick={() => void fetchSignals()}
            className="font-medium text-yellow-500 transition-colors hover:text-yellow-400"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void triggerBatchRecompute()}
            disabled={isRecomputing}
            className="font-medium text-yellow-500 transition-colors hover:text-yellow-400 disabled:opacity-60"
            title="Runs a deeper recompute pulling fresh data from all providers"
          >
            {isRecomputing ? 'Recomputing...' : 'Deep Recompute'}
          </button>
          <span className="text-border">|</span>
          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {showGuide ? 'Hide guide' : 'Score guide'}
          </button>
        </div>

        {/* Collapsible score guide */}
        {showGuide && (
          <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
            <p className="mb-2 text-xs font-medium text-foreground">What do the scores mean?</p>
            <div className="grid grid-cols-5 gap-2">
              {scoreBandGuide.map((band) => (
                <div key={band.range} className="text-center">
                  <div className={`mx-auto h-2 w-full rounded-full ${band.tone}`} />
                  <p className="mt-1 text-[11px] font-semibold text-foreground">{band.range}</p>
                  <p className="text-[10px] text-muted-foreground">{band.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Main content: list + detail ── */}
      <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[1.2fr_1fr]">
        {/* Symbol list */}
        <div className="flex flex-col border-t border-border xl:border-r">
          <div className="shrink-0 grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 border-b border-border px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>Symbol</span>
            <span className="text-right">Score</span>
            <span className="text-right">Move</span>
            <span className="text-right">Sentiment</span>
            <span className="text-right">Confidence</span>
            <span className="text-right">Details</span>
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
                    className={`grid w-full grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-3 border-b border-border px-4 py-3 text-sm transition-colors hover:bg-muted/30 ${
                      isSelected ? 'bg-muted/40' : ''
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
        <div className="flex flex-col border-t border-border overflow-y-auto">
          {loadingDetail ? (
            <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
              Loading details...
            </div>
          ) : detailError ? (
            <div className="p-4">
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                {detailError}
              </div>
            </div>
          ) : selectedProfile ? (
            <div>
              {/* Detail header */}
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-foreground">{selectedProfile.symbol}</h4>
                    <Link
                      href={`/app/signals/${encodeURIComponent(selectedProfile.symbol)}`}
                      className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500 transition-colors hover:bg-yellow-500/20"
                    >
                      Full Analysis &rarr;
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sourceLabel[selectedProfile.source]} &middot; {formatRelativeTime(selectedProfile.updatedAt)}
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
              <div className="flex border-b border-border px-4 md:px-6">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDetailTab(tab.key)}
                    className={`relative px-3 py-2.5 text-xs font-medium transition-colors ${
                      detailTab === tab.key
                        ? 'text-yellow-500'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                    {detailTab === tab.key && (
                      <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-yellow-500" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 md:p-6">
                {/* ── Overview tab ── */}
                {detailTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Narrative */}
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">AI Summary</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-foreground">{selectedProfile.narrative}</p>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-[11px] text-muted-foreground">Price</p>
                        <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
                          ${selectedProfile.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-[11px] text-muted-foreground">Daily Change</p>
                        <p className={`mt-0.5 text-base font-semibold tabular-nums ${selectedProfile.changePercent >= 0 ? 'text-success' : 'text-red-500'}`}>
                          {selectedProfile.changePercent >= 0 ? '+' : ''}
                          {selectedProfile.changePercent.toFixed(2)}%
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-[11px] text-muted-foreground">Volume</p>
                        <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
                          {formatCompactNumber(selectedProfile.volume)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-[11px] text-muted-foreground">Volume Spike</p>
                        <p className={`mt-0.5 text-base font-semibold tabular-nums ${selectedProfile.volumeZScore >= 0 ? 'text-success' : 'text-red-500'}`}>
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
