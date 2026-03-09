'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Error Code */}
        <div className="border-2 border-destructive bg-destructive/10 p-12 brutalist-shadow">
          <h1 className="text-7xl font-black uppercase tracking-tighter text-destructive">Error</h1>
          <div className="mt-4 h-1 w-full bg-destructive" />
          <p className="mt-6 text-2xl font-black uppercase tracking-tight text-destructive">
            Something Went Wrong
          </p>
        </div>

        {/* Message */}
        <div className="border-2 border-border bg-card p-8 brutalist-shadow">
          <p className="text-base text-foreground">
            An unexpected error occurred while loading this page. Please try again.
          </p>
          {error.message && (
            <p className="mt-4 text-sm text-muted-foreground font-mono">
              {error.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex h-14 items-center justify-center border-2 border-border bg-primary px-8 text-base font-black uppercase tracking-tight text-primary-foreground transition-all hover:bg-foreground hover:text-background hover:border-foreground"
            style={{boxShadow: '4px 4px 0 0 var(--border)'}}
          >
            Try Again
          </button>
          <Link
            href="/app"
            className="inline-flex h-14 items-center justify-center border-2 border-border bg-background px-8 text-base font-black uppercase tracking-tight text-foreground transition-all hover:bg-foreground hover:text-background"
            style={{boxShadow: '4px 4px 0 0 var(--border)'}}
          >
            Dashboard
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
          {error.digest ? `Error ID: ${error.digest}` : 'Contact support if this persists'}
        </p>
      </div>
    </div>
  );
}
