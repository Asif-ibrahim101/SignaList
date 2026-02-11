import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import NavSearch from "@/components/NavSearch";
import UserDropdown from "@/components/UserDropdown";
import ThemeToggle from "@/components/ThemeToggle";

const Header = () => {
    return (
        <>
            <header className="sticky top-0 header">
                <div className="container header-wrapper">
                    <Link href="/">
                        <Image className="h-12 w-auto cursor-pointer" alt="SignaList" src="/assets/icons/Logo.svg" width={210} height={48} />
                    </Link>

                    <nav className="hidden sm:block">
                        <NavItems />
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block">
                            <NavSearch />
                        </div>
                        <ThemeToggle />
                        <UserDropdown />
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;
