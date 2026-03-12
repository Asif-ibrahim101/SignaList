'use client'

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

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

  const quickActions = [
    { label: 'Browse Signals', href: '/app/signals', icon: '📊' },
    { label: 'Market News', href: '/app/news', icon: '📰' },
    { label: 'Create Alert', href: '#', icon: '🔔', action: 'scroll-to-alerts' },
    { label: 'AI Assistant', href: '#', icon: '🤖', action: 'scroll-to-ai' },
  ];

  return (
    <div className="flex home-wrapper min-h-screen">
      {/* Dashboard Header */}
      <section className="grid gap-6 home-section w-full">
        <div className="md:col-span-2 xl:col-span-3">
          <div className="border-2 border-border bg-card p-6 brutalist-shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                  {greeting}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider font-mono">
                  Your market intelligence dashboard
                </p>
              </div>

              {/* Quick Actions */}
              <div id="tour-quick-actions" className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  action.href === '#' ? (
                    <button
                      key={action.label}
                      className="inline-flex items-center gap-2 border-2 border-border bg-background px-4 py-2 text-xs font-black uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
                      style={{boxShadow: '3px 3px 0 0 var(--border)'}}
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ) : (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="inline-flex items-center gap-2 border-2 border-border bg-background px-4 py-2 text-xs font-black uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
                      style={{boxShadow: '3px 3px 0 0 var(--border)'}}
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Market Overview Section */}
        <div className="md:col-span-2 xl:col-span-3">
          <div className="mb-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Market Overview</h2>
            <div className="mt-1 h-1 w-20 bg-primary"></div>
          </div>
          <div id="tour-heatmap">
            <HeatmapSwitcher scriptBaseUrl={scriptUrl} theme={widgetTheme} />
          </div>
        </div>
      </section>

      {/* Signals & Alerts Section */}
      <section className="grid w-full gap-8 home-section auto-rows-[minmax(700px,1fr)]">
        <div className="md:col-span-2 xl:col-span-3 mb-4">
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Signals & Alerts</h2>
          <div className="mt-1 h-1 w-20 bg-primary"></div>
        </div>
        <div id="tour-signals" className="md:col-span-2 xl:col-span-2">
          <SignalLeaderboard />
        </div>
        <div id="tour-alerts" className="md:col-span-1 xl:col-span-1">
          <CompositeAlertsPanel />
        </div>
      </section>

      {/* Market Data Section */}
      <section className="grid w-full gap-8 home-section">
        <div className="md:col-span-2 xl:col-span-3 mb-4">
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Market Data & Analysis</h2>
          <div className="mt-1 h-1 w-20 bg-primary"></div>
        </div>
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
