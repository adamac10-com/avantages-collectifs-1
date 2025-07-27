
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "@/lib/firebase";

const formSchema = z.object({
  title: z
    .string()
    .min(10, {
      message: "Le titre doit contenir au moins 10 caractères.",
    })
    .max(150, {
      message: "Le titre ne peut pas dépasser 150 caractères.",
    }),
  content: z.string().min(20, {
    message: "Votre message doit contenir au moins 20 caractères.",
  }),
});

export function NewThreadForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const functions = getFunctions(firebaseApp);
  const createCommunityPost = httpsCallable(functions, 'createCommunityPost');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await createCommunityPost({ title: values.title, content: values.content });
      toast({
        title: "Discussion publiée !",
        description: "Votre nouveau fil de discussion est maintenant en ligne.",
      });
      router.push("/communaute");
      router.refresh();
    } catch (error: any) {
       console.error("Erreur lors de la création de la discussion :", error);
       toast({
        title: "Erreur",
        description: error.message || "Impossible de publier la discussion. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold">
          Lancer une nouvelle discussion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Titre de la discussion</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Posez votre question ou lancez votre sujet ici..."
                      {...field}
                      style={{ minHeight: "48px" }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Votre message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Développez votre pensée, donnez des détails..."
                      className="min-h-[200px] text-base"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.back()}
                style={{ minHeight: "48px" }}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="lg"
                style={{ minHeight: "48px" }}
                disabled={isLoading}
              >
                {isLoading ? "Publication en cours..." : "Publier la discussion"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
