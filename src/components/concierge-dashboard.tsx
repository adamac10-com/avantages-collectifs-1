
"use client";

import { useState } from "react";
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db, firebaseApp } from "@/lib/firebase";
import { getFunctions, httpsCallable, HttpsCallableResult } from "firebase/functions";
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
import { Bot, ThumbsUp, UserCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface ConciergeRequest {
  id: string;
  serviceDemande: string;
  details: string;
  status: "Nouveau" | "En cours" | "Terminé";
  createdAt: Timestamp;
  memberId: string;
  memberName?: string;
}

interface Suggestion {
  partnerName: string;
  justification: string;
}

interface SuggestionResult {
  suggestions: Suggestion[];
}

export function ConciergeDashboard() {
  const { toast } = useToast();
  const [suggestionStates, setSuggestionStates] = useState<{ [key: string]: { loading: boolean; data: SuggestionResult | null; error: string | null } }>({});

  const functions = getFunctions(firebaseApp);
  const completeServiceRequest = httpsCallable(functions, "completeServiceRequest");
  const generateSuggestions = httpsCallable< { requestText: string }, SuggestionResult >(functions, "generateSuggestions");

  const requestsQuery = query(
    collection(db, "conciergeRequests"),
    where("status", "in", ["Nouveau", "En cours"]),
    orderBy("createdAt", "desc")
  );
  const [requestsSnapshot, loading, error] = useCollection(requestsQuery);

  const handleValidation = async (requestId: string) => {
    try {
      await completeServiceRequest({ requestId });
      toast({
        title: "Demande validée !",
        description: "La demande a été marquée comme terminée et les points ont été attribués.",
      });
    } catch (err: any) {
      toast({
        title: "Erreur lors de la validation",
        description: err.message || "Une erreur inconnue est survenue.",
        variant: "destructive",
      });
    }
  };
  
  const handleGenerateSuggestions = async (requestId: string, requestText: string) => {
    setSuggestionStates(prev => ({ ...prev, [requestId]: { loading: true, data: null, error: null } }));
    try {
      const result: HttpsCallableResult<SuggestionResult> = await generateSuggestions({ requestText });
      setSuggestionStates(prev => ({ ...prev, [requestId]: { loading: false, data: result.data, error: null } }));
    } catch (err: any) {
      setSuggestionStates(prev => ({ ...prev, [requestId]: { loading: false, data: null, error: err.message || "An error occurred." } }));
      toast({
        title: "Erreur de suggestion",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord Concierge</h1>
        <p className="text-muted-foreground">
          Gérez les demandes de service des membres et utilisez l'assistant IA pour des recommandations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demandes Actives</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Demande</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5} className="text-center">Chargement...</TableCell></TableRow>}
              {error && <TableRow><TableCell colSpan={5} className="text-center text-destructive">Erreur: {error.message}</TableCell></TableRow>}
              {!loading && requestsSnapshot?.docs.map((doc) => {
                const request = { id: doc.id, ...doc.data() } as ConciergeRequest;
                const suggestions = suggestionStates[request.id];
                return (
                  <>
                    <TableRow key={request.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                        {request.memberName || request.memberId.substring(0, 6)}
                      </TableCell>
                      <TableCell>
                        <p className="font-bold">{request.serviceDemande}</p>
                        <p className="text-sm text-muted-foreground">{request.details}</p>
                      </TableCell>
                      <TableCell>{request.createdAt.toDate().toLocaleDateString()}</TableCell>
                      <TableCell><Badge>{request.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleGenerateSuggestions(request.id, `${request.serviceDemande}: ${request.details}`)} disabled={suggestions?.loading}>
                          {suggestions?.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                          Suggestions IA
                        </Button>
                        <Button size="sm" onClick={() => handleValidation(request.id)}>
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Valider
                        </Button>
                      </TableCell>
                    </TableRow>
                    {suggestions && (
                      <TableRow key={`${request.id}-suggestions`}>
                        <TableCell colSpan={5}>
                          {suggestions.loading && <p className="text-sm text-muted-foreground">Génération des suggestions...</p>}
                          {suggestions.error && <Alert variant="destructive"><AlertTitle>Erreur</AlertTitle><AlertDescription>{suggestions.error}</AlertDescription></Alert>}
                          {suggestions.data && (
                            <div className="p-4 bg-muted/50 rounded-lg">
                              <h4 className="font-bold mb-2">Suggestions de Partenaires :</h4>
                              {suggestions.data.suggestions.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-2">
                                  {suggestions.data.suggestions.map(s => (
                                    <li key={s.partnerName}>
                                      <strong>{s.partnerName}:</strong> {s.justification}
                                    </li>
                                  ))}
                                </ul>
                              ) : <p className="text-sm">Aucun partenaire pertinent trouvé.</p>}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {!loading && requestsSnapshot?.empty && <TableRow><TableCell colSpan={5} className="text-center">Aucune demande active.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
