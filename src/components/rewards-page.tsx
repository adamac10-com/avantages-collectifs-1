
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db, firebaseApp } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, onSnapshot, collection, query, orderBy, Timestamp, where } from "firebase/firestore";
import { useCollectionData } from "react-firebase-hooks/firestore";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Coins, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  loyaltyPoints: number;
  membershipLevel: 'essentiel' | 'privilege';
}

interface Transaction {
  id: string;
  description: string;
  points: number;
  timestamp: Timestamp;
}

interface Reward {
    id: string;
    title: string;
    description:string;
    pointsCost: number;
    requiredLevel: 'essentiel' | 'privilege';
}

export function RewardsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [redeemingStates, setRedeemingStates] = useState<{[key: string]: boolean}>({});

  const functions = getFunctions(firebaseApp);
  const redeemReward = httpsCallable(functions, 'redeemReward');

  const rewardsQuery = query(collection(db, "rewards"), orderBy("pointsCost", "asc"));
  const [rewards, loadingRewards, errorRewards] = useCollectionData<Reward>(rewardsQuery, {
    idField: 'id',
  });

  useEffect(() => {
    if (!user) {
        setLoadingInitial(false);
        return;
    }

    setLoadingInitial(true);

    const userDocRef = doc(db, "users", user.uid);
    const userUnsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData({
            loyaltyPoints: data.loyaltyPoints || 0,
            membershipLevel: data.membershipLevel || 'essentiel'
        });
      }
      setLoadingInitial(false);
    });

    const transactionsQuery = query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
    const transactionsUnsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const newTransactions = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Transaction)
      );
      setTransactions(newTransactions);
    });

    return () => {
      userUnsubscribe();
      transactionsUnsubscribe();
    };
  }, [user]);

  const handleExchange = async (reward: Reward) => {
    if (!user) return;
    setRedeemingStates(prev => ({ ...prev, [reward.id]: true }));
    try {
        await redeemReward({ rewardId: reward.id });
        toast({
            title: "Échange réussi !",
            description: `Vos points ont été utilisés pour "${reward.title}".`
        });
    } catch (error: any) {
        console.error("Erreur lors de l'échange de la récompense:", error);
        toast({
            title: "Échange échoué",
            description: error.message || "Une erreur inconnue est survenue.",
            variant: "destructive"
        });
    } finally {
        setRedeemingStates(prev => ({ ...prev, [reward.id]: false }));
    }
  };
  
  const displayedRewards = useMemo(() => {
    // Attendre que les données de l'utilisateur ET les récompenses soient chargées.
    if (!userData || !rewards) {
      return [];
    }
    // Afficher les récompenses 'essentiel' plus celles du niveau de l'utilisateur.
    return rewards.filter(
      (reward) =>
        reward.requiredLevel === "essentiel" ||
        reward.requiredLevel === userData.membershipLevel
    );
  }, [userData, rewards]);

  if (loadingInitial) {
    return (
        <div className="space-y-8 p-4 md:p-8">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-32 w-full md:w-1/2" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="text-center p-8">
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription className="mt-2">Veuillez vous connecter pour accéder à vos récompenses.</CardDescription>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Mes Récompenses</h1>
        <p className="text-lg text-muted-foreground">Suivez vos points et échangez-les contre des avantages exclusifs.</p>
      </div>

      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Votre Solde</CardTitle>
            <Gift className="h-6 w-6 text-accent" />
        </CardHeader>
        <CardContent>
            <div className="text-4xl font-bold">
            {(userData?.loyaltyPoints ?? 0).toLocaleString("fr-FR")}
            </div>
            <p className="pt-2 text-sm text-primary-foreground/80">
                Points disponibles pour des récompenses exclusives.
            </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Échanger mes points</h2>
        </div>
        
        {loadingRewards && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" />
            </div>
        )}

        {errorRewards && (
            <Card className="md:col-span-3 bg-destructive/10 border-destructive">
                <CardHeader className="flex flex-row items-center gap-4">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <div>
                        <CardTitle className="text-destructive">Erreur de chargement</CardTitle>
                        <CardDescription className="text-destructive/80">
                            Impossible de charger les récompenses disponibles. Veuillez réessayer plus tard.
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>
        )}

        {!loadingRewards && !errorRewards && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedRewards.length > 0 ? displayedRewards.map(reward => (
                    <Card key={reward.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{reward.title}</CardTitle>
                            <CardDescription className="pt-2">{reward.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-center gap-2 font-semibold text-primary text-lg">
                           <Coins />
                           {reward.pointsCost.toLocaleString("fr-FR")} points
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full"
                                style={{ minHeight: "48px" }}
                                disabled={!userData || userData.loyaltyPoints < reward.pointsCost || redeemingStates[reward.id]}
                                onClick={() => handleExchange(reward)}
                            >
                                {redeemingStates[reward.id] ? "Échange en cours..." : "Échanger"}
                            </Button>
                        </CardFooter>
                    </Card>
                )) : (
                    <Card className="md:col-span-3">
                        <CardContent className="p-10 text-center text-muted-foreground">
                            <p>Aucune récompense n'est actuellement disponible.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Historique des transactions</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell>{tx.timestamp.toDate().toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="text-right">
                         <Badge variant={tx.points >= 0 ? "secondary" : "destructive"}>
                           {tx.points > 0 ? `+${tx.points}` : tx.points}
                         </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Aucune transaction pour le moment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
