// This is a mock auth hook for debugging purposes.
// In a real application, this would be replaced with actual Firebase Authentication logic.

export function useAuth() {
  // Simulate a logged-in user.
  // Replace with your actual user data structure from Firebase Auth.
  const user = {
    uid: "user_test_12345", // Example User ID
    displayName: "Jean Dupont (Test)", // Example Display Name
    email: "jean.dupont.test@example.com", // Example Email
  };

  return { user };
}
