
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db, firebaseApp } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, onSnapshot, collection, query, where, orderBy, Timestamp } from "firebase/firestore";
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
    description: string;
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
    }, (error) => {
      console.error("Error fetching user data:", error);
      setLoadingInitial(false);
    });

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

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

  const handleExchange = async (rewardId: string, rewardTitle: string) => {
    setRedeemingStates(prev => ({ ...prev, [rewardId]: true }));
    try {
        await redeemReward({ rewardId: rewardId });
        toast({
            title: "Échange réussi !",
            description: `Vos points ont été utilisés pour "${rewardTitle}".`
        });
    } catch (error: any) {
        console.error("Erreur lors de l'échange de la récompense:", error);
        toast({
            title: "Échange échoué",
            description: error.message || "Une erreur inconnue est survenue.",
            variant: "destructive"
        });
    } finally {
        setRedeemingStates(prev => ({ ...prev, [rewardId]: false }));
    }
  };
  
  const filteredRewards = useMemo(() => {
    if (!userData || !rewards) {
      return rewards || [];
    }
    return rewards.filter(reward => {
      if (userData.membershipLevel === 'privilege') {
        return true; 
      }
      return reward.requiredLevel === 'essentiel';
    });
  }, [userData, rewards]);

  if (loadingInitial) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-32 w-full md:w-1/2" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (!user) {
    return (
      <Card className="text-center p-8">
        <CardTitle>Accès non autorisé</CardTitle>
        <CardDescription className="mt-2">Veuillez vous connecter pour accéder à vos récompenses.</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Mes Récompenses</h1>
        <p className="text-lg text-muted-foreground">Suivez vos points et échangez-les contre des avantages exclusifs.</p>
      </div>

      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-4">
                <Gift className="h-8 w-8" />
                <span>Votre Solde Actuel</span>
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-6xl font-bold">{userData?.loyaltyPoints?.toLocaleString("fr-FR") ?? 0}</p>
            <p className="text-primary-foreground/80 mt-1">points</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Échanger mes points</h2>
        {loadingRewards && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="flex flex-col">
                        <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                        <CardContent className="flex-grow"><Skeleton className="h-4 w-full" /></CardContent>
                        <CardFooter><Skeleton className="h-12 w-full" /></CardFooter>
                    </Card>
                ))}
            </div>
        )}

        {errorRewards && (
            <Card className="md:col-span-3 bg-destructive/10 border-destructive">
                <CardContent className="p-6 text-center text-destructive flex flex-col items-center gap-2">
                    <AlertTriangle />
                    <p className="font-semibold">Erreur lors du chargement des récompenses</p>
                    <p className="text-sm">{errorRewards.message}</p>
                </CardContent>
            </Card>
        )}

        {!loadingRewards && !errorRewards && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRewards.length > 0 ? filteredRewards.map(reward => (
                    <Card key={reward.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{reward.title}</CardTitle>
                            <CardDescription className="pt-2">{reward.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-center gap-2 font-semibold text-accent text-lg">
                           <Coins />
                           {reward.pointsCost.toLocaleString("fr-FR")} points
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full min-h-[48px]"
                                disabled={!userData || userData.loyaltyPoints < reward.pointsCost || redeemingStates[reward.id]}
                                onClick={() => handleExchange(reward.id, reward.title)}
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
