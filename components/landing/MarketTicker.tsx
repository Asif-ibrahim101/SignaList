import { TrendingDown, TrendingUp } from "lucide-react";

interface TickerItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  icon?: string;
}

const tickerData: TickerItem[] = [
  { symbol: "DJI", name: "Dow Jones", price: "42,322.5", change: "+156.8", changePercent: "+0.37%", isPositive: true },
  { symbol: "SPX", name: "S&P 500", price: "5,892.4", change: "-12.3", changePercent: "-0.21%", isPositive: false },
  { symbol: "IXIC", name: "NASDAQ", price: "19,654.2", change: "+89.4", changePercent: "+0.46%", isPositive: true },
  { symbol: "BTC", name: "Bitcoin", price: "83,913", change: "-617.00", changePercent: "-0.73%", isPositive: false, icon: "₿" },
  { symbol: "ETH", name: "Ethereum", price: "2,698.6", change: "-119.10", changePercent: "-4.23%", isPositive: false, icon: "◆" },
  { symbol: "EUR/USD", name: "Euro", price: "1.18490", change: "-0.01207", changePercent: "-1.01%", isPositive: false, icon: "€" },
  { symbol: "GBP/USD", name: "Pound", price: "1.26840", change: "+0.00234", changePercent: "+0.18%", isPositive: true, icon: "£" },
  { symbol: "AAPL", name: "Apple", price: "198.45", change: "+2.34", changePercent: "+1.19%", isPositive: true },
  { symbol: "NVDA", name: "NVIDIA", price: "875.20", change: "-6.30", changePercent: "-0.72%", isPositive: false },
  { symbol: "GOOGL", name: "Google", price: "178.92", change: "-0.12", changePercent: "-0.07%", isPositive: false },
];

export const MarketTicker = () => {
  return (
    <div className="w-full overflow-hidden border-y-2 border-border bg-background relative flex items-center">
      {/* Ticker Content */}
      <div className="animate-ticker flex whitespace-nowrap py-3">
        {[...tickerData, ...tickerData].map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="mx-6 flex items-center gap-4 border-r-2 border-border pr-12"
          >
            {/* Symbol */}
            <span className="font-bold text-foreground font-mono text-sm tracking-widest uppercase">
              {item.symbol}
            </span>

            {/* Price */}
            <span className="font-medium text-foreground text-sm tabular-nums">
              {item.price}
            </span>

            {/* Change */}
            <span
              className={`flex items-center gap-1.5 font-bold font-mono text-xs tabular-nums tracking-wider uppercase ${item.isPositive
                  ? "text-success"
                  : "text-destructive"
                }`}
            >
              {item.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{item.change}</span>
              <span className="opacity-60">({item.changePercent})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
