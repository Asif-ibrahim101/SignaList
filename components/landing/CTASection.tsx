import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CTASection = () => {
  return (
    <section id="pricing" className="relative py-20 lg:py-32">
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[150px]" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-gradient-card p-8 text-center backdrop-blur-sm sm:p-12 lg:p-16">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Ready to Start
            <span className="text-gradient"> Trading Smarter?</span>
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            Join thousands of traders who trust SignaList for their market analysis.
            Start your free trial today.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button variant="hero" size="xl" className="group w-full sm:w-auto" asChild>
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" className="w-full sm:w-auto" asChild>
              <a href="#about">Contact Sales</a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};
