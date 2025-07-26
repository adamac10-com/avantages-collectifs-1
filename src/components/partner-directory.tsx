"use client";

import React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Affiche la liste des partenaires depuis la collection Firestore 'partners'.
 * Gère les états de chargement, d'erreur et d'affichage des données.
 */
export function PartnerDirectory() {
  // 3. Créer une référence à la collection 'partners'
  const partnersCollectionRef = collection(db, 'partners');

  // 4. Utiliser le hook useCollection pour récupérer les données en temps réel
  const [partnersSnapshot, loading, error] = useCollection(partnersCollectionRef);

  // 5. Gérer l'état de chargement
  if (loading) {
    return (
      <div className="border rounded-lg p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du partenaire</TableHead>
              <TableHead>Pilier de service</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Afficher plusieurs skeletons pour simuler le chargement */}
            {Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                <TableCell><Skeleton className="h-6 w-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // 5. Gérer l'état d'erreur
  if (error) {
    console.error("Erreur de chargement des partenaires depuis Firestore:", error);
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur de chargement</AlertTitle>
        <AlertDescription>
          Impossible de récupérer la liste des partenaires. Vérifiez votre connexion
          ou les permissions Firestore.
        </AlertDescription>
      </Alert>
    );
  }

  // 5. Gérer l'état de succès (données disponibles)
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Nom du partenaire</TableHead>
            <TableHead className="w-[220px]">Pilier de service</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partnersSnapshot && partnersSnapshot.docs.length > 0 ? (
            partnersSnapshot.docs.map((doc) => {
              const data = doc.data();
              return (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{data.name}</TableCell>
                  <TableCell>{data.servicePillar}</TableCell>
                  <TableCell>{data.description}</TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center h-24">
                Aucun partenaire trouvé.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
