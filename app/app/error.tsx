'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App section error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-6 text-center">
        {/* Error Header */}
        <div className="border-2 border-destructive bg-destructive/10 p-8 brutalist-shadow">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-destructive">Error</h1>
          <div className="mt-3 h-0.5 w-full bg-destructive" />
          <p className="mt-4 text-lg font-black uppercase tracking-tight text-destructive">
            Dashboard Error
          </p>
        </div>

        {/* Message */}
        <div className="border-2 border-border bg-card p-6 brutalist-shadow">
          <p className="text-sm text-foreground">
            We encountered an error loading your dashboard. This could be due to a temporary issue.
          </p>
          {error.message && (
            <p className="mt-3 text-xs text-muted-foreground font-mono border-t border-border pt-3">
              {error.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex h-12 items-center justify-center border-2 border-border bg-primary px-6 text-sm font-black uppercase tracking-tight text-primary-foreground transition-all hover:bg-foreground hover:text-background hover:border-foreground"
            style={{boxShadow: '4px 4px 0 0 var(--border)'}}
          >
            Retry
          </button>
          <Link
            href="/app"
            className="inline-flex h-12 items-center justify-center border-2 border-border bg-background px-6 text-sm font-black uppercase tracking-tight text-foreground transition-all hover:bg-foreground hover:text-background"
            style={{boxShadow: '4px 4px 0 0 var(--border)'}}
          >
            Dashboard Home
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center border-2 border-border bg-background px-6 text-sm font-black uppercase tracking-tight text-foreground transition-all hover:bg-foreground hover:text-background"
            style={{boxShadow: '4px 4px 0 0 var(--border)'}}
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
