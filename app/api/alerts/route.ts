import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/Database/Mongoose';
import { normalizeCondition, normalizeSymbols } from '@/lib/alerts';
import { getUserFromSession } from '@/lib/session';
import AlertRule from '@/models/AlertRule';

const getAuthenticatedUserId = async (request: NextRequest) => {
  const token = request.cookies.get('session')?.value;
  const user = await getUserFromSession(token);
  if (!user || !('_id' in user)) return null;
  return String(user._id);
};

const mapRule = (rule: Record<string, unknown>) => ({
  id: String(rule._id ?? ''),
  name: String(rule.name ?? ''),
  symbols: Array.isArray(rule.symbols) ? rule.symbols.map((symbol) => String(symbol)) : [],
  conditions: Array.isArray(rule.conditions)
    ? rule.conditions
        .filter((condition): condition is Record<string, unknown> => Boolean(condition && typeof condition === 'object'))
        .map((condition) => ({
          field: String(condition.field ?? ''),
          operator: String(condition.operator ?? ''),
          value: Number(condition.value) || 0,
        }))
    : [],
  logic: rule.logic === 'OR' ? 'OR' : 'AND',
  cooldownMinutes: Number(rule.cooldownMinutes) || 60,
  channel: String(rule.channel ?? 'in_app'),
  isActive: Boolean(rule.isActive),
  lastTriggeredAt:
    rule.lastTriggeredAt instanceof Date ? rule.lastTriggeredAt.toISOString() : null,
  createdAt: rule.createdAt instanceof Date ? rule.createdAt.toISOString() : null,
  updatedAt: rule.updatedAt instanceof Date ? rule.updatedAt.toISOString() : null,
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await connectToDatabase();

    const rules = await AlertRule.find({ userId }).sort({ updatedAt: -1 }).lean();

    return NextResponse.json({
      rules: (rules as Record<string, unknown>[]).map(mapRule),
    });
  } catch (error) {
    console.error('[api/alerts] GET failed:', error);
    return NextResponse.json(
      { error: 'Unable to load alert rules right now.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    let body: {
      name?: string;
      symbols?: string[];
      conditions?: unknown[];
      logic?: 'AND' | 'OR';
      cooldownMinutes?: number;
      channel?: 'in_app';
    } = {};

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const name = String(body.name ?? '').trim();
    const symbols = normalizeSymbols(body.symbols ?? []).slice(0, 40);
    const logic = body.logic === 'OR' ? 'OR' : 'AND';
    const cooldownMinutes = Number(body.cooldownMinutes);
    const conditions = Array.isArray(body.conditions)
      ? body.conditions
          .map((condition) => normalizeCondition(condition))
          .filter((condition): condition is NonNullable<typeof condition> => condition !== null)
      : [];

    if (!name) {
      return NextResponse.json({ error: 'Rule name is required.' }, { status: 400 });
    }

    if (!conditions.length) {
      return NextResponse.json(
        { error: 'At least one valid condition is required.' },
        { status: 400 }
      );
    }

    const safeCooldown = Number.isFinite(cooldownMinutes)
      ? Math.min(Math.max(Math.trunc(cooldownMinutes), 1), 1440)
      : 60;

    await connectToDatabase();

    const created = await AlertRule.create({
      userId,
      name,
      symbols,
      conditions,
      logic,
      cooldownMinutes: safeCooldown,
      channel: body.channel === 'in_app' ? 'in_app' : 'in_app',
      isActive: true,
    });

    const createdLean = await AlertRule.findById(created._id).lean();

    if (!createdLean || typeof createdLean !== 'object') {
      return NextResponse.json({ error: 'Failed to create alert rule.' }, { status: 500 });
    }

    return NextResponse.json({ rule: mapRule(createdLean as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    console.error('[api/alerts] POST failed:', error);
    return NextResponse.json(
      { error: 'Unable to create alert rule right now.' },
      { status: 500 }
    );
  }
}
