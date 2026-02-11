import React from "react";
import Header from "@/components/Header";
import TickerTapeWidget from "@/components/TickerTapeWidget";
import AiInsightChat from "@/components/AiInsightChat";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/session";

const Layout = async ({children} : {children: React.ReactNode}) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const user = await getUserFromSession(token);

    if (!user) {
        redirect('/sign-in');
    }

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
