"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tag } from "lucide-react";
import type { Partner } from "@/types/partner";
import { memberData } from "@/lib/member-data";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";

const partners: Partner[] = [
  {
    id: "1",
    name: "Axa Assurance",
    servicePillar: "Protection & Assurance",
    description: "Solutions d'assurance complètes pour votre tranquillité d'esprit.",
  },
  {
    id: "2",
    name: "Home Services Pro",
    servicePillar: "Habitat & Rénovation",
    description: "Experts en rénovation et entretien de l'habitat.",
  },
  {
    id: "3",
    name: "Quotidien Facile",
    servicePillar: "Assistance & Quotidien",
    description: "Aide à domicile, jardinage et petits travaux.",
  },
  {
    id: "4",
    name: "Voyages & Découvertes",
    servicePillar: "Loisirs & Voyages",
    description: "Agences de voyages pour des escapades inoubliables.",
  },
  {
    id: "5",
    name: "Generali",
    servicePillar: "Protection & Assurance",
    description: "Assurance vie et prévoyance pour sécuriser votre avenir.",
  },
  {
    id: "6",
    name: "BricoMax",
    servicePillar: "Habitat & Rénovation",
    description: "Matériaux et conseils pour tous vos projets de bricolage.",
  },
];

const servicePillars = [
  "Protection & Assurance",
  "Habitat & Rénovation",
  "Assistance & Quotidien",
  "Loisirs & Voyages",
];

export function PartnerDirectory() {
  const [filter, setFilter] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredPartners = filter
    ? partners.filter((p) => p.servicePillar === filter)
    : partners;

  const handleRequestService = async (partnerName: string) => {
    const requestData = {
      // In a real app, memberId would come from the auth state
      memberId: "user_jean_dupont",
      memberName: memberData.name,
      partnerName: partnerName,
      createdAt: serverTimestamp(),
      status: "Nouveau",
    };

    try {
      const db = getFirestore(firebaseApp);
      const requestsCollectionRef = collection(db, "conciergeRequests");
      await addDoc(requestsCollectionRef, requestData);

      toast({
        title: "Demande transmise !",
        description: `Votre demande pour le service "${partnerName}" a été transmise à votre concierge.`,
      });
    } catch (error) {
      console.error("Error writing document: ", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la transmission de votre demande.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Nos Partenaires de Confiance
        </h1>
        <p className="text-lg text-muted-foreground">
          Découvrez les services exclusifs négociés pour vous.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant={filter === null ? "default" : "outline"}
          onClick={() => setFilter(null)}
          size="lg"
        >
          Tous
        </Button>
        {servicePillars.map((pillar) => (
          <Button
            key={pillar}
            variant={filter === pillar ? "default" : "outline"}
            onClick={() => setFilter(pillar)}
            size="lg"
          >
            {pillar}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPartners.map((partner) => (
          <Card key={partner.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">{partner.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 pt-1">
                <Tag className="h-4 w-4" />
                {partner.servicePillar}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-base">{partner.description}</p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full text-base"
                style={{ minHeight: "48px" }}
                onClick={() => handleRequestService(partner.name)}
              >
                Demander ce service via mon concierge
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
