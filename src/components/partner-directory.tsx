"use client";

import React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Trash2 } from 'lucide-react';

/**
 * Affiche la liste des partenaires depuis la collection Firestore 'partners'.
 * Gère les états de chargement, d'erreur et d'affichage des données,
 * et permet la suppression d'un partenaire.
 */
export function PartnerDirectory() {
  const partnersCollectionRef = collection(db, 'partners');
  const [partnersSnapshot, loading, error] = useCollection(partnersCollectionRef);
  const { toast } = useToast();
  const functions = getFunctions();

  /**
   * Gère la suppression d'un partenaire après confirmation.
   * @param partnerId L'ID du partenaire à supprimer.
   */
  const handleDelete = async (partnerId: string) => {
    // 1. Demander confirmation à l'utilisateur
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce partenaire ? Cette action est irréversible.")) {
      return;
    }

    // 2. Préparer et appeler la Cloud Function
    const deletePartner = httpsCallable(functions, 'deletePartner');
    try {
      await deletePartner({ partnerId });
      // 3. Afficher un toast de succès
      toast({
        title: "Succès",
        description: "Partenaire supprimé avec succès !",
        variant: "default",
      });
    } catch (error) {
      // 4. Gérer les erreurs
      console.error("Erreur lors de la suppression du partenaire:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du partenaire.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du partenaire</TableHead>
              <TableHead>Pilier de service</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

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

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Nom du partenaire</TableHead>
            <TableHead className="w-[220px]">Pilier de service</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    {/* 5. Bouton de suppression */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id)}
                      aria-label="Supprimer le partenaire"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24">
                Aucun partenaire trouvé.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
