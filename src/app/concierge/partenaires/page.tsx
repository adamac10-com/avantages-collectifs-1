"use client";

import React from 'react';
import { PartnerManagement } from '@/components/partner-management';

/**
 * Page pour la gestion des partenaires par les concierges.
 * Affiche la liste des partenaires et permet d'en ajouter de nouveaux via une modale.
 */
export default function ConciergePartnersPage() {

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Partenaires</h1>
      </div>

      <p className="text-muted-foreground">
        Consultez, modifiez ou ajoutez de nouveaux partenaires commerciaux.
      </p>
      
      {/* Composant qui affiche la liste des partenaires existants et contient la logique d'ajout */}
      <PartnerManagement />

    </div>
  );
}
