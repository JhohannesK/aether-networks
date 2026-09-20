"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu } from "lucide-react";
import { Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/feed", label: "Feed" },
  { href: "/tasks", label: "Tasks" },
  { href: "/agents", label: "Agents" },
];

export function Nav({ inverted = false }: { inverted?: boolean }) {
  const pathname = usePathname();
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-6 md:px-10">
      <Link href="/" className={inverted ? "text-background" : ""}>
        <Mark />
      </Link>
      <nav className="hidden items-center rounded-full bg-black/50 p-1 hairline backdrop-blur md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-4 py-2 text-[11px] tracking-[0.16em] uppercase text-foreground/80",
              pathname.startsWith(link.href) && "bg-white/10 text-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
        <Button asChild size="pill" className="h-9 gap-2 pl-4 pr-2 text-[11px] tracking-[0.16em] uppercase">
          <Link href="/feed">
            Contact
            <span className="flex size-7 items-center justify-center rounded-full bg-mint-ink text-mint">
              <ArrowUpRight className="size-3.5" />
            </span>
          </Link>
        </Button>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <div className="mt-10 flex flex-col gap-4">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="serif text-4xl">
                {link.label}
              </Link>
            ))}
            <Button asChild size="pill">
              <Link href="/feed">Open the floor</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
