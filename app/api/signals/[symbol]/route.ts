import { NextRequest, NextResponse } from 'next/server';
import { ensureFreshSignals, getSignalDetail } from '@/lib/signal-engine';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await context.params;
    const normalized = symbol.trim().toUpperCase();

    if (!normalized) {
      return NextResponse.json({ error: 'Symbol is required.' }, { status: 400 });
    }

    await ensureFreshSignals([normalized], 'intraday');

    const detail = await getSignalDetail(normalized);
    if (!detail) {
      return NextResponse.json({ error: `Signal for ${normalized} was not found.` }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error('[api/signals/:symbol] GET failed:', error);
    return NextResponse.json(
      { error: 'Unable to load signal detail right now.' },
      { status: 500 }
    );
  }
}
