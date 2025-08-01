
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "./ui/button";
import { UserCog, LogOut, LogIn, Gift, Handshake } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "./ui/skeleton";

export function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const auth = getAuth();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/connexion");
    router.refresh();
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AC";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-brand-gold bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Logo Avantages Collectifs"
              width={180}
              height={45}
              priority
            />
          </Link>
        </div>
        <nav className="flex items-center gap-2">
          {loading ? (
            <Skeleton className="h-10 w-24" />
          ) : user ? (
            <>
              <Link href="/" passHref>
                <Button variant="ghost">Tableau de Bord</Button>
              </Link>
              <Link href="/partenaires" passHref>
                <Button variant="ghost">Nos Partenaires</Button>
              </Link>
              <Link href="/communaute" passHref>
                <Button variant="ghost">La Communauté</Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="outline" className="ml-4">
                    <UserCog className="mr-2" />
                    Espace Concierge
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/concierge/dashboard')}>
                    <UserCog className="mr-2" />
                    <span>Tableau de bord</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/concierge/partenaires')}>
                    <Handshake className="mr-2" />
                    <span>Gérer les partenaires</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'Utilisateur'} />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/recompenses')}>
                    <Gift className="mr-2" />
                    <span>Mes récompenses</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/connexion" passHref>
              <Button>
                <LogIn className="mr-2" />
                Connexion / Inscription
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
