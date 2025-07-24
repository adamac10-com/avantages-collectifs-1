// Fichier : src/app/partenaires/page.tsx

import { PartnerDirectory } from '@/components/partner-directory';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Partner } from '@/types/partner';

// Cette fonction s'exécute côté serveur
async function getPartners(): Promise<Partner[]> {
  const db = getFirestore(firebaseApp);
  const partnersColRef = collection(db, 'partners');
  const partnerSnapshot = await getDocs(partnersColRef);
  
  if (partnerSnapshot.empty) {
    console.log("La collection 'partners' est vide.");
    return [];
  }

  const partnerPromises = partnerSnapshot.docs.map(async (docSnapshot) => {
    let data = docSnapshot.data();
    const docId = docSnapshot.id;

    // Scénario 1: Les données sont directement dans le document
    if (data && data.name) {
      return {
        id: docId,
        name: data.name,
        servicePillar: data.servicePillar,
        description: data.description,
      };
    }
    
    // Scénario 2: Les données sont dans une sous-collection (cas observé précédemment)
    const subCollectionRef = collection(db, 'partners', docId, 'partners');
    const subCollectionSnapshot = await getDocs(subCollectionRef);
    
    if (!subCollectionSnapshot.empty) {
        // On prend le premier document de la sous-collection
        const subDoc = subCollectionSnapshot.docs[0];
        data = subDoc.data();
        if(data && data.name) {
            return {
                id: subDoc.id,
                name: data.name,
                servicePillar: data.servicePillar,
                description: data.description,
            };
        }
    }
    
    // Si aucune donnée valide n'est trouvée, on retourne null
    return null;
  });

  const partnerList = (await Promise.all(partnerPromises))
      .filter((p): p is Partner => p !== null); // Filtrer les résultats nuls

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
