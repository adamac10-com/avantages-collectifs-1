
"use client";

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseApp } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ShieldQuestion } from 'lucide-react';

interface ProtectedRoleWrapperProps {
  children: ReactNode;
}

export default function ProtectedRoleWrapper({ children }: ProtectedRoleWrapperProps) {
  const auth = getAuth(firebaseApp);
  const [user, loading] = useAuthState(auth);
  const [role, setRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.push('/connexion');
      return;
    }
    
    // Force a token refresh to get the latest custom claims.
    user.getIdTokenResult(true).then((idTokenResult) => {
      const userRole = idTokenResult.claims.role as string || null;
      setRole(userRole);
      setIsCheckingRole(false);
    }).catch(error => {
        console.error("Error getting user role:", error);
        setRole(null);
        setIsCheckingRole(false);
    });

  }, [user, loading, router]);
  
  if (loading || isCheckingRole) {
    return (
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12 space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
      </div>
    );
  }
  
  if (role === 'admin' || role === 'concierge') {
    return <>{children}</>;
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-160px)] items-center justify-center">
        <Card className="text-center max-w-lg">
            <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <ShieldQuestion className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="mt-4 text-2xl">Accès non autorisé</CardTitle>
            <CardDescription>
                Vous ne disposez pas des autorisations nécessaires pour accéder à cette page.
                Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur.
            </CardDescription>
            </CardHeader>
        </Card>
    </div>
  );
}
