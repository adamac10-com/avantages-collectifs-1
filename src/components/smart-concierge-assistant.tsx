"use client";

import { useState } from "react";
import type { SmartConciergeAssistantOutput } from "@/ai/flows/smart-concierge-assistant";
import { getAiSuggestions } from "@/app/actions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bot, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "./ui/label";

export function SmartConciergeAssistant() {
  const [memberRequest, setMemberRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SmartConciergeAssistantOutput | null>(
    null
  );
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberRequest.trim()) {
      toast({
        variant: "destructive",
        title: "Champ Requis",
        description: "Veuillez saisir la demande d'un membre.",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await getAiSuggestions({ memberRequest });
      setResult(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast({
        variant: "destructive",
        title: "Erreur de l'IA",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
      <section>
        <Card className="h-full">
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Assistant Concierge</CardTitle>
              <CardDescription>
                Saisissez la demande d'un membre pour recevoir des suggestions
                de services et des informations clés.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="grid w-full gap-2">
                <Label htmlFor="member-request" className="sr-only">
                  Demande du membre
                </Label>
                <Textarea
                  id="member-request"
                  placeholder="Ex: 'Bonjour, je cherche un plombier pour une fuite d'eau dans ma salle de bain...'"
                  rows={10}
                  value={memberRequest}
                  onChange={(e) => setMemberRequest(e.target.value)}
                  className="text-base"
                  aria-label="Demande du membre"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full text-lg"
              >
                {loading ? "Analyse en cours..." : "Obtenir des suggestions"}
                {!loading && <Sparkles className="ml-2 h-5 w-5" />}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </section>

      <section>
        <Card className="min-h-[300px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot />
              Suggestions de l'IA
            </CardTitle>
            <CardDescription>
              Voici les résultats générés par l'IA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-6">
                <div>
                  <Skeleton className="mb-2 h-6 w-1/2" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-32 rounded-full" />
                    <Skeleton className="h-8 w-28 rounded-full" />
                  </div>
                </div>
                <div>
                  <Skeleton className="mb-2 h-6 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-5/6" />
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="flex h-full min-h-[200px] items-center justify-center rounded-md border border-dashed">
                <p className="text-center text-muted-foreground">
                  Les suggestions apparaîtront ici.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-primary">
                    Services Suggérés
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {result.suggestedServices?.map((service) => (
                      <Badge
                        key={service}
                        variant="secondary"
                        className="border-accent bg-accent/10 px-4 py-1.5 text-base text-accent-foreground"
                      >
                        {service}
                      </Badge>
                    ))}
                    {result.suggestedServices?.length === 0 && (
                       <p className="text-sm text-muted-foreground">Aucun service spécifique suggéré.</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="mb-3 text-lg font-semibold text-primary">
                    Détails Clés à Considérer
                  </h3>
                  <p className="text-base leading-relaxed text-foreground/90">
                    {result.keyDetails}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
