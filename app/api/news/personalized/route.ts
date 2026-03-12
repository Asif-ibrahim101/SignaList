import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/Database/Mongoose';
import { getUserFromSession } from '@/lib/session';
import { refreshNewsFeed, getPersonalizedNews } from '@/lib/news-engine';
import AlertRule from '@/models/AlertRule';

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

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    const user = await getUserFromSession(token);
    if (!user || !('_id' in user)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await connectToDatabase();

    const params = request.nextUrl.searchParams;
    const page = parsePageParam(params.get('page'));
    const limit = parseLimitParam(params.get('limit'));

    const preferredIndustry = String((user as Record<string, unknown>).preferredIndustry ?? '');

    const userRules = await AlertRule.find({ userId: (user as Record<string, unknown>)._id })
      .select('symbols')
      .lean();

    const trackedSymbols = [
      ...new Set(
        (userRules as Record<string, unknown>[]).flatMap((rule) =>
          Array.isArray(rule.symbols) ? rule.symbols.map((s: unknown) => String(s).toUpperCase()) : []
        )
      ),
    ];

    await refreshNewsFeed(trackedSymbols.length ? trackedSymbols : undefined);

    const result = await getPersonalizedNews(
      String((user as Record<string, unknown>)._id),
      preferredIndustry,
      trackedSymbols,
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/news/personalized] GET failed:', error);
    return NextResponse.json(
      { error: 'Unable to load personalized news.' },
      { status: 500 }
    );
  }
}
