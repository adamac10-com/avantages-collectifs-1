import { Infinity } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center space-x-3">
            <Infinity className="h-10 w-10 text-primary" />
            <span className="inline-block text-xl font-bold">
              Avantages Collectifs
            </span>
          </a>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/" passHref>
            <Button variant="ghost">Tableau de Bord</Button>
          </Link>
          <Link href="/partenaires" passHref>
            <Button variant="ghost">Nos Partenaires</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
