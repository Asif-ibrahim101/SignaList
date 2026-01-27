import { NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;
const MIN_INTERVAL_MS = 12_000;
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
    `Answer in short sections with headings: Overview, Risks, Valuation, Trend, Catalysts, and Summary.`,
    `Include a short disclaimer: "Educational only, not financial advice."`,
    ``,
    `Stock symbol: ${symbol}.`,
    userQuestion ? `User question: ${userQuestion}` : `User question: Give an educational overview with risks, valuation, trend, and catalysts.`,
  ].join('\n');
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing GEMINI_API_KEY on the server.' }, { status: 500 });
  }

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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let details = errorText;
    let errorMessage = 'Gemini API error.';
    let retryAfterSeconds: number | undefined;

    const retryAfterHeader = response.headers.get('retry-after');
    if (retryAfterHeader) {
      const parsed = Number(retryAfterHeader);
      if (!Number.isNaN(parsed)) retryAfterSeconds = parsed;
    }

    try {
      const parsed = JSON.parse(errorText);
      const apiError = parsed?.error;
      if (apiError?.message) {
        details = apiError.message;
      }
      if (apiError?.status === 'RESOURCE_EXHAUSTED' || response.status === 429) {
        errorMessage = 'Gemini rate limit reached. Please try again later.';
      }
    } catch {
      // Keep raw text details
    }

    return NextResponse.json(
      { error: errorMessage, details, retryAfterSeconds },
      { status: response.status }
    );
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim() ?? '';

  if (!text) {
    return NextResponse.json({ error: 'No response from Gemini.' }, { status: 500 });
  }

  cacheStore.set(cacheKey, { text, expiresAt: Date.now() + CACHE_TTL_MS });
  return NextResponse.json({ text, cached: false });
}
