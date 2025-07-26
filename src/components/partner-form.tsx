"use client";

import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { firebaseApp } from '@/lib/firebase';

interface PartnerFormProps {
  onClose: () => void;
}

// Définition des options pour le menu déroulant
const servicePillars = [
  'Protection & Assurance', 
  'Habitat & Rénovation', 
  'Assistance & Quotidien', 
  'Loisirs & Voyages'
];

export function PartnerForm({ onClose }: PartnerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    servicePillar: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };
  
  // Handler spécifique pour le changement de valeur du Select
  const handleSelectChange = (value: string) => {
    setFormData(prevData => ({ ...prevData, servicePillar: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    // Vérification que le pilier de service a bien été sélectionné
    if (!formData.servicePillar) {
        toast({
            title: "Champ requis",
            description: "Veuillez sélectionner un pilier de service.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);

    try {
      const functions = getFunctions(firebaseApp);
      const createPartner = httpsCallable(functions, 'createPartner');
      await createPartner(formData);

      toast({
        title: "Succès",
        description: "Partenaire ajouté avec succès !",
      });
      console.log("Partenaire ajouté avec succès !");
      onClose();

    } catch (error) {
      console.error("Erreur détaillée lors de l'ajout du partenaire:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du partenaire.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du partenaire</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: Boulangerie Paul"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Offre des réductions sur les viennoiseries"
          required
        />
      </div>
      
      {/* --- Bloc de code mis à jour pour le champ "Pilier de service" --- */}
      <div className="space-y-2">
        <Label htmlFor="servicePillar">Pilier de service</Label>
        <Select 
            onValueChange={handleSelectChange} 
            defaultValue={formData.servicePillar}
            required
        >
          <SelectTrigger id="servicePillar">
            <SelectValue placeholder="Sélectionnez un pilier" />
          </SelectTrigger>
          <SelectContent>
            {servicePillars.map((pillar) => (
              <SelectItem key={pillar} value={pillar}>
                {pillar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* --- Fin du bloc de code mis à jour --- */}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Ajout en cours...' : 'Ajouter le partenaire'}
        </Button>
      </div>
    </form>
  );
}
