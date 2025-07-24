// use server'

/**
 * @fileOverview An AI assistant for concierges to suggest relevant partner services based on member requests.
 *
 * - smartConciergeAssistant - A function that suggests partner services and highlights key details.
 * - SmartConciergeAssistantInput - The input type for the smartConciergeAssistant function.
 * - SmartConciergeAssistantOutput - The return type for the smartConciergeAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartConciergeAssistantInputSchema = z.object({
  memberRequest: z
    .string()
    .describe('The member\s request for assistance.'),
});
export type SmartConciergeAssistantInput = z.infer<typeof SmartConciergeAssistantInputSchema>;

const SmartConciergeAssistantOutputSchema = z.object({
  suggestedServices: z
    .array(z.string())
    .describe('An array of suggested partner services relevant to the member request.'),
  keyDetails: z
    .string()
    .describe(
      'A summary of key details or considerations for the concierge regarding the member request.'
    ),
});
export type SmartConciergeAssistantOutput = z.infer<typeof SmartConciergeAssistantOutputSchema>;

export async function smartConciergeAssistant(
  input: SmartConciergeAssistantInput
): Promise<SmartConciergeAssistantOutput> {
  return smartConciergeAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartConciergeAssistantPrompt',
  input: {schema: SmartConciergeAssistantInputSchema},
  output: {schema: SmartConciergeAssistantOutputSchema},
  prompt: `You are an AI assistant for concierges, helping them provide tailored assistance to members.

  Based on the member's request, suggest relevant partner services from the following categories:
  - Protection & Assurance
  - Habitat & Rénovation
  - Assistance & Quotidien
  - Loisirs & Voyages

  Also, highlight any key details or considerations for the concierge regarding the member's request.

  Member Request: {{{memberRequest}}}

  Format your response as a JSON object with "suggestedServices" (an array of service names) and "keyDetails" (a string).
  `,
});

const smartConciergeAssistantFlow = ai.defineFlow(
  {
    name: 'smartConciergeAssistantFlow',
    inputSchema: SmartConciergeAssistantInputSchema,
    outputSchema: SmartConciergeAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
