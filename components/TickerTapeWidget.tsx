'use client'

import React, { useEffect, useRef, memo } from 'react';

/**
 * Renders a container that loads TradingView's ticker tape widget into the DOM.
 *
 * The component injects TradingView's embed script into its container on mount, guards against duplicate injections using a `data-loaded` flag, and removes inserted script elements and the flag on unmount.
 *
 * @returns A JSX element containing the TradingView ticker tape widget container.
 */
function TickerTapeWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    // Check if already loaded
    if (container.current.dataset.loaded) return;

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
      "colorTheme": "dark",
      "locale": "en",
      "largeChartUrl": "",
      "isTransparent": false,
      "showSymbolLogo": true,
      "displayMode": "adaptive"
    });

    container.current.appendChild(script);
    container.current.dataset.loaded = "true";

    return () => {
      if (container.current) {
        const scripts = container.current.querySelectorAll('script');
        scripts.forEach(s => s.remove());
        delete container.current.dataset.loaded;
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container w-full" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

export default memo(TickerTapeWidget);
