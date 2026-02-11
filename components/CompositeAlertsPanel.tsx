'use client'

import { useCallback, useEffect, useMemo, useState } from 'react';

type AlertMetricField = 'score' | 'scoreDelta' | 'sentiment' | 'volumeZScore' | 'confidence' | 'changePercent';
type AlertMetricOperator = '>' | '>=' | '<' | '<=' | '==';

type CompositeAlertCondition = {
  field: AlertMetricField;
  operator: AlertMetricOperator;
  value: number;
};

type AlertRule = {
  id: string;
  name: string;
  symbols: string[];
  conditions: CompositeAlertCondition[];
  logic: 'AND' | 'OR';
  cooldownMinutes: number;
  channel: 'in_app';
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AlertHistoryEvent = {
  id: string;
  ruleId: string;
  ruleName: string;
  symbol: string;
  score: number;
  scoreDelta: number;
  sentiment: number;
  volumeZScore: number;
  confidence: number;
  changePercent: number;
  triggeredAt: string;
};

type Tab = 'create' | 'rules' | 'history';

const fieldOptions: Array<{ value: AlertMetricField; label: string; hint: string }> = [
  { value: 'score', label: 'Signal strength', hint: '0-100 model score' },
  { value: 'scoreDelta', label: 'Score change', hint: 'How much score moved since last snapshot' },
  { value: 'sentiment', label: 'News sentiment', hint: '-1 to +1 (negative to positive)' },
  { value: 'volumeZScore', label: 'Volume spike', hint: 'Higher means unusual volume' },
  { value: 'confidence', label: 'Data confidence', hint: '0 to 1 reliability estimate' },
  { value: 'changePercent', label: 'Daily % change', hint: 'Current day move in percent' },
];

const operatorLabels: Record<AlertMetricOperator, string> = {
  '>': 'is above',
  '>=': 'is at least',
  '<': 'is below',
  '<=': 'is at most',
  '==': 'equals',
};

const operatorOptions: AlertMetricOperator[] = ['>', '>=', '<', '<=', '=='];

const emptyCondition = (): CompositeAlertCondition => ({
  field: 'score',
  operator: '>=',
  value: 75,
});

const conditionToText = (condition: CompositeAlertCondition) => {
  const field = fieldOptions.find((option) => option.value === condition.field);
  return `${field?.label ?? condition.field} ${operatorLabels[condition.operator]} ${condition.value}`;
};

const templates = [
  {
    id: 'momentum-breakout',
    label: 'Momentum Breakout',
    description: 'Score >= 70 and positive news sentiment',
    name: 'Momentum + News Breakout',
    logic: 'AND' as const,
    cooldownMinutes: 120,
    conditions: [
      { field: 'score', operator: '>=', value: 70 },
      { field: 'sentiment', operator: '>=', value: 0.2 },
    ] satisfies CompositeAlertCondition[],
  },
  {
    id: 'high-conviction',
    label: 'High Conviction',
    description: 'Score >= 80 with reliable data confidence',
    name: 'High Conviction Setup',
    logic: 'AND' as const,
    cooldownMinutes: 180,
    conditions: [
      { field: 'score', operator: '>=', value: 80 },
      { field: 'confidence', operator: '>=', value: 0.75 },
    ] satisfies CompositeAlertCondition[],
  },
  {
    id: 'reversal-watch',
    label: 'Reversal Watch',
    description: 'Weak score but improving sentiment and rising delta',
    name: 'Possible Reversal Watch',
    logic: 'AND' as const,
    cooldownMinutes: 90,
    conditions: [
      { field: 'score', operator: '<=', value: 45 },
      { field: 'sentiment', operator: '>=', value: 0.15 },
      { field: 'scoreDelta', operator: '>=', value: 1 },
    ] satisfies CompositeAlertCondition[],
  },
];

const formatRelativeTime = (isoDate: string) => {
  const timestamp = new Date(isoDate).getTime();
  if (!Number.isFinite(timestamp)) return 'Unknown';

  const diffMs = Date.now() - timestamp;
  const diffSeconds = Math.max(Math.floor(diffMs / 1000), 0);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const CompositeAlertsPanel = () => {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertHistoryEvent[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('Momentum + News Breakout');
  const [symbolsInput, setSymbolsInput] = useState('AAPL,NVDA,MSFT');
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [cooldownMinutes, setCooldownMinutes] = useState(120);
  const [conditions, setConditions] = useState<CompositeAlertCondition[]>([
    { field: 'score', operator: '>=', value: 70 },
    { field: 'sentiment', operator: '>=', value: 0.2 },
  ]);

  const refreshRules = useCallback(async () => {
    setIsLoadingRules(true);
    try {
      const response = await fetch('/api/alerts', { cache: 'no-store' });
      const payload = (await response.json()) as { rules?: AlertRule[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load alert rules.');
      }

      setRules(Array.isArray(payload.rules) ? payload.rules : []);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load alert rules.');
    } finally {
      setIsLoadingRules(false);
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/alerts/history?limit=8', { cache: 'no-store' });
      const payload = (await response.json()) as { history?: AlertHistoryEvent[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load alert history.');
      }

      setHistory(Array.isArray(payload.history) ? payload.history : []);
    } catch {
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void refreshRules();
    void refreshHistory();
  }, [refreshHistory, refreshRules]);

  const addCondition = () => {
    setConditions((current) => [...current, emptyCondition()]);
  };

  const updateCondition = <K extends keyof CompositeAlertCondition>(
    index: number,
    key: K,
    value: CompositeAlertCondition[K]
  ) => {
    setConditions((current) =>
      current.map((condition, currentIndex) =>
        currentIndex === index ? { ...condition, [key]: value } : condition
      )
    );
  };

  const removeCondition = (index: number) => {
    setConditions((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current));
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((candidate) => candidate.id === templateId);
    if (!template) return;

    setName(template.name);
    setLogic(template.logic);
    setCooldownMinutes(template.cooldownMinutes);
    setConditions(template.conditions.map((condition) => ({ ...condition })));
    setSubmitError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const symbols = symbolsInput
        .split(',')
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean);

      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          symbols,
          conditions,
          logic,
          cooldownMinutes,
          channel: 'in_app',
        }),
      });

      const payload = (await response.json()) as { rule?: AlertRule; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to create alert rule.');
      }

      setName('');
      setSymbolsInput('');
      setConditions([emptyCondition()]);
      setLogic('AND');
      setCooldownMinutes(120);

      await Promise.all([refreshRules(), refreshHistory()]);
      setActiveTab('rules');
    } catch (submitErr) {
      setSubmitError(submitErr instanceof Error ? submitErr.message : 'Failed to create alert rule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRule = async (rule: AlertRule) => {
    try {
      const response = await fetch(`/api/alerts/${rule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to update alert rule.');
      }

      await refreshRules();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Failed to update alert rule.');
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/alerts/${ruleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to delete alert rule.');
      }

      await Promise.all([refreshRules(), refreshHistory()]);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete alert rule.');
    }
  };

  const totalActiveRules = useMemo(() => rules.filter((rule) => rule.isActive).length, [rules]);

  const previewText = useMemo(() => {
    if (!conditions.length) return 'No conditions set.';
    const conditionsText = conditions.map(conditionToText).join(logic === 'AND' ? ', and ' : ', or ');
    const symbolsText = symbolsInput.trim() ? symbolsInput.toUpperCase() : 'all tracked symbols';
    return `Alert me when ${conditionsText} on ${symbolsText}.`;
  }, [conditions, logic, symbolsInput]);

  const tabs: Array<{ key: Tab; label: string; badge?: number }> = [
    { key: 'create', label: 'Create Rule' },
    { key: 'rules', label: 'My Rules', badge: rules.length },
    { key: 'history', label: 'History', badge: history.length },
  ];

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="shrink-0 p-4 pb-0 md:p-6 md:pb-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-bold text-foreground">Smart Alerts</h3>
          {totalActiveRules > 0 && (
            <span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              {totalActiveRules} active
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Get notified when your signal conditions are met. Pick a template or build a custom rule.
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex shrink-0 border-b border-border px-4 md:px-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-yellow-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground">
                  {tab.badge}
                </span>
              )}
            </span>
            {activeTab === tab.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-yellow-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        {/* ── Create Tab ── */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            {/* Templates */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Start from a template
              </p>
              <div className="grid gap-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template.id)}
                    className="group rounded-lg border border-border p-3 text-left transition-colors hover:border-yellow-500/50 hover:bg-yellow-500/5"
                  >
                    <p className="text-sm font-medium text-foreground group-hover:text-yellow-500">
                      {template.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or customise below</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="alert-name" className="text-xs font-medium text-muted-foreground">
                  Rule name
                </label>
                <input
                  id="alert-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60"
                  placeholder="e.g. High conviction breakout"
                  required
                />
              </div>

              <div>
                <label htmlFor="alert-symbols" className="text-xs font-medium text-muted-foreground">
                  Symbols
                </label>
                <input
                  id="alert-symbols"
                  value={symbolsInput}
                  onChange={(event) => setSymbolsInput(event.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60"
                  placeholder="AAPL, NVDA, MSFT"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Comma-separated. Leave blank to watch all tracked symbols.
                </p>
              </div>

              {/* Conditions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Conditions</label>
                  <button
                    type="button"
                    onClick={addCondition}
                    className="rounded-md px-2 py-1 text-xs font-medium text-yellow-500 transition-colors hover:bg-yellow-500/10"
                  >
                    + Add
                  </button>
                </div>

                {conditions.map((condition, index) => {
                  const selectedField = fieldOptions.find((option) => option.value === condition.field);

                  return (
                    <div key={`condition-${index}`} className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                              {index + 1}
                            </span>
                            When...
                          </div>
                          <select
                            value={condition.field}
                            onChange={(event) =>
                              updateCondition(index, 'field', event.target.value as AlertMetricField)
                            }
                            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground"
                          >
                            {fieldOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={condition.operator}
                              onChange={(event) =>
                                updateCondition(index, 'operator', event.target.value as AlertMetricOperator)
                              }
                              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                            >
                              {operatorOptions.map((operator) => (
                                <option key={operator} value={operator}>
                                  {operatorLabels[operator]}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              step="0.01"
                              value={condition.value}
                              onChange={(event) => updateCondition(index, 'value', Number(event.target.value))}
                              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground">{selectedField?.hint}</p>
                        </div>
                        {conditions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCondition(index)}
                            className="mt-5 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                            title="Remove condition"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {index < conditions.length - 1 && (
                        <div className="mt-2 flex items-center justify-center">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {logic}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Logic & Cooldown */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Match logic</label>
                  <select
                    value={logic}
                    onChange={(event) => setLogic(event.target.value === 'OR' ? 'OR' : 'AND')}
                    className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground"
                  >
                    <option value="AND">All (AND)</option>
                    <option value="OR">Any (OR)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cooldown</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={cooldownMinutes}
                      onChange={(event) => setCooldownMinutes(Number(event.target.value) || 60)}
                      className="h-9 w-full rounded-md border border-border bg-background px-2 pr-10 text-sm text-foreground"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      min
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-yellow-500/70">Preview</p>
                <p className="mt-1 text-sm text-foreground">{previewText}</p>
              </div>

              {submitError && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2">
                  <p className="text-xs text-red-500">{submitError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 w-full rounded-md bg-yellow-500 px-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-yellow-400 disabled:opacity-60"
              >
                {isSubmitting ? 'Creating...' : 'Create Alert Rule'}
              </button>
            </form>
          </div>
        )}

        {/* ── My Rules Tab ── */}
        {activeTab === 'rules' && (
          <div className="space-y-3">
            {isLoadingRules ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading rules...</p>
            ) : error ? (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : !rules.length ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No rules yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="mt-2 text-sm font-medium text-yellow-500 transition-colors hover:text-yellow-400"
                >
                  Create your first rule
                </button>
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    rule.isActive ? 'border-success/30 bg-success/5' : 'border-border bg-muted/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            rule.isActive ? 'bg-success' : 'bg-muted-foreground/40'
                          }`}
                        />
                        <p className="truncate text-sm font-semibold text-foreground">{rule.name}</p>
                      </div>
                      <div className="mt-2 space-y-1 pl-4">
                        <p className="text-xs text-muted-foreground">
                          {rule.symbols.length ? rule.symbols.join(', ') : 'All symbols'}
                        </p>
                        {rule.conditions.map((condition, index) => (
                          <p key={index} className="text-xs text-foreground/80">
                            {conditionToText(condition)}
                            {index < rule.conditions.length - 1 && (
                              <span className="ml-1 font-semibold text-muted-foreground">{rule.logic}</span>
                            )}
                          </p>
                        ))}
                        <p className="text-[11px] text-muted-foreground">
                          Cooldown: {rule.cooldownMinutes}m
                          {rule.lastTriggeredAt && ` \u00b7 Last triggered ${formatRelativeTime(rule.lastTriggeredAt)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void toggleRule(rule)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          rule.isActive
                            ? 'border-success/40 text-success hover:bg-success/10'
                            : 'border-border text-muted-foreground hover:border-success/40 hover:text-success'
                        }`}
                      >
                        {rule.isActive ? 'On' : 'Off'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteRule(rule.id)}
                        className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-500"
                        title="Delete rule"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === 'history' && (
          <div className="space-y-2">
            {isLoadingHistory ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading history...</p>
            ) : !history.length ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No triggers yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  When a rule&apos;s conditions are met, matches appear here.
                </p>
              </div>
            ) : (
              history.map((event) => (
                <div key={event.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-yellow-500/10 px-1.5 py-0.5 text-xs font-bold text-yellow-500">
                        {event.symbol}
                      </span>
                      <span className="text-sm text-foreground">{event.ruleName}</span>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(event.triggeredAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>
                      Strength <span className="font-medium text-foreground">{event.score.toFixed(1)}</span>
                    </span>
                    <span>
                      Move{' '}
                      <span className={event.scoreDelta >= 0 ? 'font-medium text-success' : 'font-medium text-red-500'}>
                        {event.scoreDelta >= 0 ? '+' : ''}{event.scoreDelta.toFixed(1)}
                      </span>
                    </span>
                    <span>
                      News{' '}
                      <span className={event.sentiment >= 0 ? 'font-medium text-success' : 'font-medium text-red-500'}>
                        {event.sentiment.toFixed(2)}
                      </span>
                    </span>
                    <span>
                      Change{' '}
                      <span className={event.changePercent >= 0 ? 'font-medium text-success' : 'font-medium text-red-500'}>
                        {event.changePercent >= 0 ? '+' : ''}{event.changePercent.toFixed(2)}%
                      </span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompositeAlertsPanel;
