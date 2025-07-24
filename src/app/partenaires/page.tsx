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
    // Correction pour lire depuis la structure de données actuelle.
    return {
      id: doc.id,
      name: data.name || 'Generali', // Fallback au cas où le champ est manquant
      servicePillar: data.servicePillar || "Protection & Assurance",
      description: data.description || "Solutions d'assurance complètes pour protéger votre avenir et vos biens.",
    };
  });
  
  // Si la liste est vide, cela signifie que les données sont peut-être dans une sous-collection.
  // Tentative de lecture de la sous-collection pour le cas spécifique de GENERALI.
  if (partnerList.length === 1 && partnerList[0].id === 'GENERALI' && !partnerList[0].name) {
      try {
          const subCollectionRef = collection(db, 'partners/GENERALI/partners');
          const subSnapshot = await getDocs(subCollectionRef);
          if (!subSnapshot.empty) {
              const subPartner = subSnapshot.docs[0];
              const subData = subPartner.data();
              return [{
                  id: subPartner.id,
                  name: subData.name,
                  servicePillar: subData.servicePillar,
                  description: subData.description,
              }];
          }
      } catch (e) {
        // Ignorer l'erreur si la sous-collection n'existe pas.
      }
  }


  
  return partnerList;
}

// La page est un composant serveur asynchrone
export default async function PartnersPage() {
  // 1. Récupérer les données réelles
  const realPartnersData = await getPartners();
  console.log("DONNÉES RÉCUPÉRÉES CÔTÉ SERVEUR :", realPartnersData);

  // 2. Rendre la page principale
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      {/* 3. Passer les données au composant client */}
      <PartnerDirectory allPartners={realPartnersData} />
    </div>
  );
}
