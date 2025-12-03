'use client'
import { useEffect, useRef } from 'react'

const UseTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height: number) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if(!containerRef.current) return;
        if(containerRef.current.dataset.loaded) return;
        
        // Find the widget container div (the one with class "tradingview-widget-container__widget")
        const widgetContainer = containerRef.current.querySelector('.tradingview-widget-container__widget');
        if(!widgetContainer) return;
        
        // Create and configure the script
        const script = document.createElement("script");
        script.src = scriptUrl;
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify(config);
        
        // Append script to the widget container (TradingView script will render into this container)
        widgetContainer.appendChild(script);
        containerRef.current.dataset.loaded = "true";

        return () => {
            const current = containerRef.current;
            if(current) {
                const widget = current.querySelector('.tradingview-widget-container__widget');
                if(widget) {
                    // Remove all scripts from the widget container
                    const scripts = widget.querySelectorAll('script');
                    scripts.forEach(s => s.remove());
                    widget.innerHTML = "";
                }
                delete current.dataset.loaded;
            }
        }

    }, [scriptUrl, config, height]);

    return containerRef;
}

export default UseTradingViewWidget