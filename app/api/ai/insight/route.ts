import { NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;
const MIN_INTERVAL_MS = 5_000; // Reduced for local testing
const CACHE_TTL_MS = 15 * 60_000;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const lastRequestStore = new Map<string, number>();
const cacheStore = new Map<string, { text: string; expiresAt: number }>();

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

const buildPrompt = (symbol: string, question?: string) => {
  const userQuestion = question?.trim();
  return [
    `You are a finance education assistant. Provide educational insight only.`,
    `Do NOT give buy/sell/hold recommendations or predict prices.`,
    `Do NOT invent specific financial metrics. If data is unknown, say "Data not available in this demo."`,
    `Return a clean, well-formatted response using Markdown with these sections:`,
    `## Overview`,
    `## Risks`,
    `## Valuation`,
    `## Trend`,
    `## Catalysts`,
    `## Summary`,
    `Each section should be 2-4 bullet points, short and clear.`,
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
    return NextResponse.json({ text: cached.text, cached: true });
  }

  const prompt = buildPrompt(symbol, body.question);

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

    cacheStore.set(cacheKey, { text, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ text, cached: false });

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
