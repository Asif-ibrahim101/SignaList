import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';
import {
  DEFAULT_SIGNAL_UNIVERSE,
  normalizeSymbols,
  triggerSignalRefresh,
  type RefreshMode,
} from '@/lib/signal-engine';

const resolveMode = (raw: unknown): RefreshMode => (raw === 'intraday' ? 'intraday' : 'batch');

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    const user = await getUserFromSession(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    let body: { symbols?: string[]; mode?: RefreshMode } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const mode = resolveMode(body.mode);
    const symbols =
      Array.isArray(body.symbols) && body.symbols.length
        ? normalizeSymbols(body.symbols)
        : DEFAULT_SIGNAL_UNIVERSE;

    await triggerSignalRefresh(mode, symbols);

    return NextResponse.json({
      success: true,
      mode,
      symbolCount: symbols.length,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[api/signals/recompute] POST failed:', error);
    return NextResponse.json(
      { error: 'Unable to recompute signals right now.' },
      { status: 500 }
    );
  }
}
