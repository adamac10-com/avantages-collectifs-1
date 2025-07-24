"use client";

import React, { useState, useMemo } from "react";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { Partner } from "@/types/partner";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";

const servicePillars = [
  "Protection & Assurance",
  "Habitat & Rénovation",
  "Assistance & Quotidien",
  "Loisirs & Voyages",
];

export function PartnerDirectory({ allPartners }: { allPartners: Partner[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string | null>(null);

  const handleRequestService = async (partner: Partner) => {
    console.log("ACTION: Début de handleRequestService.");

    if (!user) {
      console.error("ERREUR FATALE: Utilisateur non connecté. Opération annulée.");
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour faire une demande.",
        variant: "destructive"
      });
      return;
    }

    if (!partner || !partner.name) {
      console.error("ERREUR FATALE: Données du partenaire manquantes ou invalides.", partner);
       toast({
        title: "Erreur",
        description: "Impossible de traiter la demande pour ce partenaire.",
        variant: "destructive"
      });
      return;
    }

    const requestData = {
      memberId: user.uid,
      memberName: user.displayName || "Nom non disponible",
      partnerName: partner.name,
      serviceDemande: partner.name,
      status: "Nouveau",
      createdAt: serverTimestamp(),
    };

    console.log("DATA: Données préparées pour l'écriture :", requestData);

    try {
      const requestsCollectionRef = collection(db, 'conciergeRequests');
      
      console.log("SENDING: Envoi des données à Firestore...");
      await addDoc(requestsCollectionRef, requestData);
      
      console.log("SUCCESS: Demande enregistrée avec succès dans Firestore.");
      toast({
          title: "Demande transmise !",
          description: "Votre concierge vous recontactera très prochainement.",
      });

    } catch (error) {
      console.error("FIRESTORE ERROR: Échec de l'écriture dans Firestore.", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la transmission de votre demande.",
        variant: "destructive"
      });
    }
  };

  const filteredPartners = useMemo(() => {
    if (!filter) {
      return allPartners;
    }
    return allPartners.filter((p) => p.servicePillar === filter);
  }, [filter, allPartners]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Nos Partenaires de Confiance</h1>
        <p className="text-lg text-muted-foreground">
          Découvrez les services exclusifs négociés pour vous.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => setFilter(null)}
          variant={filter === null ? "default" : "outline"}
          size="lg"
          className="min-h-[48px]"
        >
          Tous
        </Button>
        {servicePillars.map((pillar) => (
          <Button
            key={pillar}
            onClick={() => setFilter(pillar)}
            variant={filter === pillar ? "default" : "outline"}
            size="lg"
            className="min-h-[48px]"
          >
            {pillar}
          </Button>
        ))}
      </div>

      {filteredPartners && filteredPartners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <Card key={partner.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{partner.name}</CardTitle>
                <CardDescription className="text-primary">{partner.servicePillar}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{partner.description}</p>
              </CardContent>
              <div className="p-6 pt-0">
                <Button
                  onClick={() => handleRequestService(partner)}
                  className="w-full min-h-[48px] text-base"
                  disabled={!user}
                >
                  Demander ce service via mon concierge
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
         <Card>
            <CardContent className="p-10">
                <p className="text-center text-muted-foreground">
                    Aucun partenaire disponible pour le moment. Veuillez vérifier votre base de données Firestore.
                </p>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
