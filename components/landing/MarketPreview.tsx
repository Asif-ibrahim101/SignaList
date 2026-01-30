import { TrendingDown, TrendingUp } from "lucide-react";
import { StockHeatmap } from "./StockHeatmap";

const stockList = [
  { symbol: "JPM", name: "JPMorgan Chase", price: "305.89", change: "-0.53", percent: "-0.17%", isPositive: false },
  { symbol: "WFC", name: "Wells Fargo Co", price: "90.49", change: "-0.15", percent: "-0.17%", isPositive: false },
  { symbol: "BAC", name: "Bank Amer Corp", price: "53.20", change: "+0.12", percent: "+0.23%", isPositive: true },
  { symbol: "HSBC", name: "HSBC Holdings", price: "88.01", change: "-0.53", percent: "-0.60%", isPositive: false },
  { symbol: "C", name: "Citigroup Inc", price: "115.71", change: "+0.51", percent: "+0.44%", isPositive: true },
];

export const MarketPreview = () => {
  return (
    <section id="markets" className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Real-Time
            <span className="text-gradient"> Market Data</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Comprehensive market overview with stocks, crypto, ETFs, and forex rates
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Market Overview</h3>
              <div className="flex gap-2">
                {["Financial", "Technology", "Services"].map((tab, i) => (
                  <button
                    key={tab}
                    type="button"
                    className={`rounded-md px-3 py-1 text-sm transition-colors ${
                      i === 0
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {stockList.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-xs font-bold text-primary-foreground">
                      {stock.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground">{stock.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{stock.price}</div>
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        stock.isPositive ? "text-success" : "text-destructive"
                      }`}
                    >
                      {stock.isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {stock.change} {stock.percent}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <StockHeatmap />
        </div>
      </div>
    </section>
  );
};
