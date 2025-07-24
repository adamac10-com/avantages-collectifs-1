// Fichier : src/app/partenaires/page.tsx

import { PartnerDirectory } from '@/components/partner-directory';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Partner } from '@/types/partner';

// Cette fonction s'exécute côté serveur pour récupérer les données
async function getPartners(): Promise<Partner[]> {
  try {
    const db = getFirestore(firebaseApp);
    const partnersColRef = collection(db, 'partners');
    const partnerSnapshot = await getDocs(partnersColRef);

    if (partnerSnapshot.empty) {
      console.log("Aucun document trouvé dans la collection 'partners'.");
      return [];
    }

    const partnerList = partnerSnapshot.docs.map(doc => {
      const data = doc.data();
      // On s'assure de retourner un objet Partner bien formé
      return {
        id: doc.id,
        name: data.name || "Nom manquant",
        servicePillar: data.servicePillar || "Catégorie manquante",
        description: data.description || "Description manquante",
      };
    });
    
    console.log("Données des partenaires récupérées avec succès :", partnerList);
    return partnerList as Partner[];

  } catch (error) {
    console.error("Erreur lors de la récupération des partenaires :", error);
    return []; // Retourner un tableau vide en cas d'erreur
  }
}

// La page est un composant serveur asynchrone
export default async function PartnersPage() {
  const realPartnersData = await getPartners();
  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      <PartnerDirectory allPartners={realPartnersData} />
    </div>
  );
}
