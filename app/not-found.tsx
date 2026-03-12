import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Error Code */}
        <div className="border-2 border-border bg-card p-12 brutalist-shadow">
          <h1 className="text-9xl font-black uppercase tracking-tighter text-foreground">404</h1>
          <div className="mt-4 h-1 w-full bg-border" />
          <p className="mt-6 text-2xl font-black uppercase tracking-tight text-muted-foreground">
            Page Not Found
          </p>
        </div>

        {/* Message */}
        <div className="border-2 border-border bg-card p-8 brutalist-shadow">
          <p className="text-base text-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-14 items-center justify-center border-2 border-border bg-primary px-8 text-base font-black uppercase tracking-tight text-primary-foreground transition-all hover:bg-foreground hover:text-background hover:border-foreground"
            style={{boxShadow: '4px 4px 0 0 var(--border)'}}
          >
            Go Home
          </Link>
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
          Error code: 404 | Resource not found
        </p>
      </div>
    </div>
  );
}
