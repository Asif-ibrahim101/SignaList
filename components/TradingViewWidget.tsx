'use client'
// TradingViewWidget.jsx
import React, { memo } from 'react';
import UseTradingViewWidget from '@/Hooks/UseTradingViewWidget';
import { cn } from '@/lib/utils';

interface TradingViewWidgetProps {
  title?: string;
  description?: string;
  scriptUrl: string;
  config: Record<string, unknown>;
  height?: number;
  className?: string;
};

const TradingViewWidget = ({title, description, scriptUrl, config, height = 600, className}: TradingViewWidgetProps) => {
  const containerRef = UseTradingViewWidget(scriptUrl, config, height);

  return (
    <div className="w-full">
        {title && (
          <div className="mb-4">
            <h3 className="text-2xl font-bold">{title}</h3>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
        )}
        <div className={cn('tradingview-widget-container', className)} ref={containerRef}>
                <div className="tradingview-widget-container__widget" style={{ height, width: "100%" }} />
        </div>
    </div>
  );
}

export default memo(TradingViewWidget);
