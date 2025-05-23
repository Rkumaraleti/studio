// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  // firebaseInitializationError is crucial to prevent redirects if Firebase itself failed
  const { user, loading, firebaseInitializationError } = useAuth(); 

  useEffect(() => {
    // Only attempt to redirect if Firebase initialization is okay and auth state is determined
    if (!firebaseInitializationError && !loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
    // If firebaseInitializationError is present, AuthProvider handles showing a global error page.
    // If loading is true (and no error), this page shows its own loader below.
  }, [user, loading, router, firebaseInitializationError]);

  // If AuthProvider is showing a global Firebase error, avoid rendering HomePage's loader.
  if (firebaseInitializationError) {
    return null; 
  }

  // This loader is for the brief period when this page is active, 
  // auth is loading, and there's no Firebase initialization error.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Loading QR Plus...</p>
    </div>
  );
}
