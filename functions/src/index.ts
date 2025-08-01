import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { smartConciergeAssistantFlow } from "./ai/smart-concierge-assistant";

if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Cloud Function to generate partner suggestions for a concierge request.
 */
export const generateSuggestions = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be authenticated to call this function.");
    }
    // In a real app, you'd also check for 'concierge' role here
    // const callerClaims = request.auth.token;
    // if (callerClaims.role !== "concierge") {
    //   throw new HttpsError("permission-denied", "Only concierges can generate suggestions.");
    // }

    const { requestText } = request.data;
    if (!requestText || typeof requestText !== "string") {
        throw new HttpsError("invalid-argument", "The function must be called with a valid 'requestText'.");
    }

    try {
        const result = await smartConciergeAssistantFlow.run({ requestText });
        return result;
    } catch (error) {
        logger.error("Error running smartConciergeAssistantFlow:", error);
        throw new HttpsError("internal", "An unexpected error occurred while generating suggestions.");
    }
});


// Organize exports from other files
export * from "./community";
export * from "./triggers";
