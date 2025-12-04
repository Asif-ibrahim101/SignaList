import React from "react";
import Header from "@/components/Header";
import TickerTapeWidget from "@/components/TickerTapeWidget";

const Layout = ({children} : {children: React.ReactNode}) => {
    return (
        <main className="min-h-screen text-gray-400">
            <Header />
            <div className="ticker-tape-container w-full">
                <TickerTapeWidget />
            </div>
            <div className="container py-10">
                {children}
            </div>
        </main>
    );
};

export default Layout;