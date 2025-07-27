
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const rewards = [
  {
    title: "Café gratuit chez Le Procope",
    description: "Un espresso offert par notre partenaire.",
    pointsCost: 50,
    requiredLevel: "essentiel",
  },
  {
    title: "Réduction de 10% sur votre prochain achat",
    description: "Valable dans toutes les boutiques partenaires.",
    pointsCost: 100,
    requiredLevel: "essentiel",
  },
];

async function addRewards() {
  const rewardsCollection = collection(db, 'rewards');
  for (const reward of rewards) {
    await addDoc(rewardsCollection, reward);
  }
}

addRewards();
