
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
import { setMemberData } from "@/lib/member-data";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";

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
  const { toast } = useToast();

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


  const handleValidation = async (requestId: string, memberId: string, memberName: string) => {
    const pointsToAward = 50;

    try {
      // 1. Update request status in Firestore
      const requestRef = doc(db, "conciergeRequests", requestId);
      await updateDoc(requestRef, {
        status: "Terminé",
      });
    
      // 2. Award loyalty points (using the mock data updater for now)
      // In a real app, this would be a server-side transaction.
      if (memberName === "Jean Dupont") {
        setMemberData({ loyaltyPoints: 1250 + pointsToAward }); // A fixed value for demo
      }
      
      // 3. Log the transaction (server-side logic in a real app)
      console.log("TRANSACTION LOG:", {
        userId: memberId,
        type: "service_partner",
        points: pointsToAward,
        description: `Validation service partenaire`,
        timestamp: new Date().toISOString(),
        validatedBy: "concierge_user_id", // Placeholder
      });
      
      // 4. Notify concierge
      toast({
        title: "Service validé !",
        description: `${pointsToAward} points ont été attribués à ${memberName}.`,
      });

    } catch (error) {
       console.error("Error validating request: ", error);
       toast({
        title: "Erreur",
        description: "La mise à jour du statut de la demande a échoué.",
        variant: "destructive",
      });
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
                    <TableCell>{request.serviceName}</TableCell>
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
                          onClick={() =>
                            handleValidation(request.id, request.memberId, request.memberName)
                          }
                        >
                          Valider et Attribuer les Points
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

