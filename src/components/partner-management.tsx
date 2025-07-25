
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  Unsubscribe,
} from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { Partner } from "@/types/partner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PartnerForm } from "@/components/partner-form";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, ShieldQuestion } from "lucide-react";

interface UserData {
  role?: string;
}

export function PartnerManagement() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const isConcierge = userData?.role === "concierge";

  useEffect(() => {
    let unsubscribePartners: Unsubscribe | undefined;
    let unsubscribeUser: Unsubscribe | undefined;

    if (user) {
      // Fetch user role
      const userDocRef = doc(db, "users", user.uid);
      unsubscribeUser = onSnapshot(userDocRef, (doc) => {
        setUserData(doc.data() as UserData);
        // We can set loading to false after we know the user's role
        setLoading(authLoading);
      });

      // Fetch partners
      const partnersQuery = collection(db, "partners");
      unsubscribePartners = onSnapshot(partnersQuery, (snapshot) => {
        const partnersData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Partner)
        );
        setPartners(partnersData);
      });
    } else if (!authLoading) {
      setLoading(false);
    }

    return () => {
      if (unsubscribePartners) unsubscribePartners();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [user, authLoading]);

  const handleDelete = async (partnerId: string) => {
    try {
      await deleteDoc(doc(db, "partners", partnerId));
      toast({
        title: "Partenaire supprimé",
        description: "Le partenaire a été retiré de la base de données.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le partenaire.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedPartner(null);
    setIsFormOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isConcierge) {
    return (
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldQuestion className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-2xl">Accès non autorisé</CardTitle>
          <CardDescription>
            Vous devez avoir le rôle de &quot;Concierge&quot; pour accéder à cette page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Gestion des Partenaires
          </h1>
          <p className="text-lg text-muted-foreground">
            Ajoutez, modifiez ou supprimez les partenaires de confiance.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="lg" onClick={handleAdd}>
              <PlusCircle className="mr-2" />
              Ajouter un partenaire
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedPartner ? "Modifier le partenaire" : "Ajouter un nouveau partenaire"}
              </DialogTitle>
            </DialogHeader>
            <PartnerForm
              partner={selectedPartner}
              onSuccess={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom du Partenaire</TableHead>
                <TableHead>Pilier de Service</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length > 0 ? (
                partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.servicePillar}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {partner.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(partner)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                             <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible et supprimera définitivement le partenaire &quot;{partner.name}&quot;.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(partner.id)} className="bg-destructive hover:bg-destructive/90">
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucun partenaire trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
