
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, orderBy, Timestamp, getDocs } from "firebase/firestore";
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
import { Gift, Coins } from "lucide-react";
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
    pointsCost: number;
    requiredLevel: 'essentiel' | 'privilege';
}

export function RewardsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    setLoading(true);

    // Fetch User Data
    const userDocRef = doc(db, "users", user.uid);
    const userUnsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        // Set default membershipLevel if not present
        const data = doc.data();
        setUserData({
            loyaltyPoints: data.loyaltyPoints || 0,
            membershipLevel: data.membershipLevel || 'essentiel'
        });
      }
    });

    // Fetch Transactions
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
      setLoading(false);
    });

    // Fetch Rewards
    const fetchRewards = async () => {
        try {
            const rewardsCol = collection(db, "rewards");
            const rewardsSnapshot = await getDocs(rewardsCol);
            const rewardsList = rewardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
            setRewards(rewardsList);
        } catch (error) {
            console.error("Error fetching rewards:", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger le catalogue des récompenses.",
                variant: "destructive"
            });
        }
    }

    fetchRewards();


    return () => {
      userUnsubscribe();
      transactionsUnsubscribe();
    };
  }, [user, toast]);

  const handleExchange = (reward: Reward) => {
      // This is where the logic to exchange points would go.
      // For now, it just shows a toast.
      toast({
          title: "Échange en cours...",
          description: `Vous avez demandé à échanger ${reward.pointsCost} points contre "${reward.title}".`
      })
  }

  const filteredRewards = userData ? rewards.filter(reward => {
      if (userData.membershipLevel === 'privilege') {
          return true; // Privilège members see all rewards
      }
      return reward.requiredLevel === 'essentiel'; // Essentiel members see only essentiel rewards
  }) : [];


  if (loading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-32 w-full md:w-1/2" />
            <Skeleton className="h-64 w-full" />
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
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Mes Récompenses
        </h1>
        <p className="text-lg text-muted-foreground">
          Suivez vos points et échangez-les contre des avantages exclusifs.
        </p>
      </div>

      {/* Loyalty Points Balance */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-4">
             <Gift className="h-8 w-8" />
             <span>Votre Solde Actuel</span>
          </CardTitle>
           <CardDescription className="text-primary-foreground/80 pt-1">
            Niveau d'adhésion : <span className="font-bold capitalize">{userData?.membershipLevel}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-6xl font-bold">
                {userData?.loyaltyPoints.toLocaleString("fr-FR") ?? 0}
            </p>
            <p className="text-primary-foreground/80 mt-1">points</p>
        </CardContent>
      </Card>

      {/* Transactions History */}
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
                      <TableCell>{tx.timestamp.toDate().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric"})}</TableCell>
                      <TableCell className="text-right">
                         <Badge variant={tx.points > 0 ? "secondary" : "destructive"}>
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

      {/* Rewards Catalog */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Échanger mes points</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map(reward => (
                <Card key={reward.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{reward.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 pt-2 font-semibold text-accent text-lg">
                           <Coins />
                           {reward.pointsCost.toLocaleString("fr-FR")} points
                        </CardDescription>
                         {reward.requiredLevel === 'privilege' && (
                          <Badge variant="outline" className="mt-2 w-fit border-accent text-accent">Exclusivité Privilège</Badge>
                        )}
                    </CardHeader>
                    <CardContent className="flex-grow">
                        {/* Placeholder for reward description */}
                    </CardContent>
                    <CardFooter>
                         <Button 
                            className="w-full min-h-[48px]"
                            disabled={!userData || userData.loyaltyPoints < reward.pointsCost}
                            onClick={() => handleExchange(reward)}
                         >
                            Échanger
                         </Button>
                    </CardFooter>
                </Card>
            ))}
             {filteredRewards.length === 0 && !loading && (
                <Card className="md:col-span-3">
                    <CardContent className="p-10 text-center text-muted-foreground">
                        <p>Aucune récompense disponible pour votre niveau d'adhésion pour le moment.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
