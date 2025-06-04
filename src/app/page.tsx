// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background responsive-padding text-center">
      <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary" />
      <p className="mt-4 responsive-text text-muted-foreground">
        Loading QR Plus...
      </p>
    </div>
  );
}
