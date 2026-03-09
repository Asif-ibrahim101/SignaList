import Link from "next/link";
import { ArrowRight, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CTASection = () => {
  return (
    <section id="pricing" className="relative py-24 lg:py-32 overflow-hidden bg-background border-b-2 border-border">
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Main CTA Block */}
          <div className="relative bg-card border-2 border-border p-10 sm:p-14 lg:p-20 text-center shadow-[12px_12px_0_0_var(--border)] transition-shadow hover:shadow-[4px_4px_0_0_var(--border)]">
            <div className="relative z-10">

              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 border-2 border-primary bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-primary font-bold">
                Deploy Instantly
              </div>

              {/* Heading */}
              <h2 className="mb-8 text-5xl font-black uppercase text-foreground sm:text-6xl lg:text-7xl tracking-tighter">
                Ready to Start
                <br />
                <span className="text-primary italic mt-2 block">Trading Smarter?</span>
              </h2>

              {/* Subheading */}
              <p className="mx-auto mb-12 max-w-2xl text-xl font-medium leading-relaxed text-muted-foreground sm:text-2xl">
                Join thousands of operators utilizing SignaList for institutional market analysis.
                <span className="block mt-2 text-foreground font-bold">Gain your edge today.</span>
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col items-center justify-center gap-6 sm:flex-row mb-12">
                <Button size="xl" className="group rounded-none border-2 border-primary bg-primary text-primary-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all px-10 py-8 text-xl font-bold uppercase tracking-tight shadow-[6px_6px_0_0_var(--foreground)] hover:shadow-[2px_2px_0_0_var(--foreground)] w-full sm:w-auto" asChild>
                  <Link href="/sign-up">
                    Initialize Terminal
                    <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" className="group rounded-none border-2 border-border bg-transparent hover:bg-white/5 px-10 py-8 text-xl font-bold uppercase tracking-tight w-full sm:w-auto" asChild>
                  <a href="#about">Contact Sales</a>
                </Button>
              </div>

              {/* Features List */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-mono tracking-wider font-bold text-muted-foreground">
                {[
                  "No Card Required",
                  "14-Day Free Access",
                  "Cancel Anytime",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 uppercase">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative Corner Elements */}
            <div className="absolute top-0 left-0 w-4 h-4 border-r-2 border-b-2 border-background" />
            <div className="absolute top-0 right-0 w-4 h-4 border-l-2 border-b-2 border-background" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-r-2 border-t-2 border-background" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-l-2 border-t-2 border-background" />
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-0 border-2 border-border bg-border">
            {[
              { value: "50,000+", label: "Active Nodes Worldwide" },
              { value: "$100M+", label: "Daily Tracked Volume" },
              { value: "4.9/5", label: "System Reliability Rating" },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="bg-card p-8 text-center"
              >
                <div className="text-4xl font-black tracking-tighter text-foreground mb-2">{stat.value}</div>
                <div className="text-sm font-mono uppercase tracking-wider text-muted-foreground font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
