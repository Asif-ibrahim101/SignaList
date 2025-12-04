import React from "react";
import Link from "next/link";
import Image from "next/image";

const Layout = ({children} : {children: React.ReactNode}) => {
    return (
        <main className="auth-layout">
            <div className="auth-left-section scrollbar-hide-default">
                <Link href="/" className="auth-logo">
                    <Image src="/assets/icons/logo.svg" alt="SignaList" width={140} height={32} />
                </Link>

                <div className="pb-6 lg:pb-8 flex-1">
                    {children}
                </div>
            </div>

            <div className="auth-right-section">
                <div className="z-10 relative lg:mt-4 lg:mb-16">
                    <blockquote className="auth-blockquote text-gray-300">
                        Signalist turned my watchlist into a winning list. The alerts are spot-on, and I feel more confident making moves in the market
                    </blockquote>

                    <div className="flex items-center gap-2">
                        <div className="">
                            <cite className="auth-testimonial-author">John Doe</cite>
                            <p className="max-md:text-xs text-gray-500">CEO of ABC Inc.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Image src="/assets/icons/star.svg" alt="Star" key={star} width={20} height={20} className="w-5 h-5" />
                            ))}
                    </div>
                </div>

                <div className="flex-1 relative">
                    <Image src="/assets/images/dashboard.png" alt="Dashboard Preview" width={1440} height={1150} className="auth-dashboard-preview absolute top-0" />
                </div>
            </div>
        </main>
    );
};

export default Layout;