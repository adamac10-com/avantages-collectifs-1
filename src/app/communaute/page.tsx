"use client";

import React from 'react';
import Link from 'next/link';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, MessageSquarePlus, MessageSquareText } from 'lucide-react';

/**
 * Formatte un objet Timestamp de Firestore en une chaîne de date lisible.
 * @param timestamp L'objet Timestamp de Firestore.
 * @returns Une chaîne comme "le 24/05/2024".
 */
const formatDate = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return '';
  return `le ${timestamp.toDate().toLocaleDateString('fr-FR')}`;
};

/**
 * Page principale du forum de la communauté.
 * Affiche la liste des discussions depuis Firestore, triées par date de création.
 */
export default function CommunityPage() {
  // 3. Définir la requête Firestore pour les posts de la communauté
  const postsCollectionRef = collection(db, 'community_posts');
  // 4. Trier les documents par date de création, du plus récent au plus ancien
  const postsQuery = query(postsCollectionRef, orderBy('createdAt', 'desc'));

  const [postsSnapshot, loading, error] = useCollection(postsQuery);

  // 5. Gérer l'état de chargement en affichant des squelettes
  const renderSkeletons = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );

  // Gérer l'état d'erreur
  if (error) {
    console.error("Erreur de chargement des discussions:", error);
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>
            Impossible de récupérer les discussions du forum. Veuillez vérifier les règles de sécurité Firestore et votre connexion.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forum de la communauté</h1>
          <p className="text-muted-foreground mt-1">
            Échangez avec d'autres membres et partagez vos expériences.
          </p>
        </div>
        {/* 8. Bouton pour démarrer une nouvelle discussion */}
        <Link href="/communaute/nouveau" passHref>
          <Button>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Démarrer une discussion
          </Button>
        </Link>
      </div>

      {loading ? (
        renderSkeletons()
      ) : (
        <div className="space-y-4">
          {/* 6. Afficher les discussions si elles existent */}
          {postsSnapshot && postsSnapshot.docs.length > 0 ? (
            postsSnapshot.docs.map((doc) => {
              const post = doc.data();
              return (
                // 7. Chaque carte est un lien vers la discussion détaillée
                <Link key={doc.id} href={`/communaute/fil/${doc.id}`} passHref>
                  <Card className="hover:bg-accent hover:border-primary/50 transition-colors duration-200 cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <MessageSquareText className="h-5 w-5 text-primary" />
                        <span>{post.title}</span>
                      </CardTitle>
                      <CardDescription className="pt-2">
                        Par {post.authorName} • {formatDate(post.createdAt)}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-xl font-semibold">Aucune discussion pour le moment</h3>
                <p className="text-muted-foreground mt-2">
                  Soyez le premier à lancer un sujet !
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
