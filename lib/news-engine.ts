import { connectToDatabase } from '@/Database/Mongoose';
import NewsArticle from '@/models/NewsArticle';
import crypto from 'crypto';

// --- Types ---

export type NewsArticleView = {
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
  tickerSentiments: Array<{
    symbol: string;
    relevanceScore: number;
    sentimentScore: number;
    sentimentLabel: string;
  }>;
  provider: string;
  publishedAt: string;
};

export type NewsFilterParams = {
  symbol?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  category?: string;
  page?: number;
  limit?: number;
};

export type NewsFeedResponse = {
  articles: NewsArticleView[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

// --- Constants ---

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const ALPHA_BASE = 'https://www.alphavantage.co/query';
const FETCH_TIMEOUT_MS = 10_000;

const FINNHUB_FETCH_COOLDOWN_MS = 2 * 60 * 1000;
const ALPHA_FETCH_COOLDOWN_MS = 15 * 60 * 1000;

let lastFinnhubFetchAt = 0;
let lastAlphaFetchAt = 0;
let fetchInFlight: Promise<void> | null = null;

type SentimentLabel = 'Bullish' | 'Somewhat-Bullish' | 'Neutral' | 'Somewhat-Bearish' | 'Bearish';

const SYMBOL_CATEGORY_MAP: Record<string, string> = {
  AAPL: 'technology', MSFT: 'technology', GOOGL: 'technology', AMZN: 'technology',
  TSLA: 'technology', META: 'technology', NVDA: 'technology', NFLX: 'technology',
  ORCL: 'technology', CRM: 'technology', ADBE: 'technology', INTC: 'technology',
  AMD: 'technology', PYPL: 'technology', UBER: 'technology', ZOOM: 'technology',
  SPOT: 'technology', SQ: 'technology', SHOP: 'technology', ROKU: 'technology',
  SNOW: 'technology', PLTR: 'technology', COIN: 'technology', RBLX: 'technology',
  DDOG: 'technology', CRWD: 'technology', NET: 'technology', OKTA: 'technology',
  TWLO: 'technology', ZM: 'technology', DOCU: 'technology', PINS: 'technology',
  SNAP: 'technology',
  JPM: 'finance', BAC: 'finance', WFC: 'finance', C: 'finance',
  HSBC: 'finance', MA: 'finance', V: 'finance',
  JNJ: 'healthcare', PFE: 'healthcare', UNH: 'healthcare', MRK: 'healthcare',
  XOM: 'energy', CVX: 'energy', NEE: 'energy',
  WMT: 'consumer_goods', KO: 'consumer_goods', PG: 'consumer_goods',
  DASH: 'consumer_goods', ABNB: 'consumer_goods', LYFT: 'consumer_goods',
  PTON: 'consumer_goods',
  RIVN: 'technology', LCID: 'technology', NIO: 'technology',
  XPEV: 'technology', LI: 'technology',
  BABA: 'technology', JD: 'technology', PDD: 'technology',
  TME: 'technology', BILI: 'technology', DIDI: 'technology',
  GRAB: 'technology', SE: 'technology',
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  technology: ['tech', 'software', 'ai', 'artificial intelligence', 'chip', 'semiconductor', 'cloud', 'cyber', 'digital'],
  finance: ['bank', 'financial', 'fed', 'interest rate', 'lending', 'credit', 'mortgage', 'treasury'],
  healthcare: ['health', 'pharma', 'drug', 'fda', 'biotech', 'medical', 'vaccine', 'hospital'],
  energy: ['oil', 'gas', 'energy', 'solar', 'renewable', 'opec', 'petroleum', 'nuclear'],
  consumer_goods: ['retail', 'consumer', 'brand', 'store', 'shopping', 'delivery', 'food'],
  economy: ['gdp', 'inflation', 'unemployment', 'recession', 'economic', 'jobs report', 'cpi', 'trade war'],
};

const INDUSTRY_TO_CATEGORY: Record<string, string> = {
  Technology: 'technology',
  Healthcare: 'healthcare',
  Finance: 'finance',
  Energy: 'energy',
  'Consumer Goods': 'consumer_goods',
};

// --- Utilities ---

const fetchJson = async <T>(url: string): Promise<T | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const generateExternalId = (url: string, publishedAt: string): string => {
  return crypto.createHash('sha256').update(`${url}|${publishedAt}`).digest('hex').slice(0, 24);
};

const mapSentimentLabel = (score: number): SentimentLabel => {
  if (score >= 0.35) return 'Bullish';
  if (score >= 0.15) return 'Somewhat-Bullish';
  if (score > -0.15) return 'Neutral';
  if (score > -0.35) return 'Somewhat-Bearish';
  return 'Bearish';
};

const inferCategory = (symbols: string[], title: string): string => {
  for (const sym of symbols) {
    const cat = SYMBOL_CATEGORY_MAP[sym.toUpperCase()];
    if (cat) return cat;
  }

  const lower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }

  return 'general';
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// --- Raw article type ---

type RawArticle = {
  externalId: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  imageUrl: string;
  category: string;
  overallSentiment: number;
  sentimentLabel: string;
  tickerSentiments: Array<{
    symbol: string;
    relevanceScore: number;
    sentimentScore: number;
    sentimentLabel: string;
  }>;
  symbols: string[];
  provider: 'finnhub' | 'alpha_vantage';
  publishedAt: Date;
};

// --- Data Fetchers ---

const fetchFinnhubGeneralNews = async (): Promise<RawArticle[]> => {
  if (!FINNHUB_API_KEY) return [];

  const url = `${FINNHUB_BASE}/news?category=general&token=${FINNHUB_API_KEY}`;
  const payload = await fetchJson<Array<Record<string, unknown>>>(url);
  if (!Array.isArray(payload)) return [];

  const articles: RawArticle[] = [];

  for (const item of payload) {
    if (!item || typeof item !== 'object') continue;

    const headline = String(item.headline ?? '').trim();
    const articleUrl = String(item.url ?? '').trim();
    const datetime = Number(item.datetime) || 0;

    if (!headline || !articleUrl || !datetime) continue;

    const publishedAt = new Date(datetime * 1000);
    const relatedSymbols = typeof item.related === 'string'
      ? item.related.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean)
      : [];

    articles.push({
      externalId: generateExternalId(articleUrl, publishedAt.toISOString()),
      title: headline,
      summary: String(item.summary ?? '').trim(),
      url: articleUrl,
      source: String(item.source ?? 'Finnhub').trim(),
      imageUrl: String(item.image ?? '').trim(),
      category: inferCategory(relatedSymbols, headline),
      overallSentiment: 0,
      sentimentLabel: 'Neutral',
      tickerSentiments: [],
      symbols: relatedSymbols,
      provider: 'finnhub',
      publishedAt,
    });
  }

  return articles.slice(0, 50);
};

const fetchAlphaVantageNews = async (tickers?: string): Promise<RawArticle[]> => {
  if (!ALPHA_VANTAGE_API_KEY) return [];

  const tickerParam = tickers ? `&tickers=${encodeURIComponent(tickers)}` : '';
  const url = `${ALPHA_BASE}?function=NEWS_SENTIMENT${tickerParam}&sort=LATEST&limit=50&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const payload = await fetchJson<Record<string, unknown>>(url);
  if (!payload) return [];

  const feed = payload.feed;
  if (!Array.isArray(feed)) return [];

  const articles: RawArticle[] = [];

  for (const item of feed) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;

    const title = String(record.title ?? '').trim();
    const articleUrl = String(record.url ?? '').trim();
    const timePublished = String(record.time_published ?? '').trim();

    if (!title || !articleUrl || !timePublished) continue;

    // Alpha Vantage time format: 20240101T120000
    const year = timePublished.slice(0, 4);
    const month = timePublished.slice(4, 6);
    const day = timePublished.slice(6, 8);
    const hour = timePublished.slice(9, 11);
    const minute = timePublished.slice(11, 13);
    const second = timePublished.slice(13, 15);
    const publishedAt = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);

    if (isNaN(publishedAt.getTime())) continue;

    const overallSentiment = clamp(Number(record.overall_sentiment_score) || 0, -1, 1);
    const sentimentLabel = typeof record.overall_sentiment_label === 'string'
      ? record.overall_sentiment_label
      : mapSentimentLabel(overallSentiment);

    const tickerSentimentsRaw = Array.isArray(record.ticker_sentiment) ? record.ticker_sentiment : [];
    const tickerSentiments: RawArticle['tickerSentiments'] = [];
    const symbols: string[] = [];

    for (const ts of tickerSentimentsRaw) {
      if (!ts || typeof ts !== 'object') continue;
      const tickerRecord = ts as Record<string, unknown>;

      const sym = String(tickerRecord.ticker ?? '').trim().toUpperCase();
      if (!sym) continue;

      const relevanceScore = clamp(Number(tickerRecord.relevance_score) || 0, 0, 1);
      const sentimentScore = clamp(Number(tickerRecord.ticker_sentiment_score) || 0, -1, 1);
      const tsLabel = typeof tickerRecord.ticker_sentiment_label === 'string'
        ? tickerRecord.ticker_sentiment_label
        : mapSentimentLabel(sentimentScore);

      tickerSentiments.push({ symbol: sym, relevanceScore, sentimentScore, sentimentLabel: tsLabel });
      symbols.push(sym);
    }

    // Normalize Alpha Vantage sentiment label to our enum
    const normalizedLabel = normalizeSentimentLabel(sentimentLabel);

    articles.push({
      externalId: generateExternalId(articleUrl, publishedAt.toISOString()),
      title,
      summary: String(record.summary ?? '').trim(),
      url: articleUrl,
      source: String(record.source ?? 'Alpha Vantage').trim(),
      imageUrl: String(record.banner_image ?? '').trim(),
      category: inferCategory(symbols, title),
      overallSentiment,
      sentimentLabel: normalizedLabel,
      tickerSentiments,
      symbols: [...new Set(symbols)],
      provider: 'alpha_vantage',
      publishedAt,
    });
  }

  return articles;
};

const normalizeSentimentLabel = (label: string): SentimentLabel => {
  const mapping: Record<string, SentimentLabel> = {
    Bullish: 'Bullish',
    'Somewhat-Bullish': 'Somewhat-Bullish',
    'Somewhat_Bullish': 'Somewhat-Bullish',
    Neutral: 'Neutral',
    'Somewhat-Bearish': 'Somewhat-Bearish',
    'Somewhat_Bearish': 'Somewhat-Bearish',
    Bearish: 'Bearish',
  };
  return mapping[label] ?? 'Neutral';
};

// --- Persistence ---

const persistArticles = async (articles: RawArticle[]): Promise<number> => {
  if (!articles.length) return 0;

  await connectToDatabase();

  const operations = articles.map((article) => ({
    updateOne: {
      filter: { externalId: article.externalId },
      update: { $setOnInsert: article },
      upsert: true,
    },
  }));

  const result = await NewsArticle.bulkWrite(operations, { ordered: false });
  return result.upsertedCount;
};

// --- Refresh Orchestrator ---

const refreshNewsInternal = async (symbols?: string[]) => {
  const now = Date.now();
  const promises: Promise<RawArticle[]>[] = [];

  if (now - lastFinnhubFetchAt >= FINNHUB_FETCH_COOLDOWN_MS) {
    lastFinnhubFetchAt = now;
    promises.push(fetchFinnhubGeneralNews());
  }

  if (now - lastAlphaFetchAt >= ALPHA_FETCH_COOLDOWN_MS) {
    lastAlphaFetchAt = now;
    const tickers = symbols?.length ? symbols.slice(0, 5).join(',') : undefined;
    promises.push(fetchAlphaVantageNews(tickers));
  }

  if (!promises.length) return;

  const results = await Promise.allSettled(promises);
  const allArticles: RawArticle[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    }
  }

  const inserted = await persistArticles(allArticles);
  console.log(`[news-engine] persisted ${inserted} new article(s) from ${allArticles.length} fetched`);
};

export const refreshNewsFeed = async (symbols?: string[]) => {
  if (!fetchInFlight) {
    fetchInFlight = refreshNewsInternal(symbols)
      .catch((error) => {
        console.error('[news-engine] refresh failed:', error);
      })
      .finally(() => {
        fetchInFlight = null;
      });
  }

  await fetchInFlight;
};

// --- Query Functions ---

const toView = (row: Record<string, unknown>): NewsArticleView => {
  const tickerSentimentsRaw = Array.isArray(row.tickerSentiments) ? row.tickerSentiments : [];

  return {
    id: String(row._id ?? ''),
    title: String(row.title ?? ''),
    summary: String(row.summary ?? ''),
    url: String(row.url ?? ''),
    source: String(row.source ?? ''),
    imageUrl: String(row.imageUrl ?? ''),
    category: String(row.category ?? 'general'),
    overallSentiment: Number(row.overallSentiment) || 0,
    sentimentLabel: String(row.sentimentLabel ?? 'Neutral'),
    symbols: Array.isArray(row.symbols) ? row.symbols.map((s: unknown) => String(s)) : [],
    tickerSentiments: tickerSentimentsRaw
      .filter((ts): ts is Record<string, unknown> => Boolean(ts && typeof ts === 'object'))
      .map((ts) => ({
        symbol: String(ts.symbol ?? ''),
        relevanceScore: Number(ts.relevanceScore) || 0,
        sentimentScore: Number(ts.sentimentScore) || 0,
        sentimentLabel: String(ts.sentimentLabel ?? 'Neutral'),
      })),
    provider: String(row.provider ?? ''),
    publishedAt: row.publishedAt instanceof Date
      ? row.publishedAt.toISOString()
      : typeof row.publishedAt === 'string'
        ? row.publishedAt
        : new Date().toISOString(),
  };
};

export const queryNews = async (filters: NewsFilterParams): Promise<NewsFeedResponse> => {
  const page = Math.max(filters.page ?? 1, 1);
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 50);
  const skip = (page - 1) * limit;

  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (filters.symbol) {
    query.symbols = filters.symbol.trim().toUpperCase();
  }

  if (filters.sentiment) {
    if (filters.sentiment === 'bullish') {
      query.sentimentLabel = { $in: ['Bullish', 'Somewhat-Bullish'] };
    } else if (filters.sentiment === 'bearish') {
      query.sentimentLabel = { $in: ['Bearish', 'Somewhat-Bearish'] };
    } else {
      query.sentimentLabel = 'Neutral';
    }
  }

  if (filters.category) {
    query.category = filters.category;
  }

  const [rows, total] = await Promise.all([
    NewsArticle.find(query).sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
    NewsArticle.countDocuments(query),
  ]);

  const articles = (rows as Record<string, unknown>[]).map(toView);

  return {
    articles,
    total,
    page,
    limit,
    hasMore: skip + articles.length < total,
  };
};

export const getPersonalizedNews = async (
  _userId: string,
  preferredIndustry: string,
  trackedSymbols: string[],
  page: number,
  limit: number
): Promise<NewsFeedResponse> => {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const skip = (safePage - 1) * safeLimit;

  await connectToDatabase();

  const orConditions: Record<string, unknown>[] = [];

  if (trackedSymbols.length) {
    orConditions.push({ symbols: { $in: trackedSymbols } });
  }

  const categoryKey = INDUSTRY_TO_CATEGORY[preferredIndustry];
  if (categoryKey) {
    orConditions.push({ category: categoryKey });
  }

  const query = orConditions.length ? { $or: orConditions } : {};

  const [rows, total] = await Promise.all([
    NewsArticle.find(query).sort({ publishedAt: -1 }).skip(skip).limit(safeLimit).lean(),
    NewsArticle.countDocuments(query),
  ]);

  const articles = (rows as Record<string, unknown>[]).map(toView);

  return {
    articles,
    total,
    page: safePage,
    limit: safeLimit,
    hasMore: skip + articles.length < total,
  };
};

export const cleanupOldArticles = async (olderThanDays = 7): Promise<number> => {
  await connectToDatabase();
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const result = await NewsArticle.deleteMany({ publishedAt: { $lt: cutoff } });
  return result.deletedCount;
};
