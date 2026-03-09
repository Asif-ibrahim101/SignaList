import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import NavSearch from "@/components/NavSearch";
import UserDropdown from "@/components/UserDropdown";
import ThemeToggle from "@/components/ThemeToggle";

const Header = () => {
    return (
        <>
            <header className="sticky top-0 z-50 bg-background border-b-2 border-border">
                <div className="container flex justify-between items-center px-6 py-4">
                    <Link href="/" className="transition-transform hover:scale-105">
                        <Image
                            className="h-10 w-auto cursor-pointer"
                            alt="SignaList"
                            src="/assets/icons/Logo.svg"
                            width={180}
                            height={40}
                        />
                    </Link>

                    <nav className="hidden sm:block">
                        <NavItems />
                    </nav>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:block">
                            <NavSearch />
                        </div>
                        <Link
                            href="/app/news"
                            className="flex h-10 w-10 items-center justify-center border-2 border-border bg-background text-muted-foreground transition-colors hover:bg-foreground hover:text-background hover:border-foreground"
                            title="Market News"
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                                <path d="M18 14h-8" />
                                <path d="M15 18h-5" />
                                <path d="M10 6h8v4h-8V6Z" />
                            </svg>
                        </Link>
                        <ThemeToggle />
                        <UserDropdown />
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;
