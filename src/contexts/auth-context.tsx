// src/contexts/auth-context.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/config";

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    setLoading(true);
    // Get current user
    supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
      setUser(data.user);
      setLoading(false);
    });
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  const isAuthFlowPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isPublicMenuPage = pathname.startsWith("/menu/");

  useEffect(() => {
    if (
      !loading &&
      !user &&
      !isAuthFlowPage &&
      !isPublicMenuPage &&
      pathname !== "/"
    ) {
      router.replace("/login");
    }
  }, [loading, user, isAuthFlowPage, isPublicMenuPage, pathname, router]);

  // Loader for protected routes
  if (loading && !isAuthFlowPage && !isPublicMenuPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">
          Loading User Data...
        </p>
      </div>
    );
  }

  // Route protection
  if (
    !loading &&
    !user &&
    !isAuthFlowPage &&
    !isPublicMenuPage &&
    pathname !== "/"
  ) {
    // Show a loader while redirecting
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useMerchantProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(true);
      return;
    }
    // Only fetch when user is available
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("merchant_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [user, authLoading]);

  return { profile, loading };
}
