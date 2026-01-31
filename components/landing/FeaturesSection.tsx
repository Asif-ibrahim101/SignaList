import { BarChart3, LineChart, Zap, Globe, Bell, Shield } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Stock Heatmaps",
    description:
      "Visualize market movements at a glance with interactive heatmaps covering all major sectors and indices.",
  },
  {
    icon: LineChart,
    title: "Advanced Charts",
    description:
      "Professional-grade charting with 100+ technical indicators, drawing tools, and customizable timeframes.",
  },
  {
    icon: Zap,
    title: "Real-Time Data",
    description:
      "Lightning-fast market data with sub-second updates for stocks, crypto, forex, and commodities.",
  },
  {
    icon: Globe,
    title: "Global Markets",
    description:
      "Track markets worldwide with coverage of NYSE, NASDAQ, LSE, TSE, and 50+ global exchanges.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description:
      "Set price alerts, trend notifications, and custom triggers to never miss a trading opportunity.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Bank-grade encryption and 99.9% uptime guarantee for worry-free trading analysis.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-20 lg:py-32">
      <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-primary/5 blur-[150px]" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Everything You Need to
            <span className="text-gradient"> Trade Smarter</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful tools designed for both beginners and professional traders
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-gradient-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-gradient">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
