import { defineFlow } from "@genkit-ai/flow";
import { z } from "zod";
import * as admin from "firebase-admin";
import { googleAI } from "@genkit-ai/googleai";

const SuggestionSchema = z.object({
  partnerName: z.string().describe("Le nom exact du partenaire suggéré."),
  justification: z.string().describe("La raison pour laquelle ce partenaire est une bonne suggestion pour la demande."),
});

if (!admin.apps.length) {
  admin.initializeApp();
}

export const smartConciergeAssistantFlow = defineFlow(
  {
    name: "smartConciergeAssistant",
    inputSchema: z.object({ requestText: z.string() }),
    outputSchema: z.object({ suggestions: z.array(SuggestionSchema) }),
  },
  async ({ requestText }) => {
    const partnersSnapshot = await admin.firestore().collection("partners").get();
    let partnersList = "";
    partnersSnapshot.forEach(doc => {
      const data = doc.data();
      partnersList += `- ${data.name}: ${data.description}
`;
    });

    if (partnersSnapshot.empty) {
        return { suggestions: [] };
    }

    const prompt = \`
      Tu es un assistant expert pour un service de conciergerie de luxe.
      Ta tâche est de recommander les partenaires les plus pertinents pour répondre à la demande d'un membre.
      Voici la demande du membre :
      ---
      "${requestText}"
      ---
      Voici la liste des partenaires disponibles :
      ---
      ${partnersList}
      ---
      Analyse la demande et suggère 1 à 3 partenaires qui pourraient y répondre.
      Pour chaque suggestion, fournis le nom exact du partenaire et une brève justification.
      Ne suggère que des partenaires de la liste. Si aucun ne correspond, retourne une liste vide.
    \`;

    const llmResponse = await googleAI().generate({
      prompt: prompt,
      output: {
        schema: z.object({
          suggestions: z.array(SuggestionSchema),
        }),
      },
    });

    return llmResponse.output() || { suggestions: [] };
  }
);
