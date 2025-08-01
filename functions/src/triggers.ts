import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const awardPointsForNewPost = functions.firestore
  .document("community_posts/{postId}")
  .onCreate(async (snapshot, context) => {
    // ... (implementation)
  });
