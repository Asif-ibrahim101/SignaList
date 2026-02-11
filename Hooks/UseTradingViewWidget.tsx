'use client'
import { useEffect, useRef } from 'react'

const UseTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height: number) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const serializedConfig = JSON.stringify(config);

    useEffect(() => {
        const container = containerRef.current;
        if(!container) return;
        
        // Find the widget container div (the one with class "tradingview-widget-container__widget")
        const widgetContainer = container.querySelector('.tradingview-widget-container__widget');
        if(!widgetContainer) return;
        
        // Reset container so switching configs/scripts re-initializes cleanly
        widgetContainer.innerHTML = "";

        // Create and configure the script
        const script = document.createElement("script");
        script.src = scriptUrl;
        script.type = "text/javascript";
        script.async = true;
        script.text = serializedConfig;
        
        // Append script to the widget container (TradingView script will render into this container)
        widgetContainer.appendChild(script);

        return () => {
            // Remove all scripts from the widget container
            const scripts = widgetContainer.querySelectorAll('script');
            scripts.forEach(s => s.remove());
            widgetContainer.innerHTML = "";
        }

    }, [scriptUrl, serializedConfig, height]);

    return containerRef;
}

export default UseTradingViewWidget
