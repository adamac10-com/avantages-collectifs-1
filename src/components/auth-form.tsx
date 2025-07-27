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
  updateProfile, 
  setPersistence, 
  browserSessionPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "@/lib/firebase";
import Image from "next/image";

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
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";


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
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      nickname: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof authSchema>) => {
    // Affiche un état de chargement pour désactiver le formulaire et informer l'utilisateur.
    setIsLoading(true);
    const auth = getAuth(firebaseApp);
    const functions = getFunctions(firebaseApp);

    try {
      // Gérer le cas de l'inscription
      if (isSignUp) {
        // 1. Validation des champs : S'assurer que les informations requises sont présentes.
        if (!values.firstName || !values.lastName || !values.nickname) {
          toast({ 
            title: "Champs manquants", 
            description: "Le nom, le prénom et le surnom sont tous obligatoires.", 
            variant: "destructive" 
          });
          setIsLoading(false); // Arrêter le chargement
          return; // Stopper l'exécution
        }

        // --- Début de la séquence d'opérations critiques ---

        // 2a. Création du compte utilisateur dans Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;

        // 2b. Mise à jour du profil Firebase Auth avec le surnom (displayName)
        // Cette étape est essentielle pour que le surnom soit immédiatement disponible
        // dans le token d'identification de l'utilisateur (idToken).
        await updateProfile(user, {
          displayName: values.nickname,
        });

        // 2c. Appel de la Cloud Function pour créer le document utilisateur dans Firestore
        const finalizeRegistration = httpsCallable(functions, 'finalizeRegistration');
        await finalizeRegistration({
          firstName: values.firstName,
          lastName: values.lastName,
          nickname: values.nickname,
        });

        // --- Fin de la séquence ---

        // Forcer le rafraîchissement du token pour récupérer les "custom claims" (ex: rôle)
        // qui auraient pu être définis par la Cloud Function.
        await user.getIdToken(true); 

        toast({
          title: "Inscription réussie !",
          description: "Bienvenue ! Vous allez être redirigé vers votre espace.",
        });
        
        // Rediriger l'utilisateur vers la page principale après une inscription réussie.
        router.push("/");
        router.refresh();

      } else {
        // Gérer le cas de la connexion (inchangé)
        const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistenceType);
        await signInWithEmailAndPassword(auth, values.email, values.password);
        
        toast({
          title: "Connexion réussie !",
          description: "Ravi de vous revoir.",
        });
        router.push("/");
        router.refresh();
      }
    } catch (error: any) {
      // Gestion centralisée des erreurs (pour Auth et Cloud Functions)
      const errorCode = error.code;
      let errorMessage = "Une erreur inattendue est survenue.";

      if (errorCode === "auth/email-already-in-use") {
        errorMessage = "Cette adresse e-mail est déjà utilisée.";
      } else if (errorCode === "auth/wrong-password" || errorCode === "auth/user-not-found" || errorCode === "auth/invalid-credential") {
        errorMessage = "L'adresse e-mail ou le mot de passe est incorrect.";
      } else if (errorCode === "auth/weak-password") {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
      // Capture les erreurs spécifiques renvoyées par la Cloud Function.
      } else if (error.details?.message) {
        errorMessage = error.details.message; 
      }
      
      console.error("Erreur d'authentification ou d'inscription:", error);
      toast({
        title: "Échec de l'opération",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Quoi qu'il arrive (succès ou échec), désactiver l'état de chargement.
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="items-center">
        <Image 
          src="/logo.png"
          alt="Logo Avantages Collectifs"
          width={150}
          height={37.5}
          className="mb-6"
          priority
        />
        <CardTitle className="text-3xl font-bold">
          {isSignUp ? "Créer un compte" : "Se connecter"}
        </CardTitle>
        <CardDescription>
          {isSignUp
            ? "Rejoignez la communauté pour accéder à tous vos avantages."
            : "Accédez à votre espace membre."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {isSignUp && (
              <>
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Jean" {...field} disabled={isLoading} style={{ minHeight: "48px" }} />
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
                        <Input placeholder="Dupont" {...field} disabled={isLoading} style={{ minHeight: "48px" }} />
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
                        <Input placeholder="JeanD" {...field} disabled={isLoading} style={{ minHeight: "48px" }} />
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
                  <FormLabel>Adresse e-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="exemple@domaine.com" {...field} disabled={isLoading} style={{ minHeight: "48px" }}/>
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
                    <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} style={{ minHeight: "48px" }}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {!isSignUp && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                />
                <Label htmlFor="remember-me" className="cursor-pointer text-sm">Se souvenir de moi</Label>
              </div>
            )}
            <Button type="submit" size="lg" className="w-full min-h-[48px]" disabled={isLoading}>
              {isLoading ? "Chargement..." : (isSignUp ? "S'inscrire" : "Se connecter")}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          {isSignUp ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}
          <Button
            variant="link"
            className="pl-2"
            onClick={() => {
              setIsSignUp(!isSignUp);
              form.reset();
            }}
          >
            {isSignUp ? "Se connecter" : "S'inscrire"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
