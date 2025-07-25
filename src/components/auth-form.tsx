
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, setPersistence, browserSessionPersistence, browserLocalPersistence } from "firebase/auth";
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
  name: z.string().optional(),
  email: z.string().email({ message: "Veuillez entrer une adresse e-mail valide." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
});

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(firebaseApp);

  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof authSchema>) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        if (!values.name || values.name.length < 2) {
            form.setError("name", { type: "manual", message: "Le nom doit contenir au moins 2 caractères."});
            setIsLoading(false);
            return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        await updateProfile(userCredential.user, { displayName: values.name });
        toast({
          title: "Inscription réussie !",
          description: "Bienvenue ! Vous allez être redirigé.",
        });
      } else {
        const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistenceType);
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({
          title: "Connexion réussie !",
          description: "Ravi de vous revoir. Vous allez être redirigé.",
        });
      }
      router.push("/");
      router.refresh(); // Force a refresh to update the header
    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage = "Une erreur est survenue.";
      if (errorCode === "auth/email-already-in-use") {
        errorMessage = "Cette adresse e-mail est déjà utilisée.";
      } else if (errorCode === "auth/wrong-password" || errorCode === "auth/user-not-found" || errorCode === "auth/invalid-credential") {
        errorMessage = "E-mail ou mot de passe incorrect.";
      } else if (errorCode === "auth/invalid-email") {
        errorMessage = "L'adresse e-mail n'est pas valide.";
      }
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="items-center">
        <Image 
          src="/logo.png"
          alt="Logo Avantages Collectifs"
          width={180}
          height={45}
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
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Jean Dupont" {...field} disabled={isLoading} style={{ minHeight: "48px" }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
