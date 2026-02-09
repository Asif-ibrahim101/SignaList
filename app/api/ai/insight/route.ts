import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OllamaEmbeddings } from '@langchain/ollama';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5; // Increased slightly for RAG
const MIN_INTERVAL_MS = 2_000; // Reduced for local testing
const CACHE_TTL_MS = 15 * 60_000;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const lastRequestStore = new Map<string, number>();
const cacheStore = new Map<string, { text: string; ragSources: number; expiresAt: number }>();

// Supabase Setup — use service role key to bypass RLS on the documents table
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const getClientIp = (request: NextRequest) => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
};

const getRateLimitRetryAfter = (ip: string) => {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return Math.ceil((entry.resetAt - now) / 1000);
  }
  entry.count += 1;
  return null;
};

const retrieveContext = async (query: string): Promise<{ context: string; sourceCount: number }> => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[RAG] Supabase credentials missing, skipping RAG.');
    return { context: '', sourceCount: 0 };
  }
  try {
    console.log(`[RAG] Query: "${query}"`);

    const embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text",
      baseUrl: "http://127.0.0.1:11434",
    });

    const queryEmbedding = await embeddings.embedQuery(query);

    const { data: results, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1,
      match_count: 3,
      filter: {},
    });

    if (error) {
      console.error('[RAG] RPC Error:', error.message);
      return { context: '', sourceCount: 0 };
    }

    const docs = results ?? [];
    console.log(`[RAG] Found ${docs.length} source(s)`);
    if (docs.length > 0) {
      console.log(`[RAG] First result preview: ${docs[0].content?.slice(0, 80)}...`);
    }

    const context = docs.map((doc: { content: string }) => doc.content).join('\n\n');
    return { context, sourceCount: docs.length };
  } catch (error) {
    console.error('[RAG] Retrieval Error:', error instanceof Error ? error.message : error);
    return { context: '', sourceCount: 0 };
  }
};

type SectionKey = 'overview' | 'risks' | 'valuation' | 'trend' | 'catalysts' | 'summary';

const SECTION_REGISTRY: Record<SectionKey, { heading: string; keywords: string[] }> = {
  overview:   { heading: '## Overview',   keywords: ['overview', 'about', 'what is', 'tell me about', 'explain', 'introduction'] },
  risks:      { heading: '## Risks',      keywords: ['risk', 'danger', 'downside', 'threat', 'concern', 'worry'] },
  valuation:  { heading: '## Valuation',  keywords: ['valuation', 'value', 'price', 'worth', 'pe ratio', 'p/e', 'earnings', 'overvalued', 'undervalued'] },
  trend:      { heading: '## Trend',      keywords: ['trend', 'momentum', 'direction', 'chart', 'technical', 'bullish', 'bearish', 'performance'] },
  catalysts:  { heading: '## Catalysts',  keywords: ['catalyst', 'upcoming', 'event', 'earnings report', 'news', 'driver', 'growth driver'] },
  summary:    { heading: '## Summary',    keywords: ['summary', 'summarize', 'tldr', 'conclude'] },
};

const ALL_SECTION_KEYS: SectionKey[] = ['overview', 'risks', 'valuation', 'trend', 'catalysts', 'summary'];

const detectTopics = (question: string): SectionKey[] => {
  const q = question.toLowerCase();

  const matched: SectionKey[] = [];
  for (const [key, def] of Object.entries(SECTION_REGISTRY) as [SectionKey, { heading: string; keywords: string[] }][]) {
    if (def.keywords.some(kw => q.includes(kw))) {
      matched.push(key);
    }
  }

  // No matches or only "overview" matched → full analysis
  if (matched.length === 0 || (matched.length === 1 && matched[0] === 'overview')) {
    return ALL_SECTION_KEYS;
  }

  return matched;
};

const buildPrompt = (symbol: string, question?: string, context?: string) => {
  const userQuestion = question?.trim();

  const sections = userQuestion ? detectTopics(userQuestion) : ALL_SECTION_KEYS;
  const isFullAnalysis = sections.length === ALL_SECTION_KEYS.length;

  let contextBlock = '';
  if (context) {
    contextBlock = `
REAL-TIME CONTEXT FROM NEWS (Use this to answer):
"""
${context}
"""
`;
  }

  const sectionHeadings = sections.map(key => SECTION_REGISTRY[key].heading);

  const sectionInstruction = isFullAnalysis
    ? `Return a clean, well-formatted response using Markdown with these sections:`
    : `Return a clean, well-formatted response using Markdown with ONLY these sections (do not include any other sections):`;

  return [
    `You are a finance education assistant.`,
    contextBlock,
    `Provide educational insight based on the context above if relevant.`,
    `Do NOT give buy/sell/hold recommendations.`,
    `Do NOT invent specific financial metrics.`,
    sectionInstruction,
    ...sectionHeadings,
    `Each section should be 2-4 bullet points.`,
    `End with a separate line: "Educational only, not financial advice."`,
    ``,
    `Stock symbol: ${symbol}.`,
    userQuestion ? `User question: ${userQuestion}` : `User question: Give an educational overview with risks, valuation, trend, and catalysts.`,
  ].join('\n');
};

export async function POST(request: NextRequest) {
  // No API key check needed for local Ollama

  const ip = getClientIp(request);
  const now = Date.now();
  const lastRequestAt = lastRequestStore.get(ip);
  if (lastRequestAt && now - lastRequestAt < MIN_INTERVAL_MS) {
    const retryAfterSeconds = Math.ceil((MIN_INTERVAL_MS - (now - lastRequestAt)) / 1000);
    return NextResponse.json(
      { error: `Please wait ${retryAfterSeconds}s before trying again.`, retryAfterSeconds },
      { status: 429 }
    );
  }

  const rateLimitRetryAfter = getRateLimitRetryAfter(ip);
  if (rateLimitRetryAfter !== null) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again shortly.', retryAfterSeconds: rateLimitRetryAfter },
      { status: 429 }
    );
  }
  lastRequestStore.set(ip, now);

  let body: { symbol?: string; question?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const symbol = (body.symbol ?? '').toString().trim().toUpperCase();
  if (!symbol || !/^[A-Z0-9.-]{1,10}$/.test(symbol)) {
    return NextResponse.json({ error: 'Please provide a valid stock symbol.' }, { status: 400 });
  }

  const cacheKey = `${symbol}::${body.question ?? ''}`;
  const cached = cacheStore.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ text: cached.text, ragSources: cached.ragSources, cached: true });
  }

  // RAG Step: Retrieve context
  const { context, sourceCount: ragSources } = await retrieveContext(`${symbol} ${body.question || 'news overview'}`);

  const prompt = buildPrompt(symbol, body.question, context);

  try {
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3', // Adjust if you pulled a specific tag like 'llama3:latest'
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.response?.trim();

    if (!text) {
      return NextResponse.json({ error: 'No response from local Llama 3.' }, { status: 500 });
    }

    cacheStore.set(cacheKey, { text, ragSources, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ text, ragSources, cached: false });

  } catch (error) {
    console.error('AI Service Error:', error);
    return NextResponse.json(
      {
        error: 'Unable to connect to local AI service. Is Ollama running?',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
