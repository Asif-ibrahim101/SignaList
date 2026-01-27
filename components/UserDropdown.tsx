'use client'
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import NavItems from "@/components/NavItems";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import { LogOut, LogOutIcon } from 'lucide-react';

const UserDropdown = () => {
    const router = useRouter();

    const handle_Signout = async () => {
      router.push("/sign-in")
    };

    //testing the user login
    const user = {name: 'John', email: "contact@jsmastery.com"};
    console.log(user.name[0])
    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 text-muted-foreground hover:text-yellow-500">
                        <Avatar>
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>

                        <div className="hidden md:flex flex-col items-start">
                            <span className="text-base font-medium text-foreground">
                                {user.name}
                            </span>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="text-muted-foreground bg-card border-border">
                    <DropdownMenuLabel>
                        <div className="flex relative items-center gap-3 py-2">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                                    {user.name[0]}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col">
                                <span className="text-base font-medium text-foreground">
                                    {user.name}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {user.email}
                                </span>
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border"/>
                    <DropdownMenuItem onClick={handle_Signout} className="text-foreground text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2 hidden sm:block" />
                        Logout
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="hidden sm:block bg-border"/>
                    <nav className="sm:hidden">
                        <NavItems />
                    </nav>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default UserDropdown;
