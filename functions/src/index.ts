
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialisation de l'admin Firebase
admin.initializeApp();
const db = admin.firestore();

// Liste des piliers de service autorisés
const SERVICE_PILLARS = [
  "Protection & Assurance",
  "Habitat & Rénovation",
  "Assistance & Quotidien",
  "Loisirs & Voyages",
];

/**
 * Finalise l'inscription d'un utilisateur en créant son profil dans Firestore.
 * Cette fonction est appelée depuis le client après la création de l'utilisateur dans Auth.
 */
export const finalizeRegistration = onCall(async (request) => {
  // 1. Vérifier que l'utilisateur est authentifié
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "La fonction doit être appelée par un utilisateur authentifié.");
  }

  // 2. Valider les données d'entrée
  const {firstName, lastName, nickname} = request.data;
  if (!firstName || !lastName || !nickname) {
    throw new HttpsError("invalid-argument", "Les informations 'firstName', 'lastName' et 'nickname' sont requises.");
  }

  const user = request.auth;
  const {uid, email} = user;

  logger.info(`[finalizeRegistration] - Début de la finalisation du profil pour l'UID : ${uid}`);

  const newUserProfile = {
    uid,
    email: email || "",
    firstName,
    lastName,
    nickname,
    displayName: nickname, // Utiliser le surnom comme nom d'affichage
    photoURL: user.token.picture || null,
    membershipLevel: "essentiel",
    loyaltyPoints: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    role: "member", // Rôle par défaut
  };

  try {
    await db.collection("users").doc(uid).set(newUserProfile);
    logger.info(`[finalizeRegistration] - Profil créé avec succès dans Firestore pour l'UID : ${uid}`);

    // Mettre à jour les custom claims de l'utilisateur pour inclure le rôle
    await admin.auth().setCustomUserClaims(uid, {role: "member"});

    return {success: true, message: "Profil utilisateur créé avec succès."};
  } catch (error) {
    logger.error(`[finalizeRegistration] - Erreur lors de la création du profil pour l'UID ${uid}:`, error);
    throw new HttpsError(
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

  const {rewardId} = request.data;
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
    return {success: true, message: "Récompense échangée avec succès."};
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
    throw new HttpsError("unauthenticated", "Vous devez être authentifié pour effectuer cette action.");
  }

  // Étape 2: Vérifier que l'appelant a les droits (admin ou concierge)
  const callerUid = request.auth.uid;
  const callerAuth = await admin.auth().getUser(callerUid);
  const callerClaims = callerAuth.customClaims;

  if (callerClaims?.role !== "admin" && callerClaims?.role !== "concierge") {
    logger.warn(`L'utilisateur ${callerUid} a tenté d'assigner un rôle sans autorisation.`);
    throw new HttpsError("permission-denied", "Seul un administrateur ou un concierge peut assigner des rôles.");
  }

  // Étape 3: Valider les données d'entrée
  const email = request.data.email;
  if (!email || typeof email !== "string") {
    throw new HttpsError("invalid-argument", "L'e-mail est manquant ou invalide.");
  }

  logger.info(`L'utilisateur ${callerUid} (${callerClaims.role}) tente de promouvoir ${email} au rang de concierge.`);

  try {
    // Étape 4: Trouver l'utilisateur cible par email
    const userToPromote = await admin.auth().getUserByEmail(email);

    // Étape 5: Assigner le custom claim
    await admin.auth().setCustomUserClaims(userToPromote.uid, {role: "concierge"});

    // Étape 6: Mettre aussi à jour le rôle dans Firestore pour un accès facile côté client
    await db.collection("users").doc(userToPromote.uid).set({role: "concierge"}, {merge: true});

    logger.info(`Succès ! L'utilisateur ${email} (UID: ${userToPromote.uid}) est maintenant un concierge.`);
    return {message: `Succès ! L'utilisateur ${email} est maintenant un concierge.`};
  } catch (error: any) {
    logger.error(`Erreur lors de l'assignation du rôle concierge à ${email}:`, error);
    if (error.code === "auth/user-not-found") {
      throw new HttpsError("not-found", `Aucun utilisateur ne correspond à l'email ${email}.`);
    }
    throw new HttpsError("internal", "Une erreur interne s'est produite lors de l'assignation du rôle.");
  }
});

/**
 * Permet à un concierge ou admin d'ajouter un nouveau partenaire.
 */
export const createPartner = onCall(async (request) => {
  // 1. Vérifier que l'appelant est authentifié
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Vous devez être authentifié pour effectuer cette action.");
  }

  // 2. Vérifier que l'appelant a les droits (admin ou concierge)
  const callerClaims = request.auth.token;
  if (callerClaims.role !== "admin" && callerClaims.role !== "concierge") {
    logger.warn(`L'utilisateur ${request.auth.uid} a tenté de créer un partenaire sans autorisation.`);
    throw new HttpsError("permission-denied", "Seul un administrateur ou un concierge peut ajouter un partenaire.");
  }

  // 3. Valider les données d'entrée
  const {name, description, servicePillar} = request.data;
  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new HttpsError("invalid-argument", "Le nom du partenaire est obligatoire.");
  }

  if (!servicePillar || !SERVICE_PILLARS.includes(servicePillar)) {
    throw new HttpsError("invalid-argument", "Le pilier de service fourni est invalide.");
  }

  logger.info(`L'utilisateur ${request.auth.uid} (${callerClaims.role}) ajoute le partenaire : ${name}`);

  try {
    // 4. Préparer et enregistrer les données
    const newPartnerData = {
      name: name,
      description: description,
      servicePillar: servicePillar,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      addedBy: request.auth.uid,
    };

    const docRef = await db.collection("partners").add(newPartnerData);

    logger.info(`Partenaire ${name} ajouté avec succès avec l'ID: ${docRef.id}.`);
    return {success: true, partnerId: docRef.id};
  } catch (error) {
    logger.error(`Erreur lors de la création du partenaire ${name}:`, error);
    throw new HttpsError("internal", "Une erreur interne s'est produite lors de la création du partenaire.");
  }
});

/**
 * Permet à un concierge ou admin de mettre à jour un partenaire existant.
 */
export const updatePartner = onCall(async (request) => {
  // 3a. Vérification de l'authentification et du rôle
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Vous devez être authentifié pour effectuer cette action.");
  }
  const callerClaims = request.auth.token;
  if (callerClaims.role !== "admin" && callerClaims.role !== "concierge") {
    logger.warn(`L'utilisateur ${request.auth.uid} a tenté de modifier un partenaire sans autorisation.`);
    throw new HttpsError("permission-denied", "Seul un administrateur ou un concierge peut modifier un partenaire.");
  }

  // 3b. Validation de l'ID du partenaire
  const {partnerId, updatedData} = request.data;
  if (!partnerId || typeof partnerId !== "string") {
    throw new HttpsError("invalid-argument", "L'ID du partenaire est manquant ou invalide.");
  }

  // 3c. Validation des données de mise à jour
  if (!updatedData || typeof updatedData !== "object") {
    throw new HttpsError("invalid-argument", "Les données de mise à jour sont requises.");
  }
  if (updatedData.name !== undefined && (typeof updatedData.name !== "string" || updatedData.name.trim() === "")) {
    throw new HttpsError("invalid-argument", "Le nom du partenaire ne peut pas être vide.");
  }
  if (updatedData.servicePillar !== undefined && !SERVICE_PILLARS.includes(updatedData.servicePillar)) {
    throw new HttpsError("invalid-argument", "Le pilier de service fourni est invalide.");
  }

  // Nettoyer les données pour n'envoyer que les champs autorisés
  const allowedFields = ["name", "description", "servicePillar"];
  const cleanData: {[key: string]: any} = {};
  for (const field of allowedFields) {
    if (updatedData[field] !== undefined) {
      cleanData[field] = updatedData[field];
    }
  }
  if (Object.keys(cleanData).length === 0) {
    throw new HttpsError("invalid-argument", "Aucune donnée de mise à jour valide n'a été fournie.");
  }
  cleanData.lastUpdatedAt = admin.firestore.FieldValue.serverTimestamp(); // Ajouter un timestamp de mise à jour

  logger.info(`Tentative de mise à jour du partenaire ${partnerId} par ${request.auth.uid} (${callerClaims.role}) avec les données :`, cleanData);

  try {
    // 4. Mettre à jour le document dans Firestore
    const partnerRef = db.collection("partners").doc(partnerId);
    await partnerRef.update(cleanData);

    // 5. Loguer la modification
    logger.info(`Le partenaire ${partnerId} a été modifié avec succès par le concierge ${request.auth.uid}.`);

    // 6. Retourner un message de succès
    return {success: true, message: "Partenaire mis à jour avec succès."};
  } catch (error: any) {
    logger.error(`Erreur lors de la mise à jour du partenaire ${partnerId}:`, error);
    if (error.code === "not-found") {
      throw new HttpsError("not-found", `Le partenaire avec l'ID ${partnerId} n'a pas été trouvé.`);
    }
    throw new HttpsError("internal", "Une erreur interne s'est produite lors de la mise à jour du partenaire.");
  }
});

/**
 * Permet à un concierge ou admin de supprimer un partenaire.
 */
export const deletePartner = onCall(async (request) => {
  // 3. Sécurité : Vérification de l'authentification et du rôle
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Vous devez être authentifié pour effectuer cette action.");
  }
  const callerClaims = request.auth.token;
  if (callerClaims.role !== "admin" && callerClaims.role !== "concierge") {
    logger.warn(`L'utilisateur ${request.auth.uid} a tenté de supprimer un partenaire sans autorisation.`);
    throw new HttpsError("permission-denied", "Seul un administrateur ou un concierge peut supprimer un partenaire.");
  }

  // 2. Validation de l'ID du partenaire
  const {partnerId} = request.data;
  if (!partnerId || typeof partnerId !== "string") {
    throw new HttpsError("invalid-argument", "L'ID du partenaire est manquant ou invalide.");
  }

  logger.info(`Tentative de suppression du partenaire ${partnerId} par ${request.auth.uid} (${callerClaims.role}).`);

  try {
    // 4. Logique de suppression
    const partnerRef = db.collection("partners").doc(partnerId);
    await partnerRef.delete();

    logger.info(`Le partenaire ${partnerId} a été supprimé avec succès par ${request.auth.uid}.`);

    // 5. Retourner un message de succès
    return {success: true, message: "Partenaire supprimé avec succès."};
  } catch (error) {
    logger.error(`Erreur lors de la suppression du partenaire ${partnerId}:`, error);
    // Le SDK admin ne retourne pas une erreur "not-found" spécifique sur .delete()
    // La suppression d'un document inexistant ne lève pas d'erreur.
    // Cette approche est idempotente et généralement acceptable.
    throw new HttpsError("internal", "Une erreur interne s'est produite lors de la suppression du partenaire.");
  }
});

/**
 * Permet à un membre authentifié de créer une nouvelle discussion dans le forum.
 * **CORRIGÉ** : Utilise le token pour le nom de l'auteur au lieu d'une lecture Firestore.
 */
export const createCommunityPost = onCall(async (request) => {
  // 1. Vérifier que l'appelant est authentifié
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Vous devez être connecté pour créer une discussion.");
  }
  const authorId = request.auth.uid;
  // 2. Récupérer le nom de l'auteur depuis le token (plus efficace)
  const authorName = request.auth.token.name || "Membre Anonyme";

  // 3. Valider les données d'entrée
  const {title, content} = request.data;
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Le titre est obligatoire.");
  }
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Le contenu ne peut pas être vide.");
  }

  logger.info(`L'utilisateur ${authorId} (${authorName}) crée une nouvelle discussion: "${title}"`);

  try {
    // 4. Préparer et créer le nouveau document de post
    const newPost = {
      title,
      content,
      authorId,
      authorName, // Utilisation du nom du token
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      commentsCount: 0,
      lastCommentAt: null,
    };

    const postRef = await db.collection("community_posts").add(newPost);
    logger.info(`Discussion "${title}" créée avec succès avec l'ID: ${postRef.id}`);

    // 5. Retourner un message de succès avec l'ID du post
    return {success: true, postId: postRef.id, message: "Discussion créée avec succès !"};
  } catch (error) {
    logger.error(`Erreur lors de la création de la discussion par ${authorId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Une erreur interne est survenue lors de la création de la discussion.");
  }
});


/**
 * Attribue des points de fidélité à un utilisateur lorsqu'il crée une nouvelle discussion.
 */
export const awardPointsForNewPost = functions.firestore
  .document("community_posts/{postId}")
  .onCreate(async (snapshot, context) => {
    const postData = snapshot.data();
    if (!postData) {
      logger.error("Aucune donnée trouvée dans le document de post créé:", context.params.postId);
      return;
    }

    const authorId = postData.authorId;
    if (!authorId) {
      logger.error("Aucun authorId trouvé dans le document de post:", context.params.postId);
      return;
    }

    const userRef = db.collection("users").doc(authorId);

    try {
      // Incrémente de manière atomique les points de l'utilisateur
      await userRef.update({
        loyaltyPoints: admin.firestore.FieldValue.increment(10),
      });

      // Crée également une transaction pour l'historique
      const transactionRef = db.collection("transactions").doc();
      await transactionRef.set({
        userId: authorId,
        type: "forum_post_reward",
        points: 10,
        description: `Récompense pour la discussion : "${postData.title}"`,
        postId: context.params.postId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`+10 points attribués à l'utilisateur ${authorId} pour la création du post ${context.params.postId}.`);
    } catch (error) {
      logger.error(`Erreur lors de l'attribution des points à ${authorId} pour le post ${context.params.postId}:`, error);
    }
  });


/**
 * Permet à un membre authentifié d'ajouter un commentaire à une discussion.
 * **CORRIGÉ** : Utilise le token pour le nom et l'avatar de l'auteur.
 */
export const addCommentToPost = onCall(async (request) => {
  // 1. Vérifier que l'utilisateur est authentifié
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Vous devez être connecté pour commenter.");
  }

  // 2. Valider les données d'entrée
  const {postId, content} = request.data;
  if (!postId || typeof postId !== "string") {
    throw new HttpsError("invalid-argument", "L'ID de la discussion est manquant ou invalide.");
  }
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Le contenu du commentaire ne peut pas être vide.");
  }

  const authorId = request.auth.uid;
  // 3. Récupérer les informations de l'auteur depuis le token
  const authorName = request.auth.token.name || "Membre Anonyme";
  const authorAvatar = request.auth.token.picture || null;

  logger.info(`L'utilisateur ${authorId} (${authorName}) ajoute un commentaire au post ${postId}.`);

  const postRef = db.collection("community_posts").doc(postId);
  const commentsCollectionRef = postRef.collection("comments");

  try {
    // 4. Utiliser une transaction pour garantir l'atomicité
    await db.runTransaction(async (transaction) => {
      // Vérifier que le post existe avant de commenter
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) {
        throw new HttpsError("not-found", "La discussion à laquelle vous essayez de répondre n'existe pas.");
      }

      // Ajouter le nouveau commentaire
      const newCommentRef = commentsCollectionRef.doc();
      transaction.set(newCommentRef, {
        content,
        authorId,
        authorName, // Utilisation du nom du token
        authorAvatar, // Utilisation de l'avatar du token
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Mettre à jour le compteur et la date du dernier commentaire sur le post parent
      transaction.update(postRef, {
        commentsCount: admin.firestore.FieldValue.increment(1),
        lastCommentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    logger.info(`Commentaire ajouté avec succès au post ${postId} par ${authorId}.`);
    return {success: true, message: "Commentaire ajouté avec succès."};
  } catch (error) {
    logger.error(`Erreur lors de l'ajout du commentaire par ${authorId} au post ${postId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Une erreur est survenue lors de l'ajout de votre commentaire.");
  }
});
