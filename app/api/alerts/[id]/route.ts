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
  lastTriggeredAt: rule.lastTriggeredAt instanceof Date ? rule.lastTriggeredAt.toISOString() : null,
  createdAt: rule.createdAt instanceof Date ? rule.createdAt.toISOString() : null,
  updatedAt: rule.updatedAt instanceof Date ? rule.updatedAt.toISOString() : null,
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await context.params;

    let body: {
      name?: string;
      symbols?: string[];
      conditions?: unknown[];
      logic?: 'AND' | 'OR';
      cooldownMinutes?: number;
      isActive?: boolean;
    } = {};

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
      updates.name = name;
    }

    if (Array.isArray(body.symbols)) {
      updates.symbols = normalizeSymbols(body.symbols).slice(0, 40);
    }

    if (Array.isArray(body.conditions)) {
      const normalizedConditions = body.conditions
        .map((condition) => normalizeCondition(condition))
        .filter((condition): condition is NonNullable<typeof condition> => condition !== null);

      if (!normalizedConditions.length) {
        return NextResponse.json(
          { error: 'At least one valid condition is required.' },
          { status: 400 }
        );
      }

      updates.conditions = normalizedConditions;
    }

    if (body.logic === 'AND' || body.logic === 'OR') {
      updates.logic = body.logic;
    }

    if (typeof body.cooldownMinutes === 'number' && Number.isFinite(body.cooldownMinutes)) {
      updates.cooldownMinutes = Math.min(Math.max(Math.trunc(body.cooldownMinutes), 1), 1440);
    }

    if (typeof body.isActive === 'boolean') {
      updates.isActive = body.isActive;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No valid updates provided.' }, { status: 400 });
    }

    await connectToDatabase();

    const updated = await AlertRule.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true }
    ).lean();

    if (!updated || typeof updated !== 'object') {
      return NextResponse.json({ error: 'Alert rule not found.' }, { status: 404 });
    }

    return NextResponse.json({ rule: mapRule(updated as Record<string, unknown>) });
  } catch (error) {
    console.error('[api/alerts/:id] PATCH failed:', error);
    return NextResponse.json(
      { error: 'Unable to update alert rule right now.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await context.params;

    await connectToDatabase();

    const deleted = await AlertRule.findOneAndDelete({ _id: id, userId }).lean();
    if (!deleted) {
      return NextResponse.json({ error: 'Alert rule not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[api/alerts/:id] DELETE failed:', error);
    return NextResponse.json(
      { error: 'Unable to delete alert rule right now.' },
      { status: 500 }
    );
  }
}
