
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";

// Initialisation de l'admin Firebase
admin.initializeApp();
const db = admin.firestore();

/**
 * Se déclenche à la création d'un nouvel utilisateur Auth
 * et crée son profil dans la collection 'users' de Firestore.
 */
export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  logger.info(`Création du profil pour le nouvel utilisateur: ${user.uid}`);

  const userRef = db.collection("users").doc(user.uid);

  return userRef.set({
    email: user.email,
    displayName: user.displayName || "Nouveau Membre",
    membershipLevel: "essentiel",
    loyaltyPoints: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

/**
 * Permet à un concierge de valider une demande de service,
 * de la marquer comme "Terminé" et d'attribuer des points au membre.
 */
export const completeServiceRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "La fonction doit être appelée par un utilisateur authentifié.",
    );
  }

  const {requestId} = data;
  if (!requestId || typeof requestId !== "string") {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "La fonction doit être appelée avec un 'requestId' valide.",
    );
  }

  logger.info(`Validation de la demande ${requestId} par ${context.auth.uid}`);

  try {
    const requestRef = db.collection("conciergeRequests").doc(requestId);

    // Utilisation d'une transaction
    await db.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) {
        throw new functions.https.HttpsError("not-found", "La demande n'a pas été trouvée.");
      }

      const memberId = requestDoc.data()?.memberId;
      if (!memberId) {
        throw new functions.https.HttpsError("internal", "L'ID du membre est manquant.");
      }
      const memberRef = db.collection("users").doc(memberId);

      // Vérifier que le document du membre existe avant de le mettre à jour
      const memberDoc = await transaction.get(memberRef);
      if (!memberDoc.exists) {
        throw new functions.https.HttpsError("not-found", `Le profil du membre ${memberId} n'existe pas.`);
      }

      transaction.update(requestRef, {status: "Terminé"});
      transaction.update(memberRef, {
        loyaltyPoints: admin.firestore.FieldValue.increment(50),
      });
      const transactionRef = db.collection("transactions").doc();
      transaction.set(transactionRef, {
        userId: memberId,
        type: "service_reward",
        points: 50,
        description: `Récompense pour la demande ${requestId}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return {success: true, message: "La demande a été validée."};
  } catch (error) {
    logger.error("Erreur lors de la validation :", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "Une erreur interne est survenue.");
  }
});


/**
 * Permet à un utilisateur d'échanger ses points de fidélité contre une récompense.
 */
export const redeemReward = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Vous devez être connecté pour échanger une récompense."
    );
  }

  const { rewardId } = data;
  if (!rewardId || typeof rewardId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Un ID de récompense valide doit être fourni."
    );
  }

  const userId = context.auth.uid;
  logger.info(`Tentative d'échange de la récompense ${rewardId} par l'utilisateur ${userId}`);

  const rewardRef = db.collection("rewards").doc(rewardId);
  const userRef = db.collection("users").doc(userId);

  try {
    await db.runTransaction(async (transaction) => {
      const rewardDoc = await transaction.get(rewardRef);
      if (!rewardDoc.exists) {
        throw new HttpsError("not-found", "La récompense demandée n'existe pas.");
      }

      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "Profil utilisateur introuvable.");
      }

      const reward = rewardDoc.data();
      const user = userDoc.data();
      
      if (!reward || !user) {
         throw new HttpsError("internal", "Données invalides pour la récompense ou l'utilisateur.");
      }

      const pointsCost = reward.pointsCost;
      const userPoints = user.loyaltyPoints;

      if (userPoints < pointsCost) {
        throw new HttpsError(
          "failed-precondition",
          "Points de fidélité insuffisants pour cette récompense."
        );
      }

      // Déduire les points et enregistrer la transaction
      transaction.update(userRef, {
        loyaltyPoints: admin.firestore.FieldValue.increment(-pointsCost),
      });

      const transactionRef = db.collection("transactions").doc();
      transaction.set(transactionRef, {
        userId: userId,
        type: "reward_redemption",
        points: -pointsCost,
        description: `Échange contre: ${reward.title}`,
        rewardId: rewardId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    logger.info(`Échange de la récompense ${rewardId} réussi pour l'utilisateur ${userId}.`);
    return { success: true, message: "Récompense échangée avec succès." };
  } catch (error) {
    logger.error(`Échec de l'échange de la récompense ${rewardId} pour ${userId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Une erreur est survenue lors de l'échange.");
  }
});
