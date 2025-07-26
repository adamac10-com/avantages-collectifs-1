
import {onCall, HttpsError} from "firebase-functions/v2/https";
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
  logger.info(`[createUserProfile] - Début de la création du profil pour l'utilisateur UID : ${user.uid}`);

  const newUserProfile = {
    uid: user.uid,
    email: user.email || "", 
    displayName: user.displayName || "Nouveau Membre", 
    photoURL: user.photoURL || null, 
    membershipLevel: "essentiel", 
    loyaltyPoints: 0, 
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    role: "member", // Assign default role
  };

  try {
    await db.collection("users").doc(user.uid).set(newUserProfile);
    logger.info(`[createUserProfile] - Profil créé avec succès dans Firestore pour l'utilisateur UID : ${user.uid}`);
  } catch (error) {
    logger.error(`[createUserProfile] - Erreur lors de la création du profil pour l'UID ${user.uid}:`, error);
    throw new functions.https.HttpsError(
      "internal",
      "Une erreur est survenue lors de la création du profil utilisateur."
    );
  }
});

/**
 * Permet à un concierge de valider une demande de service,
 * de la marquer comme "Terminé" et d'attribuer des points au membre.
 */
export const completeServiceRequest = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "La fonction doit être appelée par un utilisateur authentifié.");
    }

    // Pour une sécurité accrue, on vérifierait le rôle du concierge ici aussi.
    // const callerClaims = request.auth.token;
    // if (callerClaims.role !== 'concierge') {
    //     throw new HttpsError('permission-denied', 'Seul un concierge peut valider une demande.');
    // }

    const {requestId} = request.data;
    if (!requestId || typeof requestId !== "string") {
        throw new HttpsError("invalid-argument", "La fonction doit être appelée avec un 'requestId' valide.");
    }

    logger.info(`Validation de la demande ${requestId} par ${request.auth.uid}`);

    try {
        const requestRef = db.collection("conciergeRequests").doc(requestId);

        await db.runTransaction(async (transaction) => {
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists) {
                throw new HttpsError("not-found", "La demande n'a pas été trouvée.");
            }
            
            const requestData = requestDoc.data();
            if (!requestData) {
                throw new HttpsError("not-found", "Les données de la demande sont introuvables.");
            }

            const memberId = requestData?.memberId;
            if (!memberId) {
                throw new HttpsError("internal", "L'ID du membre est manquant.");
            }
            const memberRef = db.collection("users").doc(memberId);
            
            const memberDoc = await transaction.get(memberRef);
            if (!memberDoc.exists) {
                throw new HttpsError("not-found", `Le profil du membre ${memberId} n'existe pas.`);
            }

            transaction.update(requestRef, {status: "Terminé"});
            transaction.update(memberRef, {
                loyaltyPoints: admin.firestore.FieldValue.increment(50),
            });
            const transactionRef = db.collection("transactions").doc();
            const serviceDescription = requestData.serviceName || requestData.serviceDemande || `demande ${requestId}`;
            
            transaction.set(transactionRef, {
                userId: memberId,
                type: "service_reward",
                points: 50,
                description: `Récompense pour : ${serviceDescription}`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        return {success: true, message: "La demande a été validée."};
    } catch (error) {
        logger.error("Erreur lors de la validation :", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "Une erreur interne est survenue.");
    }
});

/**
 * Permet à un utilisateur d'échanger ses points de fidélité contre une récompense.
 */
export const redeemReward = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Vous devez être connecté pour échanger une récompense.");
  }

  const { rewardId } = request.data;
  if (!rewardId || typeof rewardId !== "string") {
    throw new HttpsError("invalid-argument", "Un ID de récompense valide doit être fourni.");
  }

  const userId = request.auth.uid;
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
        throw new HttpsError("failed-precondition", "Points de fidélité insuffisants pour cette récompense.");
      }

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


/**
 * Assigne le rôle "concierge" à un utilisateur via son email.
 * Doit être appelée par un admin ou un autre concierge.
 */
export const setConciergeRole = onCall(async (request) => {
  // Étape 1: Vérifier que l'appelant est authentifié
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Vous devez être authentifié pour effectuer cette action.');
  }

  // Étape 2: Vérifier que l'appelant a les droits (admin ou concierge)
  const callerUid = request.auth.uid;
  const callerAuth = await admin.auth().getUser(callerUid);
  const callerClaims = callerAuth.customClaims;

  if (callerClaims?.role !== 'admin' && callerClaims?.role !== 'concierge') {
      logger.warn(`L'utilisateur ${callerUid} a tenté d'assigner un rôle sans autorisation.`);
      throw new HttpsError('permission-denied', 'Seul un administrateur ou un concierge peut assigner des rôles.');
  }

  // Étape 3: Valider les données d'entrée
  const email = request.data.email;
  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', "L'e-mail est manquant ou invalide.");
  }
  
  logger.info(`L'utilisateur ${callerUid} (${callerClaims.role}) tente de promouvoir ${email} au rang de concierge.`);

  try {
    // Étape 4: Trouver l'utilisateur cible par email
    const userToPromote = await admin.auth().getUserByEmail(email);

    // Étape 5: Assigner le custom claim
    await admin.auth().setCustomUserClaims(userToPromote.uid, { role: 'concierge' });
    
    // Étape 6: Mettre aussi à jour le rôle dans Firestore pour un accès facile côté client
    await db.collection('users').doc(userToPromote.uid).set({ role: 'concierge' }, { merge: true });

    logger.info(`Succès ! L'utilisateur ${email} (UID: ${userToPromote.uid}) est maintenant un concierge.`);
    return { message: `Succès ! L'utilisateur ${email} est maintenant un concierge.` };
  } catch (error: any) {
    logger.error(`Erreur lors de l'assignation du rôle concierge à ${email}:`, error);
    if (error.code === 'auth/user-not-found') {
        throw new HttpsError('not-found', `Aucun utilisateur ne correspond à l'email ${email}.`);
    }
    throw new HttpsError('internal', "Une erreur interne s'est produite lors de l'assignation du rôle.");
  }
});

