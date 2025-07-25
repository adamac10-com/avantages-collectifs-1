
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
  // Note : Cette partie suppose que vous avez un champ 'role' sur le document utilisateur dans Firestore
  // ou un custom claim. Pour cet exemple, nous allons le commenter.
  // const userDoc = await db.collection('users').doc(request.auth.uid).get();
  // const userRole = userDoc.data()?.role;
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
    
    // Utilisation d'une transaction pour garantir que toutes les opérations réussissent ou échouent ensemble
    await db.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) {
        throw new HttpsError("not-found", "La demande n'a pas été trouvée.");
      }

      // Vérifier si la requête a déjà été traitée
      if (requestDoc.data()?.status === 'Terminé') {
        logger.warn(`La demande ${requestId} a déjà été marquée comme terminée.`);
        // On ne retourne pas d'erreur pour ne pas bloquer le client, mais on logge l'action
        return;
      }

      const memberId = requestDoc.data()?.memberId;
      if (!memberId) {
        throw new HttpsError("internal", "L'ID du membre est manquant dans la demande.");
      }
      const memberRef = db.collection("users").doc(memberId);
      const pointsToAward = 50;

      // Mettre à jour la demande, les points du membre, et créer une transaction
      transaction.update(requestRef, {status: "Terminé", validatedBy: request.auth.uid });
      transaction.update(memberRef, {
        loyaltyPoints: admin.firestore.FieldValue.increment(pointsToAward),
      });

      const transactionRef = db.collection("transactions").doc();
      transaction.set(transactionRef, {
        userId: memberId,
        type: "service_reward",
        points: pointsToAward,
        description: `Récompense pour la demande: ${requestDoc.data()?.serviceDemande || requestId}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return {success: true, message: "La demande a été validée avec succès."};
  } catch (error) {
    logger.error(`Erreur lors de la validation de la demande ${requestId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Une erreur interne est survenue lors du traitement de la demande.");
  }
});
