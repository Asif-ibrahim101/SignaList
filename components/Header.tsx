import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";

const Header = () => {
    return (
        <>
            <header className="sticky top-0 header">
                <div className="container header-wrapper">
                    <Link href="/">
                        <Image className="h-8 w-auto cursor-pointer" alt={""} src="/assets/icons/logo.svg" width={140} height={32} />
                    </Link>

                    <nav className="hidden sm:block">
                        <NavItems />
                    </nav>

                    {/*{user dropdown}*/}
                </div>
            </header>
        </>
    );
};

export default Header;