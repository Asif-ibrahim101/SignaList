import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";

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

                    <UserDropdown />
                </div>
            </header>
        </>
    );
};

export default Header;
