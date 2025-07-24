import { PartnerDirectory } from "@/components/partner-directory";
import { Partner } from "@/types/partner";

// Données fictives pour simuler une récupération depuis Firestore
const mockPartners: Partner[] = [
  {
    id: "partner-1",
    name: "Axa Assurance",
    servicePillar: "Protection & Assurance",
    description:
      "Solutions complètes pour l'assurance habitation, auto et santé, adaptées à vos besoins.",
  },
  {
    id: "partner-2",
    name: "Home Services Pro",
    servicePillar: "Habitat & Rénovation",
    description:
      "Mise en relation avec des artisans qualifiés pour tous vos travaux de rénovation et d'entretien.",
  },
  {
    id: "partner-3",
    name: "Aide & Confort Senior",
    servicePillar: "Assistance & Quotidien",
    description:
      "Services à la personne pour faciliter le quotidien : aide ménagère, portage de repas, accompagnement.",
  },
  {
    id: "partner-4",
    name: "Voyages & Découvertes",
    servicePillar: "Loisirs & Voyages",
    description:
      "Circuits organisés et séjours sur mesure pour explorer le monde en toute sérénité.",
  },
    {
    id: "partner-5",
    name: "Sécurité Habitat Plus",
    servicePillar: "Protection & Assurance",
    description:
      "Installation de systèmes d'alarme et de télésurveillance pour protéger votre domicile 24h/24.",
  },
  {
    id: "partner-6",
    name: "Les Jardiniers Créatifs",
    servicePillar: "Habitat & Rénovation",
    description:
      "Entretien de jardins, aménagement paysager et conseils pour un extérieur magnifique.",
  },
];

// Cette fonction simule la récupération de données.
// Dans une application réelle avec le SDK Admin, elle appellerait Firestore.
async function getPartners() {
  // Simule une attente réseau
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockPartners;
}


export default async function PartnersPage() {
   const partnersData = await getPartners();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      <PartnerDirectory allPartners={partnersData} />
    </div>
  );
}
