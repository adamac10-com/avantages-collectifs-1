
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

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
