
'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Pour la démonstration, nous allons simuler un utilisateur connecté
      // Dans une vraie application, vous laisseriez la ligne suivante telle quelle.
      // setUser(user);

      if (user) {
         setUser(user);
      } else {
        // Simuler un utilisateur de test si personne n'est connecté via Firebase Auth
        const mockUser = {
            uid: "user_test_12345",
            displayName: "Jean Dupont (Test)",
            email: "jean.dupont.test@example.com",
            // Firebase Auth User objets ont beaucoup plus de propriétés,
            // mais nous n'avons besoin que de celles-ci pour notre simulation.
        } as User;
        setUser(mockUser);
      }


      setLoading(false);
    });

    // Nettoyer l'abonnement au démontage
    return () => unsubscribe();
  }, []);

  if (loading) {
    // Affiche un écran de chargement ou un squelette pendant la vérification de l'authentification
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12 space-y-8">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-8 w-2/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
