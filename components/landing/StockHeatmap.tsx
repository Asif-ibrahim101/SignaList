interface StockCell {
  symbol: string;
  change: number;
  size: "lg" | "md" | "sm" | "xs";
}

const stocks: StockCell[] = [
  { symbol: "NVDA", change: -0.72, size: "lg" },
  { symbol: "AAPL", change: 0.46, size: "lg" },
  { symbol: "MSFT", change: -0.74, size: "md" },
  { symbol: "GOOGL", change: -0.07, size: "md" },
  { symbol: "AMZN", change: -1.01, size: "md" },
  { symbol: "META", change: -2.95, size: "sm" },
  { symbol: "TSLA", change: 3.32, size: "sm" },
  { symbol: "BRK.B", change: 0.78, size: "sm" },
  { symbol: "JPM", change: -0.17, size: "sm" },
  { symbol: "V", change: -3.0, size: "xs" },
  { symbol: "WMT", change: 1.47, size: "xs" },
  { symbol: "MA", change: -0.91, size: "xs" },
  { symbol: "PG", change: 0.87, size: "xs" },
  { symbol: "HD", change: 1.23, size: "xs" },
  { symbol: "DIS", change: -1.45, size: "xs" },
];

const getColorClass = (change: number) => {
  if (change >= 2) return "bg-success";
  if (change >= 0.5) return "bg-success/70";
  if (change > 0) return "bg-success/40";
  if (change === 0) return "bg-muted";
  if (change > -0.5) return "bg-destructive/40";
  if (change > -2) return "bg-destructive/70";
  return "bg-destructive";
};

const getSizeClass = (size: StockCell["size"]) => {
  switch (size) {
    case "lg":
      return "col-span-2 row-span-2";
    case "md":
      return "col-span-2 row-span-1";
    case "sm":
      return "col-span-1 row-span-1";
    case "xs":
      return "col-span-1 row-span-1";
  }
};

export const StockHeatmap = () => {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Stocks Heatmap</h3>
      <div className="grid auto-rows-[60px] grid-cols-6 gap-1">
        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            className={`${getSizeClass(stock.size)} ${getColorClass(stock.change)} flex flex-col items-center justify-center rounded-md transition-transform hover:z-10 hover:scale-105`}
          >
            <span className="text-sm font-bold text-foreground">{stock.symbol}</span>
            <span className="text-xs text-foreground/80">
              {stock.change >= 0 ? "+" : ""}
              {stock.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
