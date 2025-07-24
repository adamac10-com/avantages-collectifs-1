
"use strict";

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const completeServiceRequest = functions.https.onCall(async (data, context) => {
    // 1. Security Check: Ensure the user is authenticated.
    // In a real app, we would also check for a 'concierge' custom claim.
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const { requestId } = data;
    if (!requestId || typeof requestId !== "string") {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with a valid 'requestId'."
        );
    }

    const requestRef = db.collection("conciergeRequests").doc(requestId);
    const pointsToAward = 50;

    try {
        await db.runTransaction(async (transaction) => {
            const requestDoc = await transaction.get(requestRef);

            if (!requestDoc.exists) {
                throw new Error("Request document not found!");
            }

            const requestData = requestDoc.data();
            if (!requestData || !requestData.memberId) {
                throw new Error("Request data is missing memberId!");
            }

            // If the request is already completed, do nothing.
            if (requestData.status === "Terminé") {
                console.log(`Request ${requestId} is already completed.`);
                return;
            }

            // 2. Update Request Status
            transaction.update(requestRef, { status: "Terminé" });

            // 3. Award Loyalty Points
            const memberRef = db.collection("users").doc(requestData.memberId);
            transaction.update(memberRef, {
                loyaltyPoints: admin.firestore.FieldValue.increment(pointsToAward),
            });
            
            // 4. Log Transaction
            const transactionRef = db.collection("transactions").doc();
            transaction.set(transactionRef, {
                userId: requestData.memberId,
                type: "service_partner_validation",
                points: pointsToAward,
                description: `Validation service: ${requestData.serviceName || "N/A"}`,
                requestId: requestId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                validatedBy: context.auth.uid,
            });
        });

        console.log(`Successfully completed request ${requestId} and awarded ${pointsToAward} points.`);
        return { success: true, message: "Request completed successfully." };

    } catch (error) {
        console.error("Transaction failed: ", error);
        throw new functions.https.HttpsError(
            "internal",
            "An error occurred while completing the request."
        );
    }
});
