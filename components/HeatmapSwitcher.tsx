'use client'

import { useMemo, useState } from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import {
  HEATMAP_WIDGET_CONFIG,
  CRYPTO_HEATMAP_WIDGET_CONFIG,
  ETF_HEATMAP_WIDGET_CONFIG,
  FOREX_HEATMAP_WIDGET_CONFIG,
} from '@/lib/constants';

type HeatmapOption = {
  key: string;
  label: string;
  script: string;
  config: Record<string, unknown>;
};

const HEATMAP_OPTIONS: HeatmapOption[] = [
  {
    key: 'stocks',
    label: 'Stocks',
    script: 'stock-heatmap.js',
    config: HEATMAP_WIDGET_CONFIG,
  },
  {
    key: 'crypto',
    label: 'Crypto',
    script: 'crypto-coins-heatmap.js',
    config: CRYPTO_HEATMAP_WIDGET_CONFIG,
  },
  {
    key: 'etf',
    label: 'ETF',
    script: 'etf-heatmap.js',
    config: ETF_HEATMAP_WIDGET_CONFIG,
  },
  {
    key: 'forex',
    label: 'Forex Rates',
    script: 'forex-cross-rates.js',
    config: FOREX_HEATMAP_WIDGET_CONFIG,
  },
];

const HeatmapSwitcher = ({ scriptBaseUrl, theme }: { scriptBaseUrl: string; theme: 'dark' | 'light' }) => {
  const [activeKey, setActiveKey] = useState('stocks');

  const activeOption = useMemo(() => {
    return HEATMAP_OPTIONS.find((option) => option.key === activeKey) ?? HEATMAP_OPTIONS[0];
  }, [activeKey]);

  const themedConfig = useMemo(() => {
    const backgroundColor = theme === 'dark' ? '#141414' : '#FFFFFF';
    const gridColor = theme === 'dark' ? '#141414' : '#E5E7EB';
    return {
      ...activeOption.config,
      colorTheme: theme,
      theme,
      backgroundColor,
      gridColor,
    };
  }, [activeOption, theme]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {HEATMAP_OPTIONS.map((option) => {
          const isActive = option.key === activeOption.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setActiveKey(option.key)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                isActive
                  ? 'bg-yellow-500 text-gray-900 border-yellow-500'
                  : 'bg-card text-muted-foreground border-border hover:border-yellow-500 hover:text-yellow-500'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <TradingViewWidget
        title={`${activeOption.label} Heatmap`}
        scriptUrl={`${scriptBaseUrl}${activeOption.script}`}
        config={themedConfig}
        height={600}
        className={
          activeOption.key === 'forex'
            ? 'widget-forex-heatmap-like'
            : 'widget-stock-heatmap-container'
        }
      />
    </div>
  );
};

export default HeatmapSwitcher;
