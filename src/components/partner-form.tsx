
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { db, firebaseApp } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Partner } from "@/types/partner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const servicePillars = [
  "Protection & Assurance",
  "Habitat & Rénovation",
  "Assistance & Quotidien",
  "Loisirs & Voyages",
] as const;

const formSchema = z.object({
  name: z.string().min(3, {
    message: "Le nom doit contenir au moins 3 caractères.",
  }),
  description: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères.",
  }),
  servicePillar: z.enum(servicePillars, {
    errorMap: () => ({ message: "Veuillez sélectionner un pilier de service." }),
  }),
});

interface PartnerFormProps {
  partner?: Partner | null;
  onSuccess: () => void;
}

export function PartnerForm({ partner, onSuccess }: PartnerFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const functions = getFunctions(firebaseApp);
  const createPartner = httpsCallable(functions, 'createPartner');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: partner?.name || "",
      description: partner?.description || "",
      servicePillar: partner?.servicePillar,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (partner) {
        // UPDATE: Mettre à jour un partenaire existant
        const partnerRef = doc(db, "partners", partner.id);
        await setDoc(partnerRef, values, { merge: true });
        toast({
          title: "Partenaire mis à jour",
          description: "Les informations du partenaire ont été modifiées.",
        });
      } else {
        // CREATE: Appeler la Cloud Function pour créer un nouveau partenaire
        await createPartner(values);
        toast({
          title: "Partenaire ajouté",
          description: "Le nouveau partenaire a été créé avec succès.",
        });
      }
      onSuccess(); // Ferme la modale/dialogue
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde du partenaire: ", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du partenaire</FormLabel>
              <FormControl>
                <Input placeholder="Nom de l'entreprise" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="servicePillar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pilier de Service</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {servicePillars.map((pillar) => (
                    <SelectItem key={pillar} value={pillar}>
                      {pillar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez brièvement le service offert par le partenaire."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
