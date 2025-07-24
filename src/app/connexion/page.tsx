
import { AuthForm } from "@/components/auth-form";

export default function ConnexionPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
}
