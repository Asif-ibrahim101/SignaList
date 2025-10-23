'use client'
import {NAVITEMS} from "@/lib/constants";
import Link from "next/link";
import {usePathname} from "next/navigation";

const NavItems = () => {
    console.log(NAVITEMS);

    const pathName = usePathname();

    const isActive = (path : string) => {
        if (path === '/') {
            return pathName === '/';}

        return pathName.startsWith(path);
    };
    return (
        <>
            <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
                {NAVITEMS.map((item) => (
                    <li key={item.href}>
                        <Link href={item.href} className={`hover:text-yellow-500 transition-colors ${isActive(item.href) ? `text-gray-100` : ''}`}>
                            {item.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </>
    );
};

export default NavItems;