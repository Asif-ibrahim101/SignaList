import { NextRequest, NextResponse } from 'next/server';
import { refreshNewsFeed, queryNews, type NewsFilterParams } from '@/lib/news-engine';

const parsePageParam = (raw: string | null): number => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.trunc(parsed);
};

const parseLimitParam = (raw: string | null): number => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(Math.trunc(parsed), 1), 50);
};

const parseSentimentParam = (raw: string | null): 'bullish' | 'bearish' | 'neutral' | undefined => {
  if (raw === 'bullish' || raw === 'bearish' || raw === 'neutral') return raw;
  return undefined;
};

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const filters: NewsFilterParams = {
      symbol: params.get('symbol')?.trim().toUpperCase() || undefined,
      sentiment: parseSentimentParam(params.get('sentiment')),
      category: params.get('category')?.trim() || undefined,
      page: parsePageParam(params.get('page')),
      limit: parseLimitParam(params.get('limit')),
    };

    await refreshNewsFeed(filters.symbol ? [filters.symbol] : undefined);

    const result = await queryNews(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/news] GET failed:', error);
    return NextResponse.json(
      { error: 'Unable to load news at the moment.' },
      { status: 500 }
    );
  }
}
