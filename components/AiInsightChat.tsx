'use client'

import { useEffect, useRef, useState } from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const DEFAULT_QUESTION = 'Give an educational overview with risks, valuation, trend, and catalysts.';

const AiInsightChat = () => {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState('AAPL');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSeconds(remaining);
      if (remaining === 0) {
        setCooldownUntil(null);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  const handleSend = async () => {
    const trimmedSymbol = symbol.trim().toUpperCase();
    if (!trimmedSymbol) {
      setError('Please enter a stock symbol.');
      return;
    }

    setError('');
    const userText = question.trim() || DEFAULT_QUESTION;
    const userMessage = `${trimmedSymbol}: ${userText}`;

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: trimmedSymbol, question: userText }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data?.retryAfterSeconds) {
          setCooldownUntil(Date.now() + Number(data.retryAfterSeconds) * 1000);
        }
        const detail = data?.details ? ` (${data.details})` : '';
        throw new Error((data?.error || 'Unable to fetch AI insight.') + detail);
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
      setQuestion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[92vw] max-w-[460px] overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur">
          <div className="border-b border-border bg-gradient-to-r from-yellow-500/15 via-transparent to-emerald-500/15 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/15 text-yellow-500">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Investment Insight</p>
                  <p className="text-xs text-muted-foreground">Educational only, not financial advice.</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md p-2 text-muted-foreground transition hover:bg-accent"
                onClick={() => setOpen(false)}
                aria-label="Close AI chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live assistant
            </div>
          </div>

          <div className="max-h-[340px] space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                Ask about any stock symbol to get a short, structured breakdown.
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-foreground shadow-sm'
                    : 'mr-auto max-w-[85%] rounded-2xl border border-border bg-muted/70 px-3 py-2 text-xs text-foreground shadow-sm'
                }
              >
                <div className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => (
                        <h2 className="mb-2 mt-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          {children}
                        </h2>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc space-y-1 pl-5 text-xs text-foreground">{children}</ul>
                      ),
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      p: ({ children }) => (
                        <p className="text-xs leading-relaxed text-foreground">{children}</p>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Symbol
                </span>
                <input
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                  className="h-7 w-16 bg-transparent text-xs font-semibold text-foreground outline-none"
                  placeholder="AAPL"
                  list="ai-symbols"
                />
              </div>
              <datalist id="ai-symbols">
                {POPULAR_STOCK_SYMBOLS.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="h-9 flex-1 rounded-xl border border-border bg-background px-3 text-xs text-foreground"
                placeholder="Ask for risks, valuation, catalysts..."
              />
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-yellow-500 text-gray-900 hover:bg-yellow-500/90"
                onClick={handleSend}
                disabled={loading || cooldownSeconds > 0}
              >
                {loading ? '...' : cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Send'}
              </Button>
            </div>
            {cooldownSeconds > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Rate limit reached. Please wait {cooldownSeconds}s.
              </p>
            )}
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>
        </div>
      )}

      <Button
        type="button"
        size="icon-lg"
        onClick={() => setOpen((prev) => !prev)}
        className="h-12 w-12 rounded-full bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-500/30 hover:bg-yellow-500/90"
        aria-expanded={open}
        aria-label="Open AI insight chat"
      >
        <Bot className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default AiInsightChat;
