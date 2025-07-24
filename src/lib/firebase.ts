// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCe0tjh-M8_mS-TZaGbmgdigMaxeTFlruk",
  authDomain: "collectif-connect.firebaseapp.com",
  projectId: "collectif-connect",
  storageBucket: "collectif-connect.firebasestorage.app",
  messagingSenderId: "432076267778",
  appId: "1:432076267778:web:5afbac008cd4acd634a21b"
};

// Initialize Firebase for client-side usage, and export the app instance for server-side.
export const firebaseApp: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(firebaseApp);
