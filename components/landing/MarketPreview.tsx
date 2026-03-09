import { TrendingDown, TrendingUp } from "lucide-react";
import { StockHeatmap } from "./StockHeatmap";

const stockList = [
  { symbol: "JPM", name: "JPMorgan Chase", price: "305.89", change: "-0.53", percent: "-0.17%", isPositive: false },
  { symbol: "WFC", name: "Wells Fargo Co", price: "90.49", change: "-0.15", percent: "-0.17%", isPositive: false },
  { symbol: "BAC", name: "Bank Amer Corp", price: "53.20", change: "+0.12", percent: "+0.23%", isPositive: true },
  { symbol: "HSBC", name: "HSBC Holdings", price: "88.01", change: "-0.53", percent: "-0.60%", isPositive: false },
  { symbol: "C", name: "Citigroup Inc", price: "115.71", change: "+0.51", percent: "+0.44%", isPositive: true },
];

const tabs = ["Financial", "Technology", "Services"];

export const MarketPreview = () => {
  return (
    <section id="markets" className="relative py-24 lg:py-32 bg-background border-b-2 border-border">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.15
        }}
      />

      <div className="container relative mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 border-2 border-success/30 bg-success/10 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-success font-bold">
            <span className="h-2 w-2 rounded-none bg-success animate-pulse" />
            Live Data Feed
          </div>
          <h2 className="mb-6 text-4xl font-black uppercase text-foreground sm:text-5xl lg:text-6xl tracking-tighter">
            Real-Time
            <span className="block mt-1 text-muted-foreground italic">Market Data</span>
          </h2>
          <p className="text-xl font-medium text-foreground max-w-xl">
            Unfiltered data streams for equities, crypto, and derivatives, piped raw into your dashboard.
          </p>
        </div>

        {/* Market Data Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Market Overview Card */}
          <div className="bg-card border-2 border-border p-8 lg:p-10 transition-colors shadow-[8px_8px_0_0_var(--border)]">
            {/* Card Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-border pb-6">
              <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Market Overview</h3>
              <div className="flex gap-2 font-mono text-sm font-bold uppercase tracking-wider overflow-x-auto pb-2 sm:pb-0">
                {tabs.map((tab, i) => (
                  <button
                    key={tab}
                    type="button"
                    className={`border-2 px-3 py-1.5 transition-colors whitespace-nowrap ${i === 0
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-foreground hover:text-background hover:border-foreground"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock List */}
            <div className="flex flex-col gap-0 border-2 border-border bg-border">
              {stockList.map((stock) => (
                <div
                  key={stock.symbol}
                  className="group flex flex-wrap items-center justify-between bg-card p-4 transition-colors hover:bg-foreground hover:text-background mb-[2px] last:mb-0"
                >
                  {/* Left Side */}
                  <div className="flex items-center gap-4">
                    {/* Icon placeholder (brutalist block) */}
                    <div className="flex h-12 w-12 items-center justify-center bg-primary text-sm font-black text-primary-foreground">
                      {stock.symbol.slice(0, 2)}
                    </div>
                    {/* Info */}
                    <div>
                      <div className="font-black text-lg group-hover:text-background transition-colors uppercase tracking-tight">{stock.symbol}</div>
                      <div className="text-sm font-medium text-muted-foreground group-hover:text-background/80 transition-colors">{stock.name}</div>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="text-right mt-2 sm:mt-0 ml-auto">
                    <div className="font-black text-lg tabular-nums group-hover:text-background transition-colors">{stock.price}</div>
                    <div
                      className={`flex items-center justify-end gap-1.5 text-sm font-bold tabular-nums uppercase font-mono tracking-wider ${stock.isPositive ? "text-success group-hover:text-success" : "text-destructive group-hover:text-destructive"
                        }`}
                    >
                      {stock.isPositive ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{stock.change}</span>
                      <span className="opacity-80">({stock.percent})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View More Link */}
            <div className="mt-8 text-right">
              <button className="text-sm font-bold text-foreground hover:text-primary transition-colors uppercase tracking-widest font-mono">
                [ View all markets ]
              </button>
            </div>
          </div>

          {/* Heatmap Card */}
          <div className="bg-card border-2 border-border p-8 lg:p-10 shadow-[8px_8px_0_0_var(--border)] flex flex-col">
            <div className="mb-8 border-b-2 border-border pb-6">
              <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">Volume Heatmap</h3>
              <p className="text-sm font-medium text-muted-foreground">Aggregated sector performance visualization.</p>
            </div>
            {/* The heatmap component is nested here. We wrap it to give it space and a rigid frame */}
            <div className="flex-1 min-h-[400px] border-2 border-border relative overflow-hidden bg-background">
              <StockHeatmap />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
