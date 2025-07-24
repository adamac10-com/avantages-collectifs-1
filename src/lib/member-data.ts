// Mock data - replace with actual data from your backend
export let memberData = {
  name: "Jean Dupont",
  loyaltyPoints: 1250,
  notifications: [
    {
      id: 1,
      title: "Nouvelle offre partenaire !",
      description: "Profitez de -15% sur votre prochain voyage.",
    },
    {
      id: 2,
      title: "Événement communautaire",
      description: "Rejoignez notre atelier jardinage le 25 juillet.",
    },
  ],
};

// Function to update the mock data and notify components
export function setMemberData(newData: Partial<typeof memberData>) {
  memberData = { ...memberData, ...newData };
  // Dispatch a custom event to notify components of the change.
  // This is a simple way to handle state in a small app without a full state management library.
  window.dispatchEvent(new CustomEvent('memberDataUpdate'));
}
