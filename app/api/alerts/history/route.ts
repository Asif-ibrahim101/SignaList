import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/Database/Mongoose';
import { getUserFromSession } from '@/lib/session';
import AlertEvent from '@/models/AlertEvent';

const getAuthenticatedUserId = async (request: NextRequest) => {
  const token = request.cookies.get('session')?.value;
  const user = await getUserFromSession(token);
  if (!user || !('_id' in user)) return null;
  return String(user._id);
};

const parseLimit = (raw: string | null) => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
};

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const limit = parseLimit(request.nextUrl.searchParams.get('limit'));

    await connectToDatabase();

    const events = await AlertEvent.find({ userId })
      .sort({ triggeredAt: -1 })
      .limit(limit)
      .populate('ruleId', 'name')
      .lean();

    const history = (events as Record<string, unknown>[]).map((event) => {
      const ruleRecord =
        event.ruleId && typeof event.ruleId === 'object'
          ? (event.ruleId as Record<string, unknown>)
          : null;

      return {
        id: String(event._id ?? ''),
        ruleId: ruleRecord && ruleRecord._id ? String(ruleRecord._id) : String(event.ruleId ?? ''),
        ruleName: ruleRecord && ruleRecord.name ? String(ruleRecord.name) : 'Unnamed Rule',
        symbol: String(event.symbol ?? ''),
        score: Number(event.score) || 0,
        scoreDelta: Number(event.scoreDelta) || 0,
        sentiment: Number(event.sentiment) || 0,
        volumeZScore: Number(event.volumeZScore) || 0,
        confidence: Number(event.confidence) || 0,
        changePercent: Number(event.changePercent) || 0,
        triggeredAt:
          event.triggeredAt instanceof Date
            ? event.triggeredAt.toISOString()
            : event.createdAt instanceof Date
              ? event.createdAt.toISOString()
              : new Date().toISOString(),
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('[api/alerts/history] GET failed:', error);
    return NextResponse.json(
      { error: 'Unable to load alert history right now.' },
      { status: 500 }
    );
  }
}
