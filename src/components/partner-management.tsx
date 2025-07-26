
"use client";

import React, { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, firebaseApp } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PartnerForm } from '@/components/partner-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


// Définition d'un type pour les données d'un partenaire pour la sécurité de type
export interface Partner {
  id: string;
  name: string;
  description: string;
  servicePillar: string;
}

/**
 * Gère l'affichage, l'ajout, la modification et la suppression des partenaires.
 */
export function PartnerManagement() {
  const partnersCollectionRef = collection(db, 'partners');
  const [partnersSnapshot, loading, error] = useCollection(partnersCollectionRef);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deletingPartnerId, setDeletingPartnerId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const functions = getFunctions(firebaseApp);
  const deletePartnerFn = httpsCallable(functions, 'deletePartner');


  const handleAddNew = () => {
    setEditingPartner(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (partner: Partner) => {
    setEditingPartner(partner);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
  };
  
  const handleDelete = async () => {
    if (!deletingPartnerId) return;

    setIsDeleting(true);
    try {
      await deletePartnerFn({ partnerId: deletingPartnerId });
      toast({
        title: "Succès",
        description: "Partenaire supprimé avec succès.",
      });
    } catch (error) {
       console.error("Erreur lors de la suppression du partenaire:", error);
       toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingPartnerId(null);
    }
  };


  if (loading) {
    return (
        <div className="border rounded-lg p-4">
            <Table><TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Pilier</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
            {Array.from({ length: 3 }).map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-6 w-32" /></TableCell><TableCell><Skeleton className="h-6 w-40" /></TableCell><TableCell className="text-right space-x-2"><Skeleton className="h-8 w-8 inline-block" /><Skeleton className="h-8 w-8 inline-block" /></TableCell></TableRow>))}
            </TableBody></Table>
        </div>
    )
  }

  if (error) {
    console.error("Erreur de chargement des partenaires depuis Firestore:", error);
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Erreur</AlertTitle><AlertDescription>Impossible de charger les données des partenaires.</AlertDescription></Alert>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Liste des partenaires</h2>
        <Button onClick={handleAddNew}>
          Ajouter un partenaire
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du partenaire</TableHead>
              <TableHead>Pilier de service</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partnersSnapshot?.docs.map((doc) => {
              const partner = { id: doc.id, ...doc.data() } as Partner;
              return (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{partner.servicePillar}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEditClick(partner)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Modifier {partner.name}</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="icon" onClick={() => setDeletingPartnerId(partner.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Supprimer {partner.name}</span>
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible et supprimera définitivement le partenaire "{partner.name}".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeletingPartnerId(null)}>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? "Suppression..." : "Supprimer"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
             {partnersSnapshot?.docs.length === 0 && (
                <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">Aucun partenaire trouvé.</TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]" onInteractOutside={(e) => { e.preventDefault(); handleCloseModal(); }}>
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'Modifier le partenaire' : 'Ajouter un nouveau partenaire'}
            </DialogTitle>
            <DialogDescription>
              {editingPartner ? "Mettez à jour les informations ci-dessous." : "Remplissez le formulaire pour créer un nouveau partenaire."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PartnerForm 
              onClose={handleCloseModal} 
              initialData={editingPartner} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

