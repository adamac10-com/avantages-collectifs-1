// Fichier : src/app/partenaires/page.tsx

import { PartnerDirectory } from '@/components/partner-directory';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Partner } from '@/types/partner';
import { getApps, initializeApp } from 'firebase/app';


// Cette fonction s'exécute côté serveur
async function getPartners(): Promise<Partner[]> {
  // Firestore doit être initialisé spécifiquement pour cet usage côté serveur.
  // Nous ne pouvons pas réutiliser l'instance 'db' du client.
  const db = getFirestore(firebaseApp);
  const partnersCol = collection(db, 'partners');
  const partnerSnapshot = await getDocs(partnersCol);
  
  const partnerList: Partner[] = partnerSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      servicePillar: data.servicePillar,
      description: data.description,
    };
  });
  
  return partnerList;
}

// La page est un composant serveur asynchrone
export default async function PartnersPage() {
  // 1. Récupérer les données réelles
  const realPartnersData = await getPartners();

  // 2. Rendre la page principale
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      {/* 3. Passer les données au composant client */}
      <PartnerDirectory allPartners={realPartnersData} />
    </div>
  );
}
