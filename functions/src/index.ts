import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialisation de l'admin Firebase pour accéder à la base de données
try {
  admin.initializeApp();
} catch (e) {
  logger.info("Firebase admin already initialized.");
}
const db = admin.firestore();


export const completeServiceRequest = onCall(async (request) => {
  // 1. Vérification que l'utilisateur est authentifié
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "La fonction doit être appelée par un utilisateur authentifié.",
    );
  }

  // 2. Vérification que l'utilisateur a le rôle de "Concierge" (sécurité)
  // eslint-disable-next-line max-len
  // Note : Cette partie suppose que vous avez un champ 'role' sur l'utilisateur.
  // Nous la laissons en commentaire pour l'instant pour ne pas bloquer.
  // const userRole = request.auth.token.role;
  // if (userRole !== "concierge") {
  //   throw new HttpsError(
  //       "permission-denied",
  //       "Seul un concierge peut exécuter cette action.",
  //   );
  // }

  const {requestId} = request.data;
  if (!requestId || typeof requestId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "La fonction doit être appelée avec un 'requestId' valide.",
    );
  }

  logger.info(`Traitement de la demande ${requestId} par ${request.auth.uid}`);

  try {
    const requestRef = db.collection("conciergeRequests").doc(requestId);
    // eslint-disable-next-line max-len
    const userRef = db.collection("users").doc(request.auth.uid); // Ceci est l'ID du concierge
    // eslint-disable-next-line max-len
    // Utilisation d'une transaction pour garantir que toutes les opérations réussissent ou échouent ensemble
    await db.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) {
        throw new HttpsError("not-found", "La demande n'a pas été trouvée.");
      }

      const memberId = requestDoc.data()?.memberId;
      if (!memberId) {
        // eslint-disable-next-line max-len
        throw new HttpsError("internal", "L'ID du membre est manquant dans la demande.");
      }
      const memberRef = db.collection("users").doc(memberId);

      // eslint-disable-next-line max-len
      // Mettre à jour la demande, les points du membre, et créer une transaction
      transaction.update(requestRef, {status: "Terminé", validatedBy: userRef});
      transaction.update(memberRef, {
        loyaltyPoints: admin.firestore.FieldValue.increment(50),
      });
      const transactionRef = db.collection("transactions").doc();
      transaction.set(transactionRef, {
        userId: memberId,
        type: "service_reward",
        points: 50,
        description: `Récompense pour la demande de service ${requestId}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return {success: true, message: "La demande a été validée avec succès."};
  } catch (error) {
    logger.error("Erreur lors de la validation de la demande :", error);
    // eslint-disable-next-line max-len
    // Renvoyer l'erreur originale si c'est une HttpsError, sinon une erreur interne
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Une erreur interne est survenue.");
  }
});


export const redeemReward = onCall(async (request) => {
  // 1. Vérification de l'authentification
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Vous devez être connecté pour échanger une récompense.",
    );
  }

  const userId = request.auth.uid;
  const {rewardId} = request.data;
  if (!rewardId || typeof rewardId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "L'ID de la récompense est manquant ou invalide.",
    );
  }

  logger.info(`Tentative d'échange de la récompense ${rewardId} par l'utilisateur ${userId}`);

  const userRef = db.collection("users").doc(userId);
  const rewardRef = db.collection("rewards").doc(rewardId);

  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const rewardDoc = await transaction.get(rewardRef);

      if (!userDoc.exists) {
        throw new HttpsError("not-found", "Utilisateur non trouvé.");
      }
      if (!rewardDoc.exists) {
        throw new HttpsError("not-found", "Récompense non trouvée.");
      }

      const userData = userDoc.data();
      const rewardData = rewardDoc.data();
      const userPoints = userData?.loyaltyPoints || 0;
      const rewardCost = rewardData?.pointsCost || 0;

      // 2. Vérification du solde de points
      if (userPoints < rewardCost) {
        throw new HttpsError(
          "failed-precondition",
          "Vos points sont insuffisants pour cette récompense.",
        );
      }

      // 3. Déduction des points et création de la transaction
      const newPoints = userPoints - rewardCost;
      transaction.update(userRef, {loyaltyPoints: newPoints});

      const transactionRef = db.collection("transactions").doc();
      transaction.set(transactionRef, {
        userId: userId,
        type: "reward_redemption",
        points: -rewardCost,
        description: `Échange: ${rewardData?.title || "Récompense"}`,
        rewardId: rewardId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Récompense ${rewardId} échangée avec succès par ${userId}.`);
    });

    return {success: true, message: "Récompense échangée avec succès !"};
  } catch (error) {
    logger.error(`Échec de l'échange pour ${userId} et récompense ${rewardId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Une erreur interne est survenue lors de l'échange.");
  }
});
