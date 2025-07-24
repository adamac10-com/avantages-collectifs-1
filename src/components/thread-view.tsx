
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";

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
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle } from "lucide-react";
import { memberData, setMemberData } from "@/lib/member-data";

// Mock data
const threadData = {
  id: "1",
  title: "Conseils pour l'entretien du jardin en été ?",
  posts: [
    {
      id: "post1",
      authorName: "Marie Dubois",
      authorAvatar: "https://placehold.co/100x100.png",
      createdAt: new Date("2024-07-20T10:00:00Z"),
      content:
        "Bonjour à tous, l'été est là et mon jardin commence à souffrir de la chaleur. Avez-vous des astuces ou des conseils pour garder mes plantes en bonne santé sans gaspiller trop d'eau ? Merci d'avance !",
    },
    {
      id: "post2",
      authorName: "Jean Dupont",
      authorAvatar: "https://placehold.co/100x100.png",
      createdAt: new Date("2024-07-20T11:30:00Z"),
      content:
        "Excellente question, Marie ! Je vous conseille d'installer un paillage au pied de vos plantes. Ça conserve l'humidité et ça limite les mauvaises herbes. Les copeaux de bois ou la paille fonctionnent très bien.",
    },
    {
      id: "post3",
      authorName: "Claire Lefebvre",
      authorAvatar: "https://placehold.co/100x100.png",
      createdAt: new Date("2024-07-20T14:00:00Z"),
      content:
        "Pensez aussi à arroser tôt le matin ou tard le soir pour éviter l'évaporation. Un arrosage moins fréquent mais plus abondant est souvent plus efficace.",
    },
  ],
};

const replyFormSchema = z.object({
  reply: z.string().min(10, {
    message: "Votre réponse doit contenir au moins 10 caractères.",
  }),
});

function FormattedDate({ date }: { date: Date }) {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setFormattedDate(
      new Date(date).toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    );
  }, [date]);

  return <>{formattedDate}</>;
}


export function ThreadView({ threadId }: { threadId: string }) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof replyFormSchema>>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      reply: "",
    },
  });

  function onReplySubmit(values: z.infer<typeof replyFormSchema>) {
    // In a real app, this would submit to Firestore
    console.log("New reply:", values.reply);

    // Simulate loyalty points logic
    const pointsAwarded = 10;
    setMemberData({ loyaltyPoints: memberData.loyaltyPoints + pointsAwarded });
    
    // Simulate transaction log
    console.log("TRANSACTION LOG:", {
      userId: "current_user_id", // Replace with actual user ID
      type: "points_earned",
      points: pointsAwarded,
      description: "Participation au forum communautaire",
      timestamp: new Date().toISOString(),
    });

    toast({
      title: "Réponse publiée !",
      description: `Merci pour votre contribution. Vous avez gagné ${pointsAwarded} points de fidélité !`,
    });
    form.reset();
  }

  function handleReport(postId: string) {
    toast({
      title: "Message signalé",
      description:
        "Merci. Votre signalement a été transmis à l'équipe de modération.",
    });
    console.log(`Post ${postId} reported.`); // To be implemented
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        {threadData.title}
      </h1>

      <div className="space-y-6">
        {threadData.posts.map((post, index) => (
          <Card key={post.id} className={index === 0 ? "border-primary" : ""}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={post.authorAvatar} alt={post.authorName} data-ai-hint="person portrait" />
                  <AvatarFallback>
                    {post.authorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-lg">{post.authorName}</p>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground">
                        <FormattedDate date={post.createdAt} />
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReport(post.id)}
                        aria-label="Signaler ce message"
                        className="h-auto px-2 py-1 text-muted-foreground hover:text-destructive"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" /> Signaler
                      </Button>
                    </div>
                  </div>
                  <div className="prose prose-lg max-w-none text-foreground mt-2">
                    {post.content}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Votre réponse</h2>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onReplySubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="reply"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Partagez votre expérience ou vos conseils ici..."
                        className="min-h-[150px] text-base"
                        {...field}
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
                >
                  Publier ma réponse
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
