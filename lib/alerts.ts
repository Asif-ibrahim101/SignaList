export const ALERT_FIELDS = [
  'score',
  'scoreDelta',
  'sentiment',
  'volumeZScore',
  'confidence',
  'changePercent',
] as const;

export const ALERT_OPERATORS = ['>', '>=', '<', '<=', '=='] as const;

export type AlertMetricField = (typeof ALERT_FIELDS)[number];
export type AlertMetricOperator = (typeof ALERT_OPERATORS)[number];

export type CompositeAlertCondition = {
  field: AlertMetricField;
  operator: AlertMetricOperator;
  value: number;
};

export const isValidAlertField = (field: string): field is AlertMetricField =>
  ALERT_FIELDS.includes(field as AlertMetricField);

export const isValidAlertOperator = (operator: string): operator is AlertMetricOperator =>
  ALERT_OPERATORS.includes(operator as AlertMetricOperator);

export const normalizeCondition = (raw: unknown): CompositeAlertCondition | null => {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  const field = String(record.field ?? '');
  const operator = String(record.operator ?? '');
  const value = Number(record.value);

  if (!isValidAlertField(field) || !isValidAlertOperator(operator)) return null;
  if (!Number.isFinite(value)) return null;

  return {
    field,
    operator,
    value,
  };
};

export const normalizeSymbols = (rawSymbols: unknown): string[] => {
  if (!Array.isArray(rawSymbols)) return [];

  const seen = new Set<string>();
  const symbols: string[] = [];

  for (const item of rawSymbols) {
    const symbol = String(item ?? '').trim().toUpperCase();
    if (!symbol || seen.has(symbol)) continue;
    seen.add(symbol);
    symbols.push(symbol);
  }

  return symbols;
};
