"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/icons/Logo.svg"
            alt="SignaList"
            width={210}
            height={48}
            className="h-8 w-auto"
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#markets" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Markets
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
          <a href="#about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            About
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sign-in">Log In</Link>
          </Button>
          <Button variant="hero" size="sm" asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-4 px-4 py-4">
            <a href="#features" className="text-sm text-muted-foreground">
              Features
            </a>
            <a href="#markets" className="text-sm text-muted-foreground">
              Markets
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground">
              Pricing
            </a>
            <a href="#about" className="text-sm text-muted-foreground">
              About
            </a>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" size="sm" className="flex-1" asChild>
                <Link href="/sign-in">Log In</Link>
              </Button>
              <Button variant="hero" size="sm" className="flex-1" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
