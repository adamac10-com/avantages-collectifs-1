"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db, firebaseApp } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Coins, Gift } from "lucide-react";

// Interfaces pour la robustesse des types
interface UserData {
  loyaltyPoints: number;
}
interface Reward {
    id: string; 
    title: string;
    description: string;
    pointsCost: number;
}

export function RewardsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  // L'état `requestingStates` gère le chargement de chaque bouton individuellement
  const [requestingStates, setRequestingStates] = useState<{[key: string]: boolean}>({});

  const functions = getFunctions(firebaseApp);
  // Référence à la NOUVELLE Cloud Function
  const requestRewardExchange = httpsCallable(functions, 'requestRewardExchange');

  const rewardsQuery = query(collection(db, "rewards"), orderBy("pointsCost", "asc"));
  const [rewards, loadingRewards, errorRewards] = useCollectionData<Reward>(rewardsQuery, {
    idField: 'id',
  });

  useEffect(() => {
    if (!user) {
      setLoadingUser(false);
      return;
    }
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data() as UserData);
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Étape 2 : Mise à jour de la fonction `handleExchange`
  const handleExchange = async (reward: Reward) => {
    setRequestingStates(prev => ({ ...prev, [reward.id]: true }));
    try {
      // Appel à la nouvelle Cloud Function
      await requestRewardExchange({ rewardId: reward.id });
      // Affichage du nouveau toast de succès
      toast({
        title: "Demande envoyée !",
        description: "Votre demande d'échange a été envoyée. Votre concierge va la traiter rapidement."
      });
    } catch (error: any) {
      toast({
        title: "Échec de la demande",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive"
      });
    } finally {
      setRequestingStates(prev => ({ ...prev, [reward.id]: false }));
    }
  };

  if (loadingUser || loadingRewards) {
    return <div>Chargement de votre espace récompenses...</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gift /> Votre Solde</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{userData?.loyaltyPoints?.toLocaleString() ?? 0} points</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards?.map(reward => (
          <Card key={reward.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{reward.title}</CardTitle>
              <CardDescription>{reward.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="font-bold text-lg flex items-center gap-2">
                <Coins className="text-yellow-500" /> {reward.pointsCost.toLocaleString()} points
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={!userData || userData.loyaltyPoints < reward.pointsCost || requestingStates[reward.id]}
                onClick={() => handleExchange(reward)}
              >
                {requestingStates[reward.id] ? "Envoi en cours..." : "Demander l'échange"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
