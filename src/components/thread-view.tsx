
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  doc,
  collection,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { useDocumentData, useCollection } from "react-firebase-hooks/firestore";
import { db, firebaseApp } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, UserCircle } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const replyFormSchema = z.object({
  content: z
    .string()
    .min(10, {
      message: "Votre réponse doit contenir au moins 10 caractères.",
    })
    .max(2000, {
      message: "Votre réponse ne peut pas dépasser 2000 caractères.",
    }),
});

// Helper to format dates
const formatDate = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return "Date inconnue";
  return timestamp.toDate().toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
};

export function ThreadView({ threadId }: { threadId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const functions = getFunctions(firebaseApp);
  const addCommentToPost = httpsCallable(functions, 'addCommentToPost');

  // Get thread data
  const threadRef = doc(db, "community_posts", threadId);
  const [threadData, loadingThread, errorThread] = useDocumentData(threadRef);

  // Get comments data
  const commentsRef = collection(db, "community_posts", threadId, "comments");
  const commentsQuery = query(commentsRef, orderBy("createdAt", "asc"));
  const [commentsSnapshot, loadingComments, errorComments] =
    useCollection(commentsQuery);

  const form = useForm<z.infer<typeof replyFormSchema>>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      content: "",
    },
  });

  async function onReplySubmit(values: z.infer<typeof replyFormSchema>) {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour répondre.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);

    try {
      await addCommentToPost({
        postId: threadId,
        content: values.content,
      });

      toast({
        title: "Réponse publiée !",
        description: "Merci pour votre contribution.",
      });
      form.reset();
    } catch (error: any) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      toast({
        title: "Erreur",
        description:
          error.message || "Une erreur est survenue lors de la publication de votre réponse.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReport(postId: string) {
    // In a real app, this would call a Cloud Function to handle the report.
    console.log(`Reporting post/comment with ID: ${postId}`);
    toast({
      title: "Message signalé",
      description:
        "Merci. Votre signalement a été transmis à notre équipe de modération.",
    });
  }

  if (loadingThread) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (errorThread || !threadData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>
          Impossible de charger cette discussion. Elle n'existe peut-être plus.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Thread Title and Original Post */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight md:text-4xl">
            {threadData.title}
          </CardTitle>
          <CardDescription className="pt-2 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              {threadData.authorAvatar && (
                <AvatarImage
                  src={threadData.authorAvatar}
                  alt={threadData.authorName}
                />
              )}
              <AvatarFallback>
                <UserCircle />
              </AvatarFallback>
            </Avatar>
            <span>
              Par <strong>{threadData.authorName}</strong> •{" "}
              {formatDate(threadData.createdAt)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-lg max-w-none text-foreground">
            {threadData.content}
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">
            {commentsSnapshot?.docs.length || 0} Réponse(s)
        </h2>
        {loadingComments ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          commentsSnapshot?.docs.map((doc) => {
            const comment = doc.data();
            return (
              <Card key={doc.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      {comment.authorAvatar && (
                        <AvatarImage
                          src={comment.authorAvatar}
                          alt={comment.authorName}
                          data-ai-hint="person portrait"
                        />
                      )}
                      <AvatarFallback>
                        {comment.authorName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold">{comment.authorName}</p>
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReport(doc.id)}
                            aria-label="Signaler ce commentaire"
                            className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
                            disabled={!user}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" /> Signaler
                          </Button>
                        </div>
                      </div>
                      <div className="prose max-w-none text-foreground mt-2">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
        {errorComments && (
           <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
                Impossible de charger les commentaires pour cette discussion.
            </AlertDescription>
         </Alert>
        )}
      </div>

      {/* Reply Form */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Votre réponse</h2>
          {user ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onReplySubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Partagez votre expérience ou vos conseils ici..."
                          className="min-h-[150px] text-base bg-background"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    style={{ minHeight: "48px" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Publication..." : "Publier ma réponse"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
             <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Vous devez être connecté</AlertTitle>
                <AlertDescription>
                   Pour participer à la discussion, veuillez vous connecter à votre compte.
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
