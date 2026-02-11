import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_SIGNAL_UNIVERSE,
  ensureFreshSignals,
  listSignals,
  normalizeSymbols,
  triggerSignalRefresh,
  type RefreshMode,
} from '@/lib/signal-engine';

const parseLimit = (rawLimit: string | null) => {
  const parsed = Number(rawLimit);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
};

const parseMode = (rawMode: string | null): RefreshMode => (rawMode === 'batch' ? 'batch' : 'intraday');

const parseUniverse = (rawSymbols: string | null) => {
  if (!rawSymbols) return DEFAULT_SIGNAL_UNIVERSE;
  const symbols = rawSymbols
    .split(',')
    .map((symbol) => symbol.trim())
    .filter(Boolean);

  const normalized = normalizeSymbols(symbols);
  return normalized.length ? normalized : DEFAULT_SIGNAL_UNIVERSE;
};

export async function GET(request: NextRequest) {
  try {
    const limit = parseLimit(request.nextUrl.searchParams.get('limit'));
    const mode = parseMode(request.nextUrl.searchParams.get('mode'));
    const universe = parseUniverse(request.nextUrl.searchParams.get('symbols'));
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === '1';

    if (forceRefresh) {
      await triggerSignalRefresh(mode, universe);
    } else {
      await ensureFreshSignals(universe, mode);
    }

    const items = await listSignals(universe, limit);

    const syntheticCount = items.filter((item) => item.source === 'synthetic').length;
    const liveCount = items.length - syntheticCount;
    const fallbackRatio = items.length ? syntheticCount / items.length : 0;
    const dataStatus: 'live' | 'partial_fallback' | 'fallback' =
      fallbackRatio === 0 ? 'live' : fallbackRatio <= 0.3 ? 'partial_fallback' : 'fallback';

    return NextResponse.json({
      items,
      universeSize: universe.length,
      fallbackUsed: syntheticCount > 0,
      syntheticCount,
      liveCount,
      fallbackRatio,
      dataStatus,
      refreshedAt: new Date().toISOString(),
      mode,
    });
  } catch (error) {
    console.error('[api/signals] GET failed:', error);
    return NextResponse.json(
      { error: 'Unable to load signals at the moment.' },
      { status: 500 }
    );
  }
}
