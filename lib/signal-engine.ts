import { connectToDatabase } from '@/Database/Mongoose';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import AlertEvent from '@/models/AlertEvent';
import AlertRule from '@/models/AlertRule';
import SignalProfile from '@/models/SignalProfile';
import SignalSnapshot from '@/models/SignalSnapshot';

export type RefreshMode = 'intraday' | 'batch';
export type SignalSource = 'hybrid' | 'finnhub' | 'alpha_vantage' | 'synthetic';

export type SignalFactorContribution = {
  name: string;
  label: string;
  score: number;
  weight: number;
  contribution: number;
  direction: 'positive' | 'negative' | 'neutral';
};

export type SignalProfileView = {
  symbol: string;
  score: number;
  scoreDelta: number;
  confidence: number;
  price: number;
  changePercent: number;
  volume: number;
  sentiment: number;
  volumeZScore: number;
  source: SignalSource;
  narrative: string;
  factors: SignalFactorContribution[];
  updatedAt: string;
  lastMode: RefreshMode;
};

export type SignalDetailView = {
  profile: SignalProfileView;
  history: Array<{
    timestamp: string;
    score: number;
    scoreDelta: number;
    changePercent: number;
    sentiment: number;
  }>;
};

type ProviderMeta = {
  finnhubQuote: boolean;
  alphaQuote: boolean;
  finnhubSentiment: boolean;
  alphaSentiment: boolean;
  syntheticFallback: boolean;
};

type ProviderSignalInput = {
  symbol: string;
  price: number;
  previousClose: number;
  changePercent: number;
  volume: number;
  sentiment: number;
  providerAgreement: number;
  source: SignalSource;
  providerMeta: ProviderMeta;
};

type PreviousSignalProfile = {
  symbol: string;
  score: number;
  avgVolume: number;
  volumeStd: number;
  volatility: number;
};

type ComputedSignal = {
  symbol: string;
  score: number;
  scoreDelta: number;
  confidence: number;
  price: number;
  changePercent: number;
  volume: number;
  sentiment: number;
  volumeZScore: number;
  source: SignalSource;
  narrative: string;
  factors: SignalFactorContribution[];
  providerMeta: ProviderMeta;
  avgVolume: number;
  volumeStd: number;
  volatility: number;
};

type QuotePayload = {
  price: number;
  previousClose: number;
  changePercent?: number;
  volume?: number;
};

type AlertCondition = {
  field: 'score' | 'scoreDelta' | 'sentiment' | 'volumeZScore' | 'confidence' | 'changePercent';
  operator: '>' | '>=' | '<' | '<=' | '==';
  value: number;
};

type AlertRuleRecord = {
  _id: string;
  userId: string;
  name: string;
  symbols: string[];
  conditions: AlertCondition[];
  logic: 'AND' | 'OR';
  cooldownMinutes: number;
  isActive: boolean;
};

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const ALPHA_BASE = 'https://www.alphavantage.co/query';

const REALTIME_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const BATCH_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;
const PROVIDER_CONCURRENCY = 6;

const FACTOR_WEIGHTS = {
  momentum: 0.30,
  volume: 0.20,
  sentiment: 0.20,
  volatility: 0.15,
  agreement: 0.15,
};

export const DEFAULT_SIGNAL_UNIVERSE = POPULAR_STOCK_SYMBOLS.slice(0, 40);

let refreshInFlight: Promise<void> | null = null;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalize = (value: number, min: number, max: number) => {
  if (max <= min) return 50;
  const ratio = (value - min) / (max - min);
  return clamp(ratio * 100, 0, 100);
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;

  const cleaned = value.replace(/[%,$,]/g, '').trim();
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const buildSyntheticQuote = (symbol: string): QuotePayload & { sentiment: number } => {
  const dayKey = new Date().toISOString().slice(0, 10);
  const seed = hashString(`${symbol}-${dayKey}`);
  const basePrice = 20 + (seed % 260) + ((seed % 100) / 100);
  const changePercent = ((seed % 900) / 900) * 8 - 4;
  const previousClose = basePrice / (1 + changePercent / 100);
  const volume = 400_000 + (seed % 7_000_000);
  const sentiment = ((seed % 1000) / 1000) * 2 - 1;

  return {
    price: Number(basePrice.toFixed(2)),
    previousClose: Number(previousClose.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    volume,
    sentiment: Number(sentiment.toFixed(3)),
  };
};

const fetchJson = async <T>(url: string): Promise<T | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const fetchFinnhubQuote = async (symbol: string): Promise<QuotePayload | null> => {
  if (!FINNHUB_API_KEY) return null;
  const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
  const payload = await fetchJson<Record<string, unknown>>(url);
  if (!payload) return null;

  const price = toNumber(payload.c);
  const previousClose = toNumber(payload.pc);
  const changePercent = toNumber(payload.dp);

  if (price === null || previousClose === null || previousClose <= 0) return null;

  return {
    price,
    previousClose,
    changePercent: changePercent ?? ((price - previousClose) / previousClose) * 100,
  };
};

const fetchAlphaQuote = async (symbol: string): Promise<QuotePayload | null> => {
  if (!ALPHA_VANTAGE_API_KEY) return null;
  const url = `${ALPHA_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const payload = await fetchJson<Record<string, unknown>>(url);
  if (!payload) return null;

  const globalQuoteRaw = payload['Global Quote'];
  if (!globalQuoteRaw || typeof globalQuoteRaw !== 'object') return null;

  const quote = globalQuoteRaw as Record<string, unknown>;
  const price = toNumber(quote['05. price']);
  const previousClose = toNumber(quote['08. previous close']);
  const changePercent = toNumber(quote['10. change percent']);
  const volume = toNumber(quote['06. volume']);

  if (price === null || previousClose === null || previousClose <= 0) return null;

  return {
    price,
    previousClose,
    changePercent: changePercent ?? ((price - previousClose) / previousClose) * 100,
    volume: volume ?? undefined,
  };
};

const parseFinnhubSentiment = (payload: Record<string, unknown>): number | null => {
  const sentimentRaw = payload.sentiment;
  if (!sentimentRaw || typeof sentimentRaw !== 'object') return null;

  const sentiment = sentimentRaw as Record<string, unknown>;
  let bullish = toNumber(sentiment.bullishPercent);
  let bearish = toNumber(sentiment.bearishPercent);

  if (bullish === null || bearish === null) return null;

  if (bullish > 1 || bearish > 1) {
    bullish /= 100;
    bearish /= 100;
  }

  return clamp(bullish - bearish, -1, 1);
};

const fetchFinnhubSentiment = async (symbol: string): Promise<number | null> => {
  if (!FINNHUB_API_KEY) return null;
  const url = `${FINNHUB_BASE}/news-sentiment?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
  const payload = await fetchJson<Record<string, unknown>>(url);
  if (!payload) return null;

  return parseFinnhubSentiment(payload);
};

const fetchAlphaSentiment = async (symbol: string): Promise<number | null> => {
  if (!ALPHA_VANTAGE_API_KEY) return null;

  const url = `${ALPHA_BASE}?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(
    symbol
  )}&sort=LATEST&limit=20&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const payload = await fetchJson<Record<string, unknown>>(url);
  if (!payload) return null;

  const feedRaw = payload.feed;
  if (!Array.isArray(feedRaw) || feedRaw.length === 0) return null;

  const scores: number[] = [];
  for (const item of feedRaw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const score = toNumber(record.overall_sentiment_score);
    if (score !== null) scores.push(clamp(score, -1, 1));
  }

  if (!scores.length) return null;
  return scores.reduce((acc, value) => acc + value, 0) / scores.length;
};

const deriveSource = (meta: ProviderMeta): SignalSource => {
  if (meta.syntheticFallback) return 'synthetic';
  if (meta.finnhubQuote && meta.alphaQuote) return 'hybrid';
  if (meta.finnhubQuote) return 'finnhub';
  if (meta.alphaQuote) return 'alpha_vantage';
  return 'synthetic';
};

const buildProviderInput = async (symbol: string, mode: RefreshMode): Promise<ProviderSignalInput> => {
  const [finnhubQuote, alphaQuote, finnhubSentiment, alphaSentiment] = await Promise.all([
    fetchFinnhubQuote(symbol),
    fetchAlphaQuote(symbol),
    fetchFinnhubSentiment(symbol),
    mode === 'batch' ? fetchAlphaSentiment(symbol) : Promise.resolve(null),
  ]);

  const synthetic = buildSyntheticQuote(symbol);

  const providerMeta: ProviderMeta = {
    finnhubQuote: Boolean(finnhubQuote),
    alphaQuote: Boolean(alphaQuote),
    finnhubSentiment: finnhubSentiment !== null,
    alphaSentiment: alphaSentiment !== null,
    syntheticFallback: false,
  };

  const price = finnhubQuote?.price ?? alphaQuote?.price ?? synthetic.price;
  const previousClose = finnhubQuote?.previousClose ?? alphaQuote?.previousClose ?? synthetic.previousClose;

  let changePercent =
    finnhubQuote?.changePercent ?? alphaQuote?.changePercent ?? ((price - previousClose) / previousClose) * 100;

  if (!Number.isFinite(changePercent)) {
    changePercent = synthetic.changePercent ?? 0;
  }

  const volume = alphaQuote?.volume ?? synthetic.volume ?? 0;

  const sentimentCandidates = [finnhubSentiment, alphaSentiment].filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value)
  );

  const sentiment = sentimentCandidates.length
    ? sentimentCandidates.reduce((acc, value) => acc + value, 0) / sentimentCandidates.length
    : clamp(changePercent / 8, -1, 1) * 0.35;

  const quoteAgreement =
    finnhubQuote && alphaQuote
      ? Math.abs(finnhubQuote.price - alphaQuote.price) / Math.max((finnhubQuote.price + alphaQuote.price) / 2, 1)
      : null;

  const providerAgreement = quoteAgreement === null ? 0 : clamp(1 - quoteAgreement * 5, 0, 1);

  if (!finnhubQuote && !alphaQuote) {
    providerMeta.syntheticFallback = true;
  }

  return {
    symbol,
    price,
    previousClose,
    changePercent,
    volume,
    sentiment,
    providerAgreement,
    source: deriveSource(providerMeta),
    providerMeta,
  };
};

const computeDirection = (contribution: number): 'positive' | 'negative' | 'neutral' => {
  if (contribution > 2) return 'positive';
  if (contribution < -2) return 'negative';
  return 'neutral';
};

const buildNarrative = (factors: SignalFactorContribution[], score: number, delta: number) => {
  const strongest = [...factors].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))[0];
  const positive = factors.find((factor) => factor.contribution > 0);
  const negative = factors.find((factor) => factor.contribution < 0);

  const movement =
    Math.abs(delta) < 0.01
      ? 'flat vs last snapshot'
      : `${delta > 0 ? 'up' : 'down'} ${Math.abs(delta).toFixed(1)} pts vs last snapshot`;

  const headline = `Score ${score.toFixed(1)} (${movement}).`;

  if (!strongest) return headline;

  const details = [
    `Primary driver: ${strongest.label.toLowerCase()} (${strongest.contribution > 0 ? '+' : ''}${strongest.contribution.toFixed(1)}).`,
  ];

  if (positive && negative && positive.name !== negative.name) {
    details.push(
      `Positive pressure from ${positive.label.toLowerCase()} offsets weakness in ${negative.label.toLowerCase()}.`
    );
  }

  return `${headline} ${details.join(' ')}`;
};

const computeSignal = (
  input: ProviderSignalInput,
  previous: PreviousSignalProfile | undefined,
  mode: RefreshMode
): ComputedSignal => {
  const avgVolume =
    previous && previous.avgVolume > 0 ? previous.avgVolume * 0.8 + input.volume * 0.2 : Math.max(input.volume, 1);

  const baselineStd = previous && previous.volumeStd > 0 ? previous.volumeStd : Math.max(avgVolume * 0.2, 1);
  const volumeZScore = clamp((input.volume - avgVolume) / baselineStd, -4, 4);

  const deviation = input.volume - avgVolume;
  const volumeStd = previous
    ? Math.sqrt(Math.max(previous.volumeStd ** 2 * 0.8 + deviation ** 2 * 0.2, 1))
    : Math.max(input.volume * 0.15, 1);

  const volatility = previous
    ? previous.volatility * 0.7 + Math.abs(input.changePercent) * 0.3
    : Math.abs(input.changePercent);

  const momentumScore = normalize(input.changePercent, -6, 6);
  const volumeScore = normalize(volumeZScore, -2.5, 2.5);
  const sentimentScore = normalize(input.sentiment, -1, 1);
  const volatilityScore = clamp(100 - Math.abs(volatility - 2) * 22, 0, 100);

  const agreementScore = input.providerMeta.syntheticFallback
    ? 40
    : input.providerMeta.alphaQuote && input.providerMeta.finnhubQuote
      ? normalize(input.providerAgreement, 0, 1)
      : 58;

  const weightedScore =
    momentumScore * FACTOR_WEIGHTS.momentum +
    volumeScore * FACTOR_WEIGHTS.volume +
    sentimentScore * FACTOR_WEIGHTS.sentiment +
    volatilityScore * FACTOR_WEIGHTS.volatility +
    agreementScore * FACTOR_WEIGHTS.agreement;

  const score = clamp(weightedScore, 0, 100);
  const previousScore = previous?.score ?? score;
  const scoreDelta = score - previousScore;

  const factors: SignalFactorContribution[] = [
    {
      name: 'momentum',
      label: 'Momentum',
      score: momentumScore,
      weight: FACTOR_WEIGHTS.momentum,
      contribution: ((momentumScore - 50) / 50) * FACTOR_WEIGHTS.momentum * 100,
      direction: 'neutral',
    },
    {
      name: 'volume',
      label: 'Volume Anomaly',
      score: volumeScore,
      weight: FACTOR_WEIGHTS.volume,
      contribution: ((volumeScore - 50) / 50) * FACTOR_WEIGHTS.volume * 100,
      direction: 'neutral',
    },
    {
      name: 'sentiment',
      label: 'News Sentiment',
      score: sentimentScore,
      weight: FACTOR_WEIGHTS.sentiment,
      contribution: ((sentimentScore - 50) / 50) * FACTOR_WEIGHTS.sentiment * 100,
      direction: 'neutral',
    },
    {
      name: 'volatility',
      label: 'Volatility Regime',
      score: volatilityScore,
      weight: FACTOR_WEIGHTS.volatility,
      contribution: ((volatilityScore - 50) / 50) * FACTOR_WEIGHTS.volatility * 100,
      direction: 'neutral',
    },
    {
      name: 'agreement',
      label: 'Provider Agreement',
      score: agreementScore,
      weight: FACTOR_WEIGHTS.agreement,
      contribution: ((agreementScore - 50) / 50) * FACTOR_WEIGHTS.agreement * 100,
      direction: 'neutral',
    },
  ].map((factor) => ({ ...factor, direction: computeDirection(factor.contribution) }));

  const providerCoverage = [input.providerMeta.finnhubQuote, input.providerMeta.alphaQuote].filter(Boolean).length;
  const hasSentiment = input.providerMeta.finnhubSentiment || input.providerMeta.alphaSentiment;

  let confidence = 0.35 + providerCoverage * 0.2;
  if (hasSentiment) confidence += 0.15;
  if (previous) confidence += 0.1;
  if (mode === 'batch') confidence += 0.05;
  if (input.providerMeta.syntheticFallback) confidence -= 0.15;

  confidence = clamp(confidence, 0.15, 0.98);

  return {
    symbol: input.symbol,
    score,
    scoreDelta,
    confidence,
    price: input.price,
    changePercent: input.changePercent,
    volume: input.volume,
    sentiment: input.sentiment,
    volumeZScore,
    source: input.source,
    narrative: buildNarrative(factors, score, scoreDelta),
    factors,
    providerMeta: input.providerMeta,
    avgVolume,
    volumeStd,
    volatility,
  };
};

const evaluateCondition = (condition: AlertCondition, signal: ComputedSignal) => {
  const value = signal[condition.field];
  switch (condition.operator) {
    case '>':
      return value > condition.value;
    case '>=':
      return value >= condition.value;
    case '<':
      return value < condition.value;
    case '<=':
      return value <= condition.value;
    case '==':
      return Number(value.toFixed(6)) === Number(condition.value.toFixed(6));
    default:
      return false;
  }
};

const shouldTriggerRule = (rule: AlertRuleRecord, signal: ComputedSignal) => {
  if (!rule.isActive || !rule.conditions.length) return false;

  const matchesSymbol = !rule.symbols.length || rule.symbols.includes(signal.symbol);
  if (!matchesSymbol) return false;

  const results = rule.conditions.map((condition) => evaluateCondition(condition, signal));
  if (rule.logic === 'OR') return results.some(Boolean);
  return results.every(Boolean);
};

const evaluateAlertsForSignals = async (signals: ComputedSignal[]) => {
  if (!signals.length) return;

  const symbols = [...new Set(signals.map((signal) => signal.symbol))];
  const rawRules = await AlertRule.find({
    isActive: true,
    $or: [{ symbols: { $size: 0 } }, { symbols: { $in: symbols } }],
  }).lean();

  const rules: AlertRuleRecord[] = rawRules.map((rule) => ({
    _id: String(rule._id),
    userId: String(rule.userId),
    name: String(rule.name),
    symbols: Array.isArray(rule.symbols)
      ? rule.symbols.map((symbol: unknown) => String(symbol).toUpperCase())
      : [],
    conditions: Array.isArray(rule.conditions)
      ? rule.conditions
          .filter(
            (condition: unknown): condition is Record<string, unknown> =>
              Boolean(condition && typeof condition === 'object')
          )
          .map((condition: Record<string, unknown>) => ({
            field: condition.field as AlertCondition['field'],
            operator: condition.operator as AlertCondition['operator'],
            value: Number(condition.value),
          }))
      : [],
    logic: rule.logic === 'OR' ? 'OR' : 'AND',
    cooldownMinutes: Number(rule.cooldownMinutes) || 60,
    isActive: Boolean(rule.isActive),
  }));

  for (const signal of signals) {
    const candidateRules = rules.filter((rule) => shouldTriggerRule(rule, signal));

    for (const rule of candidateRules) {
      const cooldownStart = new Date(Date.now() - rule.cooldownMinutes * 60_000);
      const existingEvent = await AlertEvent.findOne({
        ruleId: rule._id,
        symbol: signal.symbol,
        triggeredAt: { $gte: cooldownStart },
      }).lean();

      if (existingEvent) {
        continue;
      }

      await AlertEvent.create({
        userId: rule.userId,
        ruleId: rule._id,
        symbol: signal.symbol,
        score: signal.score,
        scoreDelta: signal.scoreDelta,
        sentiment: signal.sentiment,
        volumeZScore: signal.volumeZScore,
        confidence: signal.confidence,
        changePercent: signal.changePercent,
        matchedConditions: rule.conditions,
        triggeredAt: new Date(),
      });

      await AlertRule.updateOne({ _id: rule._id }, { $set: { lastTriggeredAt: new Date() } });
    }
  }
};

const runWithConcurrency = async <T>(items: T[], limit: number, worker: (item: T) => Promise<void>) => {
  let index = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });

  await Promise.all(runners);
};

const toPreviousMap = (rows: unknown[]): Map<string, PreviousSignalProfile> => {
  const result = new Map<string, PreviousSignalProfile>();

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const record = row as Record<string, unknown>;
    const symbol = String(record.symbol ?? '').toUpperCase();
    if (!symbol) continue;

    result.set(symbol, {
      symbol,
      score: Number(record.score) || 0,
      avgVolume: Number(record.avgVolume) || 0,
      volumeStd: Number(record.volumeStd) || 0,
      volatility: Number(record.volatility) || 0,
    });
  }

  return result;
};

const persistSignals = async (signals: ComputedSignal[], mode: RefreshMode) => {
  const timestamp = new Date();

  for (const signal of signals) {
    await SignalProfile.findOneAndUpdate(
      { symbol: signal.symbol },
      {
        $set: {
          symbol: signal.symbol,
          score: signal.score,
          scoreDelta: signal.scoreDelta,
          confidence: signal.confidence,
          price: signal.price,
          changePercent: signal.changePercent,
          volume: signal.volume,
          sentiment: signal.sentiment,
          volumeZScore: signal.volumeZScore,
          source: signal.source,
          narrative: signal.narrative,
          factors: signal.factors,
          providerMeta: signal.providerMeta,
          avgVolume: signal.avgVolume,
          volumeStd: signal.volumeStd,
          volatility: signal.volatility,
          lastMode: mode,
          lastComputedAt: timestamp,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await SignalSnapshot.create({
      symbol: signal.symbol,
      score: signal.score,
      scoreDelta: signal.scoreDelta,
      confidence: signal.confidence,
      price: signal.price,
      changePercent: signal.changePercent,
      volume: signal.volume,
      sentiment: signal.sentiment,
      volumeZScore: signal.volumeZScore,
      source: signal.source,
      mode,
      narrative: signal.narrative,
      factors: signal.factors,
      providerMeta: signal.providerMeta,
      timestamp,
    });
  }
};

const needsRefresh = (lastComputedAt: Date | null, mode: RefreshMode) => {
  if (!lastComputedAt) return true;
  const ageMs = Date.now() - lastComputedAt.getTime();
  return ageMs >= (mode === 'batch' ? BATCH_REFRESH_INTERVAL_MS : REALTIME_REFRESH_INTERVAL_MS);
};

const refreshSignalsInternal = async (mode: RefreshMode, universe: string[]) => {
  const symbols = normalizeSymbols(universe);
  if (!symbols.length) return;

  await connectToDatabase();

  const previousRows = await SignalProfile.find({ symbol: { $in: symbols } }).lean();
  const previousMap = toPreviousMap(previousRows as unknown[]);

  const computedSignals: ComputedSignal[] = [];

  await runWithConcurrency(symbols, PROVIDER_CONCURRENCY, async (symbol) => {
    const input = await buildProviderInput(symbol, mode);
    const previous = previousMap.get(symbol);
    const computed = computeSignal(input, previous, mode);
    computedSignals.push(computed);
  });

  await persistSignals(computedSignals, mode);
  await evaluateAlertsForSignals(computedSignals);
};

export const normalizeSymbols = (symbols: string[]) => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const symbol of symbols) {
    const value = symbol.trim().toUpperCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
};

export const ensureFreshSignals = async (
  universe: string[] = DEFAULT_SIGNAL_UNIVERSE,
  mode: RefreshMode = 'intraday'
) => {
  const symbols = normalizeSymbols(universe);
  if (!symbols.length) return;

  await connectToDatabase();

  const latest = await SignalProfile.findOne({ symbol: { $in: symbols } })
    .sort({ lastComputedAt: -1 })
    .select('lastComputedAt')
    .lean();

  const lastComputedAt =
    latest && typeof latest === 'object' && 'lastComputedAt' in latest
      ? (latest.lastComputedAt as Date | null)
      : null;

  const existingCoverage = await SignalProfile.countDocuments({ symbol: { $in: symbols } });
  const needsBackfill = existingCoverage < symbols.length;

  if (!needsBackfill && !needsRefresh(lastComputedAt, mode)) return;

  if (!refreshInFlight) {
    refreshInFlight = refreshSignalsInternal(mode, symbols)
      .catch((error) => {
        console.error('[signal-engine] refresh failed:', error);
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  await refreshInFlight;
};

const toView = (row: Record<string, unknown>): SignalProfileView => {
  const updatedAt = row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date().toISOString();
  const factorsRaw = Array.isArray(row.factors) ? row.factors : [];

  const factors: SignalFactorContribution[] = factorsRaw
    .filter((factor): factor is Record<string, unknown> => Boolean(factor && typeof factor === 'object'))
    .map((factor) => ({
      name: String(factor.name ?? ''),
      label: String(factor.label ?? ''),
      score: Number(factor.score) || 0,
      weight: Number(factor.weight) || 0,
      contribution: Number(factor.contribution) || 0,
      direction:
        factor.direction === 'positive' || factor.direction === 'negative' || factor.direction === 'neutral'
          ? factor.direction
          : 'neutral',
    }));

  const sourceRaw = String(row.source ?? 'synthetic');
  const source: SignalSource =
    sourceRaw === 'hybrid' || sourceRaw === 'finnhub' || sourceRaw === 'alpha_vantage' || sourceRaw === 'synthetic'
      ? sourceRaw
      : 'synthetic';

  return {
    symbol: String(row.symbol ?? ''),
    score: Number(row.score) || 0,
    scoreDelta: Number(row.scoreDelta) || 0,
    confidence: Number(row.confidence) || 0,
    price: Number(row.price) || 0,
    changePercent: Number(row.changePercent) || 0,
    volume: Number(row.volume) || 0,
    sentiment: Number(row.sentiment) || 0,
    volumeZScore: Number(row.volumeZScore) || 0,
    source,
    narrative: String(row.narrative ?? ''),
    factors,
    updatedAt,
    lastMode: row.lastMode === 'batch' ? 'batch' : 'intraday',
  };
};

export const listSignals = async (
  universe: string[] = DEFAULT_SIGNAL_UNIVERSE,
  limit = 20
): Promise<SignalProfileView[]> => {
  const symbols = normalizeSymbols(universe);
  if (!symbols.length) return [];

  await connectToDatabase();

  const rows = await SignalProfile.find({ symbol: { $in: symbols } })
    .sort({ score: -1 })
    .limit(limit)
    .lean();

  return (rows as Record<string, unknown>[]).map(toView);
};

export const getSignalDetail = async (symbol: string): Promise<SignalDetailView | null> => {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) return null;

  await connectToDatabase();

  const profileRaw = await SignalProfile.findOne({ symbol: normalized }).lean();
  if (!profileRaw || typeof profileRaw !== 'object') return null;

  const historyRows = await SignalSnapshot.find({ symbol: normalized })
    .sort({ timestamp: -1 })
    .limit(24)
    .select('timestamp score scoreDelta changePercent sentiment')
    .lean();

  const history = (historyRows as Record<string, unknown>[])
    .map((row) => ({
      timestamp:
        row.timestamp instanceof Date ? row.timestamp.toISOString() : row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date().toISOString(),
      score: Number(row.score) || 0,
      scoreDelta: Number(row.scoreDelta) || 0,
      changePercent: Number(row.changePercent) || 0,
      sentiment: Number(row.sentiment) || 0,
    }))
    .reverse();

  return {
    profile: toView(profileRaw as Record<string, unknown>),
    history,
  };
};

export const triggerSignalRefresh = async (
  mode: RefreshMode = 'batch',
  universe: string[] = DEFAULT_SIGNAL_UNIVERSE
) => {
  await refreshSignalsInternal(mode, normalizeSymbols(universe));
};
