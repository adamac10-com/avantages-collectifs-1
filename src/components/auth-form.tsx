"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const authSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  email: z.string().email({ message: "Veuillez entrer une adresse e-mail valide." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
});

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { firstName: "", lastName: "", nickname: "", email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof authSchema>) => {
    setIsLoading(true);
    const auth = getAuth(firebaseApp);
    const functions = getFunctions(firebaseApp);

    try {
      if (isSignUp) {
        if (!values.firstName || !values.lastName || !values.nickname) {
          toast({ title: "Erreur", description: "Tous les champs sont requis.", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        // 1. Création de l'utilisateur
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;

        // 2. Mise à jour du profil Auth (pour le `displayName`)
        await updateProfile(user, { displayName: values.nickname });

        // 3. Appel de la Cloud Function pour finaliser et créer le profil Firestore
        const finalizeRegistration = httpsCallable(functions, 'finalizeRegistration');
        await finalizeRegistration({
          firstName: values.firstName,
          lastName: values.lastName,
          nickname: values.nickname,
        });

        toast({ title: "Inscription réussie !", description: "Bienvenue ! Vous allez être redirigé." });
        await user.getIdToken(true); // Forcer le rafraîchissement du token pour les claims
        router.push("/");
        router.refresh();
      } else {
        // Logique de connexion
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: "Connexion réussie !", description: "Ravi de vous revoir." });
        router.push("/");
        router.refresh();
      }
    } catch (error: any) {
      const errorMessage = error.code === "auth/email-already-in-use" 
        ? "Cette adresse e-mail est déjà utilisée."
        : error.message || "Une erreur est survenue.";
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isSignUp ? "Créer un compte" : "Se connecter"}</CardTitle>
        <CardDescription>
          {isSignUp ? "Rejoignez la communauté." : "Accédez à votre espace."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isSignUp && (
              <>
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Jean" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Dupont" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surnom (public)</FormLabel>
                      <FormControl>
                        <Input placeholder="JeanD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="m@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Chargement..." : (isSignUp ? "S'inscrire" : "Se connecter")}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {isSignUp ? "Déjà un compte?" : "Pas encore de compte?"}
          <Button variant="link" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Se connecter" : "S'inscrire"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
