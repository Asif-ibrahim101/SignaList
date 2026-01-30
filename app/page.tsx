import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BellRing, LineChart, Sparkles } from "lucide-react";

const LandingPage = async () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/icons/logo.svg"
              alt="SignaList"
              width={120}
              height={28}
              className="h-8 w-auto"
            />
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Signalist
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-yellow-500"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-yellow-500/90"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-120px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-yellow-500/15 blur-[140px]" />
          <div className="absolute right-[-120px] top-[180px] h-[320px] w-[320px] rounded-full bg-emerald-500/10 blur-[120px]" />
        </div>
        <div className="container grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-yellow-500" />
              Market intelligence
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Make smarter market moves with live insights and clear signals.
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Track price action, visualize sector heatmaps, and get educational AI
              insights that explain the "why" behind the numbers — all in one
              dashboard.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-md bg-yellow-500 px-5 py-3 text-sm font-semibold text-gray-900 shadow-md transition hover:bg-yellow-500/90"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                I already have an account
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
              <span>Live market heatmaps</span>
              <span>AI investment insights</span>
              <span>Personalized alerts</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 -rotate-2 rounded-3xl border border-border/70 bg-card/70 shadow-xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
              <Image
                src="/assets/images/Stock_Market_app.jpg"
                alt="Signalist dashboard preview"
                width={640}
                height={520}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-6 pb-16 pt-6 md:grid-cols-3">
        {[
          {
            title: "Live signal dashboard",
            description:
              "Monitor price moves, sector flows, and top movers without juggling tabs.",
            icon: LineChart,
          },
          {
            title: "Action-ready alerts",
            description:
              "Set price alerts and get notified when your watchlist hits key levels.",
            icon: BellRing,
          },
          {
            title: "AI learning companion",
            description:
              "Ask the chatbot for educational breakdowns of risks, valuation, and catalysts.",
            icon: Sparkles,
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <item.icon className="h-6 w-6 text-yellow-500" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-border bg-card/50">
        <div className="container flex flex-col items-start gap-4 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Ready to explore the market?</h2>
            <p className="text-sm text-muted-foreground">
              Create your account in minutes and start tracking your favorite symbols.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-md bg-yellow-500 px-5 py-3 text-sm font-semibold text-gray-900 shadow-md transition hover:bg-yellow-500/90"
          >
            Create free account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
