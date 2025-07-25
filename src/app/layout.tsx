
"use client";

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

// export const metadata: Metadata = {
//   title: "Avantages Collectifs",
//   description:
//     "Votre compagnon numérique pour la communauté Avantages Collectifs.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showHeader = pathname !== "/connexion";

  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <title>Avantages Collectifs</title>
        <meta
          name="description"
          content="Votre compagnon numérique pour la communauté Avantages Collectifs."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body text-base antialiased"
        )}
      >
        <AuthProvider>
          <div className="relative flex min-h-dvh flex-col">
            {showHeader && <Header />}
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
