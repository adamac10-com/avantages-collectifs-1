
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { firebaseApp } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

// Define the type for a request
interface ConciergeRequest {
  id: string;
  memberName: string;
  memberId: string;
  serviceName: string;
  status: "Nouveau" | "En cours" | "Terminé";
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export function ConciergeDashboard() {
  const [requests, setRequests] = useState<ConciergeRequest[]>([]);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const functions = getFunctions(firebaseApp);
  const completeServiceRequest = httpsCallable(functions, 'completeServiceRequest');

  useEffect(() => {
    const q = query(collection(db, "conciergeRequests"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData: ConciergeRequest[] = [];
      querySnapshot.forEach((doc) => {
        requestsData.push({ id: doc.id, ...doc.data() } as ConciergeRequest);
      });
      setRequests(requestsData);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleValidation = async (requestId: string, memberName: string) => {
    setLoadingStates(prev => ({...prev, [requestId]: true}));
    try {
      await completeServiceRequest({ requestId });
      toast({
        title: "Service validé !",
        description: `Les points de fidélité ont été attribués à ${memberName}.`,
      });
    } catch (error: any) {
      console.error("Error calling completeServiceRequest function: ", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la validation.",
        variant: "destructive",
      });
    } finally {
        setLoadingStates(prev => ({...prev, [requestId]: false}));
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Nouveau":
        return "default";
      case "En cours":
        return "secondary";
      case "Terminé":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Tableau de Bord Concierge
        </h1>
        <p className="text-lg text-muted-foreground">
          Gestion des demandes de services des membres.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demandes de services</CardTitle>
          <CardDescription>
            Validez les services pour attribuer les points de fidélité. Les nouvelles demandes apparaissent automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Service Demandé</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.memberName}</TableCell>
                    <TableCell>{request.serviceName || "Non spécifié"}</TableCell>
                    <TableCell>
                       {new Date(request.createdAt.seconds * 1000).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status !== "Terminé" && (
                        <Button
                          size="sm"
                          onClick={() => handleValidation(request.id, request.memberName)}
                          disabled={loadingStates[request.id]}
                        >
                          {loadingStates[request.id] ? "Validation..." : "Valider et Attribuer les Points"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                   <TableCell colSpan={5} className="h-24 text-center">
                     Aucune demande pour le moment.
                   </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
