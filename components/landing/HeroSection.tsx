import Link from "next/link";
import { ArrowRight, Play, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-24 lg:py-40 bg-background border-b-2 border-border">
      {/* Brutalist Grid Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.15
        }}
      />

      <div className="container relative mx-auto px-4 lg:px-8 flex flex-col items-start gap-12">
        <div className="inline-flex items-center gap-3 border-2 border-border bg-card px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground shadow-[4px_4px_0_0_var(--border)]">
          <Terminal className="h-4 w-4 text-primary" />
          <span>v2.0.4 Deployed</span>
          <span className="h-1.5 w-1.5 rounded-none bg-primary" />
          <span className="text-foreground font-semibold">Live</span>
        </div>

        <div className="max-w-4xl">
          <h1 className="mb-8 text-5xl font-black uppercase leading-[1.05] tracking-tighter text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
            Track Markets
            <br />
            <span className="text-primary italic">Without Noise</span>
          </h1>

          <p className="mb-10 max-w-2xl text-xl font-medium leading-relaxed text-muted-foreground sm:text-2xl">
            Real-time heatmaps, institutional-grade charting, and algorithmic alerts.
            All the data. None of the fluff.
          </p>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Button size="xl" className="group rounded-none border-2 border-primary bg-primary text-primary-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all px-8 py-6 text-lg font-bold uppercase tracking-tight shadow-[6px_6px_0_0_var(--foreground)] hover:shadow-[2px_2px_0_0_var(--foreground)]" asChild>
              <Link href="/sign-up">
                Start Trading Terminal
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" className="group rounded-none border-2 border-border bg-transparent hover:bg-white/5 px-8 py-6 text-lg font-bold uppercase tracking-tight" asChild>
              <a href="#markets">
                <Play className="mr-2 h-5 w-5 fill-current" />
                View Demo
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Section moved to align left and feel more technical */}
        <div className="mt-16 grid grid-cols-2 gap-x-12 gap-y-8 border-t-2 border-border pt-12 md:grid-cols-3 w-full max-w-4xl">
          <div className="flex flex-col gap-2 relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary transform scale-y-0 transition-transform origin-bottom hover:scale-y-100" />
            <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Active Nodes</span>
            <span className="text-4xl font-black tracking-tighter text-foreground">50.2K+</span>
          </div>
          <div className="flex flex-col gap-2 relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary transform scale-y-0 transition-transform origin-bottom hover:scale-y-100" />
            <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Markets</span>
            <span className="text-4xl font-black tracking-tighter text-foreground">140+</span>
          </div>
          <div className="flex flex-col gap-2 relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary transform scale-y-0 transition-transform origin-bottom hover:scale-y-100" />
            <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Uptime SLA</span>
            <span className="text-4xl font-black tracking-tighter text-primary">99.99%</span>
          </div>
        </div>
      </div>
    </section>
  );
};
