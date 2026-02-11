'use client'

import { useMemo } from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import HeatmapSwitcher from '@/components/HeatmapSwitcher';
import SignalLeaderboard from '@/components/SignalLeaderboard';
import CompositeAlertsPanel from '@/components/CompositeAlertsPanel';
import {
  TOP_STORIES_WIDGET_CONFIG,
  MARKET_DATA_WIDGET_CONFIG,
  HOTLISTS_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from '@/lib/constants';
import { useTheme } from '@/components/ThemeProvider';

const HomeDashboard = () => {
  const { theme } = useTheme();
  const widgetTheme = theme === 'dark' ? 'dark' : 'light';
  const scriptUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';

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
        <div className="md:col-span-2 xl:col-span-3">
          <HeatmapSwitcher scriptBaseUrl={scriptUrl} theme={widgetTheme} />
        </div>
      </section>

      <section className="grid w-full gap-8 home-section auto-rows-[minmax(700px,1fr)]">
        <div className="md:col-span-2 xl:col-span-2">
          <SignalLeaderboard />
        </div>
        <div className="md:col-span-1 xl:col-span-1">
          <CompositeAlertsPanel />
        </div>
      </section>

      <section className="grid w-full gap-8 home-section">
        <div className="h-full md:col-span-1 xl:col-span-1">
          <TradingViewWidget
            title="Top Movers"
            description="Stocks with the biggest gains, losses, and trading volume today. Updated in real time."
            scriptUrl={`${scriptUrl}hotlists.js`}
            config={withWidgetTheme(HOTLISTS_WIDGET_CONFIG)}
            height={600}
          />
        </div>
        <div className="h-full md:col-span-1 xl:col-span-1">
          <TradingViewWidget
            title="Market News"
            description="Latest headlines and stories moving the stock market right now."
            scriptUrl={`${scriptUrl}timeline.js`}
            config={withWidgetTheme(TOP_STORIES_WIDGET_CONFIG)}
            height={600}
          />
        </div>
        <div className="h-full md:col-span-1 xl:col-span-1">
          <TradingViewWidget
            title="Technical Analysis"
            description="Buy, sell, and neutral indicators based on moving averages and oscillators."
            scriptUrl={`${scriptUrl}technical-analysis.js`}
            config={{ ...withWidgetTheme(TECHNICAL_ANALYSIS_WIDGET_CONFIG('AAPL')), height: 600 }}
            height={600}
          />
        </div>
        <div className="h-full md:col-span-2 xl:col-span-3">
          <TradingViewWidget
            title="Market Quotes"
            description="Live prices, daily change, and key stats for tracked stocks across sectors."
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
