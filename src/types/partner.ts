export interface Partner {
  id: string;
  name: string;
  servicePillar:
    | "Protection & Assurance"
    | "Habitat & Rénovation"
    | "Assistance & Quotidien"
    | "Loisirs & Voyages";
  description: string;
}
