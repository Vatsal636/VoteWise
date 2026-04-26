"use client";

import Link from "next/link";
import { Vote, Bot, Map, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/journey", label: "Journey", icon: Map },
    { href: "/timeline", label: "Timeline", icon: Vote },
    { href: "/assistant", label: "Assistant", icon: Bot },
    { href: "/guide", label: "Profile", icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-8 mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-primary text-primary-foreground p-1 rounded-md">
            <Vote className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-lg">VoteWise AI</span>
        </Link>
        
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 transition-colors hover:text-primary",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4 hidden sm:block" />
                <span className="hidden sm:inline-block">{link.label}</span>
                <Icon className="h-5 w-5 sm:hidden block" />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
