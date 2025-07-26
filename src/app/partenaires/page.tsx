"use client";

import React, { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase'; // Correction: Importer firebaseApp
import { PartnerDirectory } from '@/components/partner-directory';
import { Skeleton } from '@/components/ui/skeleton';

// Initialiser l'authentification Firebase
const auth = getAuth(firebaseApp);

/**
 * Page publique affichant l'annuaire des partenaires.
 * Vérifie l'état de l'authentification à des fins de débogage.
 */
export default function PartnersPage() {
  // 4. Utilisation du hook pour obtenir l'utilisateur et l'état de chargement
  const [user, loading] = useAuthState(auth);

  // 5. useEffect pour logger l'état d'authentification au chargement
  useEffect(() => {
    if (loading) {
      console.log("Vérification de l'authentification en cours...");
    } else if (user) {
      // Pour des raisons de sécurité et de confidentialité, ne loguez que des informations non sensibles comme l'email ou l'UID.
      console.log("Utilisateur connecté:", user.email);
    } else {
      console.log("Aucun utilisateur connecté.");
    }
  }, [user, loading]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Découvrez nos Partenaires
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Profitez d'avantages exclusifs négociés pour vous auprès de notre réseau de confiance.
        </p>
      </div>

      {/* Affiche un skeleton pendant la vérification de l'auth pour une meilleure UX */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      ) : (
        <PartnerDirectory />
      )}
    </div>
  );
}
