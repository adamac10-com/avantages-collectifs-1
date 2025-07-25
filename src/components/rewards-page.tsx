
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, orderBy, Timestamp } from "firebase/firestore";
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

interface UserData {
  loyaltyPoints: number;
}

interface Transaction {
  id: string;
  description: string;
  points: number;
  timestamp: Timestamp;
}

const rewards = [
    {
      id: "reward1",
      title: "Chèque-cadeau de 10€",
      cost: 1000,
    },
    {
      id: "reward2",
      title: "Service de jardinage (1h)",
      cost: 2500,
    },
    {
      id: "reward3",
      title: "Consultation Rénovation",
      cost: 1500,
    },
     {
      id: "reward4",
      title: "Billet de Cinéma",
      cost: 750,
    },
];

export function RewardsPage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    setLoading(true);

    const userDocRef = doc(db, "users", user.uid);
    const userUnsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data() as UserData);
      }
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
      setLoading(false);
    });

    return () => {
      userUnsubscribe();
      transactionsUnsubscribe();
    };
  }, [user]);

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
            {rewards.map(reward => (
                <Card key={reward.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{reward.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 pt-2 font-semibold text-accent text-lg">
                           <Coins />
                           {reward.cost.toLocaleString("fr-FR")} points
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        {/* Placeholder for reward description */}
                    </CardContent>
                    <CardFooter>
                         <Button className="w-full min-h-[48px]" disabled>
                            Échanger
                         </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
