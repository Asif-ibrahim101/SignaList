'use client'

import { useMemo, useState } from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import HeatmapSwitcher from '@/components/HeatmapSwitcher';
import {
  MARKET_OVERVIEW_WIDGET_CONFIG,
  TOP_STORIES_WIDGET_CONFIG,
  MARKET_DATA_WIDGET_CONFIG,
  HOTLISTS_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  POPULAR_STOCK_SYMBOLS,
} from '@/lib/constants';
import { useTheme } from '@/components/ThemeProvider';

const HomeDashboard = () => {
  const { theme } = useTheme();
  const widgetTheme = theme === 'dark' ? 'dark' : 'light';
  const scriptUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';
  const [taSymbol, setTaSymbol] = useState('AAPL');
  const normalizedSymbol = taSymbol.trim().toUpperCase();
  const isKnownSymbol = POPULAR_STOCK_SYMBOLS.includes(normalizedSymbol);

  const withWidgetTheme = useMemo(() => {
    const backgroundColor = widgetTheme === 'dark' ? '#141414' : '#FFFFFF';
    const gridColor = widgetTheme === 'dark' ? '#141414' : '#E5E7EB';

    return (config: Record<string, unknown>) => ({
      ...config,
      colorTheme: widgetTheme,
      theme: widgetTheme,
      backgroundColor,
      gridColor,
    });
  }, [widgetTheme]);

  return (
    <div className="flex home-wrapper min-h-screen">
      <section className="grid gap-8 home-section w-full">
        <div className="md:col-span-1 xl:col-span-1">
          <TradingViewWidget
            title="Market Overview"
            scriptUrl={`${scriptUrl}market-overview.js`}
            config={withWidgetTheme(MARKET_OVERVIEW_WIDGET_CONFIG)}
            height={600}
            className="custom-chart"
          />
        </div>

        <div className="md:col-span-1 xl:col-span-2">
          <HeatmapSwitcher scriptBaseUrl={scriptUrl} theme={widgetTheme} />
        </div>
      </section>

      <section className="grid w-full gap-8 home-section">
        <div className="h-full md:col-span-1 xl:col-span-1">
          <TradingViewWidget
            title="Top Movers"
            scriptUrl={`${scriptUrl}hotlists.js`}
            config={withWidgetTheme(HOTLISTS_WIDGET_CONFIG)}
            height={600}
          />
        </div>
        <div className="h-full md:col-span-1 xl:col-span-1">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}timeline.js`}
            config={withWidgetTheme(TOP_STORIES_WIDGET_CONFIG)}
            height={600}
          />
        </div>
        <div className="h-full md:col-span-1 xl:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-bold">Technical Analysis</h3>
            <div className="flex items-center gap-2">
              <label htmlFor="ta-symbol" className="text-sm text-muted-foreground">
                Symbol
              </label>
              <input
                id="ta-symbol"
                list="ta-symbols"
                value={taSymbol}
                onChange={(event) => setTaSymbol(event.target.value.toUpperCase())}
                onBlur={() => setTaSymbol((value) => value.trim().toUpperCase() || 'AAPL')}
                className="h-9 w-24 rounded-md border border-border bg-card px-2 text-sm text-foreground"
                placeholder="AAPL"
              />
              <datalist id="ta-symbols">
                {POPULAR_STOCK_SYMBOLS.map((symbol) => (
                  <option key={symbol} value={symbol} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="mt-3">
            {isKnownSymbol ? (
              <TradingViewWidget
                scriptUrl={`${scriptUrl}technical-analysis.js`}
                config={{ ...withWidgetTheme(TECHNICAL_ANALYSIS_WIDGET_CONFIG(normalizedSymbol)), height: 600 }}
                height={600}
              />
            ) : (
              <div className="flex h-[600px] flex-col items-center justify-center rounded-lg border border-border bg-card text-center">
                <p className="text-sm text-muted-foreground">
                  No data for “{normalizedSymbol || '—'}”. Try a symbol from the list.
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="h-full md:col-span-2 xl:col-span-3">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}market-quotes.js`}
            config={withWidgetTheme(MARKET_DATA_WIDGET_CONFIG)}
            height={600}
          />
        </div>
      </section>
    </div>
  );
};

export default HomeDashboard;
