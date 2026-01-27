'use client'

import { useEffect, useRef, useState } from 'react';
import { MessageSquareText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';

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
        <div className="w-[92vw] max-w-[420px] rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">AI Investment Insight</p>
              <p className="text-xs text-muted-foreground">Educational only, not financial advice.</p>
            </div>
            <button
              type="button"
              className="rounded-md p-2 text-muted-foreground hover:bg-accent"
              onClick={() => setOpen(false)}
              aria-label="Close AI chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[320px] space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
                Ask about any stock symbol to get a short, educational breakdown.
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-lg bg-yellow-500/15 px-3 py-2 text-xs text-foreground'
                    : 'mr-auto max-w-[85%] rounded-lg bg-muted px-3 py-2 text-xs text-foreground'
                }
              >
                {message.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                value={symbol}
                onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                className="h-9 w-20 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                placeholder="AAPL"
                list="ai-symbols"
              />
              <datalist id="ai-symbols">
                {POPULAR_STOCK_SYMBOLS.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="h-9 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                placeholder="Ask for risks, valuation, catalysts..."
              />
              <Button
                type="button"
                size="sm"
                className="bg-yellow-500 text-gray-900 hover:bg-yellow-500/90"
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
        className="h-12 w-12 rounded-full bg-yellow-500 text-gray-900 shadow-lg hover:bg-yellow-500/90"
        aria-expanded={open}
        aria-label="Open AI insight chat"
      >
        <MessageSquareText className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default AiInsightChat;
