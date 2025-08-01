import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const addCommentToPost = onCall(async (request) => {
  // ... (implementation)
});

export const completeServiceRequest = onCall(async (request) => {
  // ... (implementation)
});

export const createCommunityPost = onCall(async (request) => {
  // ... (implementation)
});

export const createPartner = onCall(async (request) => {
  // ... (implementation)
});

export const deletePartner = onCall(async (request) => {
  // ... (implementation)
});

export const setConciergeRole = onCall(async (request) => {
  // ... (implementation)
});

export const updatePartner = onCall(async (request) => {
  // ... (implementation)
});
