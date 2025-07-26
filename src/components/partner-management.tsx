"use client";

import React, { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { AlertCircle, Pencil } from 'lucide-react';

// Définition d'un type pour les données d'un partenaire pour la sécurité de type
interface Partner {
  id: string;
  name: string;
  description: string;
  servicePillar: string;
}

/**
 * Gère l'affichage, l'ajout et la modification des partenaires.
 * Contient la liste des partenaires et la modale du formulaire.
 */
export function PartnerManagement() {
  const partnersCollectionRef = collection(db, 'partners');
  const [partnersSnapshot, loading, error] = useCollection(partnersCollectionRef);

  const [isModalOpen, setIsModalOpen] = useState(false);
  // 1. État pour stocker les données du partenaire en cours de modification.
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  /**
   * Ouvre la modale pour la création d'un nouveau partenaire.
   * Réinitialise l'état du partenaire à modifier.
   */
  const handleAddNew = () => {
    setEditingPartner(null);
    setIsModalOpen(true);
  };

  /**
   * 2. & 3. Ouvre la modale pour la modification d'un partenaire existant.
   * Met à jour l'état avec les données du partenaire sélectionné.
   */
  const handleEditClick = (partner: Partner) => {
    setEditingPartner(partner);
    setIsModalOpen(true);
  };

  /**
   * Ferme la modale et réinitialise l'état.
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
  };

  if (loading) {
    // Squelette de chargement...
    return (
        <div className="border rounded-lg p-4">
            <Table><TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Pilier</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
            {Array.from({ length: 3 }).map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-6 w-32" /></TableCell><TableCell><Skeleton className="h-6 w-40" /></TableCell><TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell></TableRow>))}
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
              <TableHead className="text-right">Modifier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partnersSnapshot?.docs.map((doc) => {
              const partner = { id: doc.id, ...doc.data() } as Partner;
              return (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{partner.servicePillar}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="icon" onClick={() => handleEditClick(partner)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Modifier {partner.name}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]" onInteractOutside={handleCloseModal}>
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'Modifier le partenaire' : 'Ajouter un nouveau partenaire'}
            </DialogTitle>
            <DialogDescription>
              {editingPartner ? "Mettez à jour les informations ci-dessous." : "Remplissez le formulaire pour créer un nouveau partenaire."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* 4. Le formulaire reçoit les données via la prop initialData */}
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
