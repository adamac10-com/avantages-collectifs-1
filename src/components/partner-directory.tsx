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
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth(); // Obtenir l'utilisateur connecté

  const filteredPartners = filter
    ? partners.filter((p) => p.servicePillar === filter)
    : partners;

  const handleRequestService = async (partner: Partner) => {
    console.log("ACTION: Début de handleRequestService.");

    // Vérification 1: L'utilisateur est-il connecté ?
    if (!user) {
      console.error("ERREUR FATALE: Utilisateur non connecté. Opération annulée.");
      alert("Erreur : Vous devez être connecté pour faire une demande.");
      return;
    }

    // Vérification 2: Les données du partenaire sont-elles valides ?
    if (!partner || !partner.name) {
      console.error("ERREUR FATALE: Données du partenaire manquantes ou invalides.", partner);
      alert("Erreur : Impossible de traiter la demande pour ce partenaire.");
      return;
    }

    // Construction de l'objet de données
    const requestData = {
      memberId: user.uid,
      memberName: user.displayName || "Nom non disponible",
      partnerName: partner.name,
      serviceDemande: partner.name,
      status: "Nouveau",
      createdAt: serverTimestamp(),
    };

    // Affichage des données exactes qui vont être envoyées
    console.log("DATA: Données préparées pour l'écriture :", requestData);

    try {
      const requestsCollectionRef = collection(db, 'conciergeRequests');
      
      console.log("SENDING: Envoi des données à Firestore...");
      await addDoc(requestsCollectionRef, requestData);
      
      console.log("SUCCESS: Demande enregistrée avec succès dans Firestore.");
      alert("Demande transmise avec succès !");

    } catch (error) {
      console.error("FIRESTORE ERROR: Échec de l'écriture dans Firestore.", error);
      alert("Une erreur est survenue lors de la transmission de votre demande.");
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
                onClick={() => handleRequestService(partner)}
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
