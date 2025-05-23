// src/contexts/auth-context.tsx
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase/config';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean; // True until the first auth state is determined *after* successful init
  firebaseInitializationError: string | null; // To store any Firebase init error
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseInitializationError, setFirebaseInitializationError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        setFirebaseInitializationError(null); // Clear error on successful auth state
      }, (error) => {
        console.error("Firebase Auth State Error:", error);
        setFirebaseInitializationError(error.message || "An error occurred with Firebase Authentication.");
        setLoading(false);
        setUser(null);
      });

    } catch (error: any) {
      console.error("Failed to initialize Firebase Authentication listener:", error);
      setFirebaseInitializationError(error.message || "Could not connect to Firebase Authentication service.");
      setLoading(false);
      setUser(null);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null); // Explicitly set user to null
      router.push('/login'); 
    } catch (error) {
      console.error("Error signing out: ", error);
      // Optionally, show a toast error
    }
  };

  const isAuthFlowPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isPublicMenuPage = pathname.startsWith('/menu/');

  // 1. Handle Firebase Initialization Error State
  // Show error for all pages except auth flow and public menu, or if error is already shown by a specific page.
  if (firebaseInitializationError && !isAuthFlowPage && !isPublicMenuPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Application Error</AlertTitle>
          <AlertDescription>
            Could not initialize essential services: {firebaseInitializationError}
            <br />
            Please check your internet connection or try reloading the page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} className="mt-6">Reload Page</Button>
      </div>
    );
  }

  // 2. Handle Loading State (if no init error)
  // This loader shows for protected routes while waiting for auth state.
  // It should NOT show for /login, /signup, /menu/
  if (loading && !isAuthFlowPage && !isPublicMenuPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading User Data...</p>
      </div>
    );
  }

  // 3. Handle Route Protection (if no init error and not loading)
  if (!loading && !user && !isAuthFlowPage && !isPublicMenuPage) {
    // If on the root path, HomePage will handle the redirect.
    // For other protected paths, redirect to login.
    if (pathname !== '/') {
        router.replace('/login'); // Use replace to avoid adding to history stack
        return ( // Return a loader while redirecting
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-muted-foreground">Redirecting...</p>
            </div>
        );
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, firebaseInitializationError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
