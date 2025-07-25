"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Gift, MessageSquare } from "lucide-react";
import { memberData } from "@/lib/member-data"; // Keep for notifications for now
import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "./ui/skeleton";

interface UserData {
  loyaltyPoints: number;
}

export function MemberDashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data() as UserData);
      } else {
        // Handle case where user document might not exist yet
        setUserData({ loyaltyPoints: 0 });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const welcomeMessage = user ? `Bonjour, ${user.displayName || "Membre"} !` : "Bonjour !";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {welcomeMessage}
        </h1>
        <p className="text-lg text-muted-foreground">
          Ravis de vous revoir. Voici un aperçu de votre espace membre.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Main Action: Contact Concierge */}
        <Card className="flex flex-col items-center justify-center p-6 text-center md:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">Besoin d'aide ?</CardTitle>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="h-16 w-full max-w-xs text-lg" disabled={!user}>
              <MessageSquare className="mr-3 h-6 w-6" />
              Contacter mon Concierge
            </Button>
          </CardContent>
        </Card>

        {/* Loyalty Points */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              Points de Fidélité
            </CardTitle>
            <Gift className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-28" />
            ) : user ? (
              <div className="text-4xl font-bold text-primary">
                {(userData?.loyaltyPoints ?? 0).toLocaleString("fr-FR")}
              </div>
            ) : (
               <div className="text-4xl font-bold text-primary">0</div>
            )}
            <p className="pt-2 text-sm text-muted-foreground">
              Continuez à utiliser nos services pour en gagner plus.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Vos notifications</h2>
        <div className="grid gap-4">
          {memberData.notifications.map((notif) => (
            <Card key={notif.id}>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{notif.title}</h3>
                  <p className="text-muted-foreground">{notif.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {memberData.notifications.length === 0 && (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Aucune nouvelle notification pour le moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
