'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type TickerSentiment = {
  symbol: string;
  relevanceScore: number;
  sentimentScore: number;
  sentimentLabel: string;
};

type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  imageUrl: string;
  category: string;
  overallSentiment: number;
  sentimentLabel: string;
  symbols: string[];
  tickerSentiments: TickerSentiment[];
  provider: string;
  publishedAt: string;
};

type Tab = 'all' | 'for_you';

const categoryLabels: Record<string, string> = {
  technology: 'Technology',
  finance: 'Finance',
  energy: 'Energy',
  healthcare: 'Healthcare',
  consumer_goods: 'Consumer',
  general: 'General',
  economy: 'Economy',
};

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'energy', label: 'Energy' },
  { value: 'consumer_goods', label: 'Consumer Goods' },
  { value: 'economy', label: 'Economy' },
];

const sentimentOptions = [
  { value: '', label: 'All Sentiment' },
  { value: 'bullish', label: 'Bullish' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'bearish', label: 'Bearish' },
];

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

const sentimentBadgeClasses = (label: string) => {
  if (label === 'Bullish' || label === 'Somewhat-Bullish')
    return 'border-emerald-500 bg-emerald-500/20 text-emerald-500';
  if (label === 'Bearish' || label === 'Somewhat-Bearish')
    return 'border-red-500 bg-red-500/20 text-red-500';
  return 'border-border bg-muted/20 text-muted-foreground';
};

const sentimentDisplayLabel = (label: string) => {
  const mapping: Record<string, string> = {
    Bullish: 'Bullish',
    'Somewhat-Bullish': 'Mildly Bullish',
    Neutral: 'Neutral',
    'Somewhat-Bearish': 'Mildly Bearish',
    Bearish: 'Bearish',
  };
  return mapping[label] ?? label;
};

const NewsFeed = () => {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const [symbolFilter, setSymbolFilter] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchNews = useCallback(
    async (pageNum: number, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const endpoint = activeTab === 'for_you' ? '/api/news/personalized' : '/api/news';
        const params = new URLSearchParams();
        params.set('page', String(pageNum));
        params.set('limit', '20');

        if (activeTab === 'all') {
          if (symbolFilter.trim()) params.set('symbol', symbolFilter.trim().toUpperCase());
          if (sentimentFilter) params.set('sentiment', sentimentFilter);
          if (categoryFilter) params.set('category', categoryFilter);
        }

        const response = await fetch(`${endpoint}?${params}`, { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to load news.');
        }

        const fetched: NewsArticle[] = Array.isArray(payload.articles) ? payload.articles : [];

        setArticles((prev) => (append ? [...prev, ...fetched] : fetched));
        setHasMore(Boolean(payload.hasMore));
        setTotal(Number(payload.total) || 0);
        setPage(pageNum);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load news.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, symbolFilter, sentimentFilter, categoryFilter]
  );

  useEffect(() => {
    void fetchNews(1);
    const interval = setInterval(() => {
      void fetchNews(1);
    }, 5 * 60_000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setArticles([]);
    setPage(1);
    setHasMore(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      void fetchNews(page + 1, true);
    }
  };

  const handleFilterReset = () => {
    setSymbolFilter('');
    setSentimentFilter('');
    setCategoryFilter('');
  };

  const hasActiveFilters = Boolean(symbolFilter.trim() || sentimentFilter || categoryFilter);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'all', label: 'All News' },
    { key: 'for_you', label: 'For You' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-2 border-border bg-card p-6 brutalist-shadow">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">Market News</h1>
        <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wider font-mono">
          Latest financial news with sentiment analysis from multiple sources.
        </p>
      </div>

      {/* Tabs + Filters Bar */}
      <div className="border-2 border-border bg-card brutalist-shadow">
        {/* Tabs */}
        <div className="flex shrink-0 border-b-2 border-border px-4 md:px-6 bg-border gap-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors font-mono ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-foreground hover:text-background'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Article count */}
          {!loading && total > 0 && (
            <div className="ml-auto flex items-center bg-card px-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono font-bold">
                {total} article{total !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Filters (only on All News tab) */}
        {activeTab === 'all' && (
          <div className="shrink-0 border-b-2 border-border px-4 py-4 md:px-6 bg-muted/20">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="FILTER BY SYMBOL..."
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value)}
                className="h-10 w-40 border-2 border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 uppercase font-mono font-bold tracking-wider"
              />
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="h-10 border-2 border-border bg-background px-3 text-xs text-foreground uppercase font-mono font-bold tracking-wider"
              >
                {sentimentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 border-2 border-border bg-background px-3 text-xs text-foreground uppercase font-mono font-bold tracking-wider"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleFilterReset}
                  className="border-2 border-border bg-background px-3 py-2 text-xs font-black uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden border-2 border-border bg-card brutalist-shadow">
              <div className="h-36 bg-muted" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 bg-muted" />
                <div className="h-3 w-full bg-muted" />
                <div className="h-3 w-5/6 bg-muted" />
                <div className="h-3 w-1/2 bg-muted" />
                <div className="flex gap-2 pt-1">
                  <div className="h-5 w-12 bg-muted" />
                  <div className="h-5 w-12 bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="border-2 border-red-500 bg-red-500/10 p-6 brutalist-shadow">
          <p className="text-center text-sm font-bold text-red-500 uppercase tracking-wide">{error}</p>
        </div>
      ) : !articles.length ? (
        <div className="border-2 border-border bg-card py-16 text-center brutalist-shadow">
          <svg
            className="mx-auto h-10 w-10 text-muted-foreground/40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8V6Z" />
          </svg>
          <p className="mt-3 text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'No articles match your filters.'
              : activeTab === 'for_you'
                ? 'No personalized news yet. Create alert rules with symbols to personalize your feed.'
                : 'No news articles available. They will appear after the next data refresh.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleFilterReset}
              className="mt-4 border-2 border-border bg-background px-4 py-2 text-xs font-black uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
              style={{boxShadow: '4px 4px 0 0 var(--border)'}}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <div
                key={article.id}
                role="button"
                tabIndex={0}
                onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.open(article.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="group flex cursor-pointer flex-col overflow-hidden border-2 border-border bg-card transition-all hover:border-foreground brutalist-shadow hover:translate-x-1 hover:translate-y-1"
              >
                {/* Image / Gradient Header */}
                <div className="relative h-36 w-full shrink-0 overflow-hidden border-b-2 border-border">
                  {article.imageUrl ? (
                    <>
                      <img
                        src={article.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </>
                  ) : (
                    <div className="h-full w-full bg-muted">
                      <div className="flex h-full items-center justify-center">
                        <svg
                          className="h-8 w-8 text-muted-foreground/20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="square"
                          strokeLinejoin="miter"
                        >
                          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                          <path d="M18 14h-8" />
                          <path d="M15 18h-5" />
                          <path d="M10 6h8v4h-8V6Z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Sentiment badge overlay */}
                  <div className="absolute right-2 top-2">
                    <span
                      className={`inline-block border-2 px-2 py-1 text-[10px] font-black uppercase tracking-wider ${sentimentBadgeClasses(
                        article.sentimentLabel
                      )}`}
                      style={{boxShadow: '2px 2px 0 0 rgba(0,0,0,0.3)'}}
                    >
                      {sentimentDisplayLabel(article.sentimentLabel)}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-4">
                  {/* Title */}
                  <h4 className="line-clamp-2 text-sm font-bold leading-tight text-foreground uppercase tracking-tight">
                    {article.title}
                  </h4>

                  {/* Summary */}
                  {article.summary && (
                    <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {article.summary}
                    </p>
                  )}

                  {/* Spacer to push bottom content down */}
                  <div className="mt-auto" />

                  {/* Meta row */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                    <span className="font-bold">{article.source}</span>
                    <span className="text-border">·</span>
                    <span>{formatRelativeTime(article.publishedAt)}</span>
                    {article.category !== 'general' && (
                      <span className="ml-auto border border-border bg-muted/30 px-2 py-0.5 text-[9px] font-bold">
                        {categoryLabels[article.category] ?? article.category}
                      </span>
                    )}
                  </div>

                  {/* Symbol tags */}
                  {article.symbols.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {article.symbols.slice(0, 5).map((sym) => (
                        <Link
                          key={sym}
                          href={`/app/signals/${encodeURIComponent(sym)}`}
                          className="border-2 border-primary bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider transition-colors hover:bg-primary hover:text-primary-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {sym}
                        </Link>
                      ))}
                      {article.symbols.length > 5 && (
                        <span className="border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          +{article.symbols.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="border-2 border-border px-6 py-3 text-sm font-black uppercase tracking-wide text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:opacity-60"
                style={{boxShadow: '4px 4px 0 0 var(--border)'}}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {/* End of list indicator */}
          {!hasMore && articles.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              You&apos;ve reached the end.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
