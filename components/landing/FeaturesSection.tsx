import { BarChart3, LineChart, Zap, Globe, Bell, Shield } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Volume Heatmaps",
    description:
      "Visualize market movements at a glance with interactive heatmaps. Track every sector and index without delay.",
  },
  {
    icon: LineChart,
    title: "Institutional Charting",
    description:
      "Professional-grade charts with 100+ native indicators. Execute precision analysis on customizable timeframes.",
  },
  {
    icon: Zap,
    title: "Sub-Second Feeds",
    description:
      "Lightning-fast market data pipelines. Low-latency edge delivery for equities, crypto, forex, and derivatives.",
  },
  {
    icon: Globe,
    title: "Global Exchanges",
    description:
      "Direct connections to worldwide markets. Unrestricted coverage spanning NYSE, LSE, TSE, and 50+ global venues.",
  },
  {
    icon: Bell,
    title: "Algorithmic Alerts",
    description:
      "Deploy complex trigger conditions. Set programmatic price boundaries, trend anomalies, and volume spikes.",
  },
  {
    icon: Shield,
    title: "Redundant Systems",
    description:
      "Bank-grade encryption paired with our stringent 99.99% uptime guarantee. Zero single points of failure.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24 lg:py-32 bg-background border-b-2 border-border">
      <div className="container relative mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 border-2 border-primary bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-primary font-bold">
            02 // Platform Capabilities
          </div>
          <h2 className="mb-6 text-4xl font-black uppercase text-foreground sm:text-5xl lg:text-6xl tracking-tighter">
            Architected for
            <span className="block mt-1 text-muted-foreground italic">Lethal Precision</span>
          </h2>
          <p className="text-xl font-medium text-foreground max-w-xl">
            Uncompromising tools engineered for high-frequency trading and professional technical analysis.
          </p>
        </div>

        {/* Brutalist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-2 border-border bg-border gap-px">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card p-10 transition-colors hover:bg-foreground hover:text-background"
            >
              {/* Icon Container */}
              <div className="mb-8">
                <feature.icon className="h-10 w-10 text-primary group-hover:text-background transition-colors" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <h3 className="mb-4 text-xl font-black uppercase tracking-tight text-foreground group-hover:text-background transition-colors">
                {feature.title}
              </h3>
              <p className="text-base font-medium leading-relaxed text-muted-foreground group-hover:text-background/80 transition-colors">
                {feature.description}
              </p>

              {/* Decorative element */}
              <div className="absolute top-4 right-4 text-xs font-mono text-border group-hover:text-background/30 font-bold">
                [{String(index + 1).padStart(2, '0')}]
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 border-l-2 border-primary pl-6">
          <p className="text-lg font-bold text-foreground">
            + Dozens of undocumented edge capabilities.
          </p>
          <a href="#demo" className="mt-2 inline-flex items-center text-sm font-bold uppercase tracking-wider text-primary hover:text-foreground transition-colors group">
            Explore Documentation
            <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};
