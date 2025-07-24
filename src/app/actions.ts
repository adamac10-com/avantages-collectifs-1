
"use server";

import {
  smartConciergeAssistant,
  type SmartConciergeAssistantInput,
  type SmartConciergeAssistantOutput,
} from "@/ai/flows/smart-concierge-assistant";

export async function getAiSuggestions(
  input: SmartConciergeAssistantInput
): Promise<SmartConciergeAssistantOutput> {
  try {
    const result = await smartConciergeAssistant(input);
    return result;
  } catch (error) {
    console.error("Error calling smartConciergeAssistant flow:", error);
    throw new Error(
      "Une erreur est survenue lors de la communication avec l'assistant IA."
    );
  }
}
