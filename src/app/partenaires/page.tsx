// Fichier : src/app/partenaires/page.tsx

import { PartnerDirectory } from '@/components/partner-directory';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Partner } from '@/types/partner';


// Cette fonction s'exécute côté serveur
async function getPartners(): Promise<Partner[]> {
  const db = getFirestore(firebaseApp);
  const partnersCol = collection(db, 'partners');
  const partnerSnapshot = await getDocs(partnersCol);
  
  const partnerList: Partner[] = partnerSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || 'Nom manquant',
      servicePillar: data.servicePillar || "Protection & Assurance",
      description: data.description || "Description manquante.",
    };
  });
  
  return partnerList;
}

// La page est un composant serveur asynchrone
export default async function PartnersPage() {
  const realPartnersData = await getPartners();
  console.log("DONNÉES RÉCUPÉRÉES CÔTÉ SERVEUR :", realPartnersData);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      <PartnerDirectory allPartners={realPartnersData} />
    </div>
  );
}
