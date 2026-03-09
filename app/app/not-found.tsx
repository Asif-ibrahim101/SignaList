import Link from 'next/link';

export default function AppNotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-6 text-center">
        {/* Error Code */}
        <div className="border-2 border-border bg-card p-10 brutalist-shadow">
          <h1 className="text-8xl font-black uppercase tracking-tighter text-foreground">404</h1>
          <div className="mt-3 h-0.5 w-full bg-border" />
          <p className="mt-5 text-xl font-black uppercase tracking-tight text-muted-foreground">
            Page Not Found
          </p>
        </div>

        {/* Message */}
        <div className="border-2 border-border bg-card p-6 brutalist-shadow">
          <p className="text-sm text-foreground">
            This dashboard page doesn't exist. Check the URL or return to your dashboard.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/app"
            className="inline-flex h-12 items-center justify-center border-2 border-border bg-primary px-6 text-sm font-black uppercase tracking-tight text-primary-foreground transition-all hover:bg-foreground hover:text-background hover:border-foreground"
            style={{boxShadow: '4px 4px 0 0 var(--border)'}}
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center border-2 border-border bg-background px-6 text-sm font-black uppercase tracking-tight text-foreground transition-all hover:bg-foreground hover:text-background"
            style={{boxShadow: '4px 4px 0 0 var(--border)'}}
          >
            Home
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
          Error code: 404 | Dashboard page not found
        </p>
      </div>
    </div>
  );
}
