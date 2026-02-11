'use client'

import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from '@/components/ThemeProvider';

function TickerTapeWidget() {
  const container = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const currentContainer = container.current;
    if (!currentContainer) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        {
          "proName": "FOREXCOM:SPXUSD",
          "title": "S&P 500 Index"
        },
        {
          "proName": "FOREXCOM:NSXUSD",
          "title": "US 100 Cash CFD"
        },
        {
          "proName": "FX_IDC:EURUSD",
          "title": "EUR to USD"
        },
        {
          "proName": "BITSTAMP:BTCUSD",
          "title": "Bitcoin"
        },
        {
          "proName": "BITSTAMP:ETHUSD",
          "title": "Ethereum"
        }
      ],
      "colorTheme": theme,
      "locale": "en",
      "largeChartUrl": "",
      "isTransparent": false,
      "showSymbolLogo": true,
      "displayMode": "adaptive"
    });

    currentContainer.appendChild(script);

    return () => {
      const scripts = currentContainer.querySelectorAll('script');
      scripts.forEach(s => s.remove());
      const widget = currentContainer.querySelector('.tradingview-widget-container__widget');
      if (widget) widget.innerHTML = '';
    };
  }, [theme]);

  return (
    <div className="tradingview-widget-container w-full" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

export default memo(TickerTapeWidget);
