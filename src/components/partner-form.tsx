
"use client";

import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { firebaseApp } from '@/lib/firebase';
import type { Partner } from './partner-management';

interface PartnerFormProps {
  onClose: () => void;
  initialData?: Partner | null;
}

const servicePillars = [
  'Protection & Assurance', 
  'Habitat & Rénovation', 
  'Assistance & Quotidien', 
  'Loisirs & Voyages'
];

export function PartnerForm({ onClose, initialData }: PartnerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    servicePillar: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        servicePillar: initialData.servicePillar,
      });
    } else {
        setFormData({ name: '', description: '', servicePillar: '' });
    }
  }, [initialData]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prevData => ({ ...prevData, servicePillar: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

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
      
      if (initialData) {
        // Mode mise à jour
        const updatePartner = httpsCallable(functions, 'updatePartner');
        await updatePartner({ partnerId: initialData.id, updatedData: formData });
        toast({
          title: "Succès",
          description: "Partenaire mis à jour avec succès !",
        });
      } else {
        // Mode création
        const createPartner = httpsCallable(functions, 'createPartner');
        await createPartner(formData);
        toast({
          title: "Succès",
          description: "Partenaire ajouté avec succès !",
        });
      }
      onClose();

    } catch (error: any) {
      console.error("Erreur détaillée lors de la soumission:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
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
          placeholder="Ex: Entreprise de Rénovation ABC"
          required
          style={{ minHeight: '48px' }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Offre des services de rénovation complets pour la maison."
          required
          className="min-h-[100px]"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="servicePillar">Pilier de service</Label>
        <Select 
            onValueChange={handleSelectChange} 
            value={formData.servicePillar}
            required
        >
          <SelectTrigger id="servicePillar" style={{ minHeight: '48px' }}>
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

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} style={{ minHeight: '48px' }}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading} style={{ minHeight: '48px' }}>
          {isLoading ? 'Enregistrement...' : (initialData ? 'Mettre à jour' : 'Ajouter le partenaire')}
        </Button>
      </div>
    </form>
  );
}
