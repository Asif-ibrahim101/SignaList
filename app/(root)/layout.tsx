import React from "react";
import Header from "@/components/Header";
import TickerTapeWidget from "@/components/TickerTapeWidget";
import AiInsightChat from "@/components/AiInsightChat";

const Layout = ({children} : {children: React.ReactNode}) => {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Header />
            <div className="ticker-tape-container w-full">
                <TickerTapeWidget />
            </div>
            <div className="container py-10">
                {children}
            </div>
            <AiInsightChat />
        </main>
    );
};

export default Layout;
