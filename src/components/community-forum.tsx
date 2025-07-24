"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, MessageSquare } from "lucide-react";

// Mock data for forum threads
const forumThreads = [
  {
    id: "1",
    title: "Conseils pour l'entretien du jardin en été ?",
    authorName: "Marie Dubois",
    createdAt: new Date("2024-07-20T10:00:00Z"),
    replyCount: 5,
  },
  {
    id: "2",
    title: "Meilleure assurance voyage pour les seniors",
    authorName: "Pierre Martin",
    createdAt: new Date("2024-07-19T15:30:00Z"),
    replyCount: 12,
  },
  {
    id: "3",
    title: "Idées de rénovation pour une petite salle de bain",
    authorName: "Sophie Lambert",
    createdAt: new Date("2024-07-18T09:00:00Z"),
    replyCount: 8,
  },
];

export function CommunityForum() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            La Communauté
          </h1>
          <p className="text-lg text-muted-foreground">
            Échangez, partagez des conseils et entraidez-vous.
          </p>
        </div>
        <Link href="/communaute/nouveau" passHref>
          <Button size="lg" className="min-h-[48px]">
            <PlusCircle className="mr-2" />
            Lancer une nouvelle discussion
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {forumThreads.map((thread) => (
          <Link
            key={thread.id}
            href={`/communaute/fil/${thread.id}`}
            className="block"
          >
            <Card className="cursor-pointer transition-all hover:border-primary hover:bg-muted/30">
              <CardContent className="flex items-center gap-6 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{thread.title}</h3>
                  <p className="text-muted-foreground">
                    Par {thread.authorName} -{" "}
                    {new Date(thread.createdAt).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{thread.replyCount}</div>
                  <div className="text-sm text-muted-foreground">réponses</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
