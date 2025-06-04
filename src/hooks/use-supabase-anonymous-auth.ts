import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/config";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/contexts/auth-context";

const ANON_USER_KEY = "anon_user_credentials";

export function useSupabaseAnonymousAuth() {
  const { user: mainUser, loading: mainAuthLoading } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run anon auth if there is no main user and not loading
    if (mainAuthLoading || mainUser) {
      setUser(mainUser);
      setLoading(false);
      return;
    }
    const tryAuth = async () => {
      console.log('[AnonAuth] Hook running');
      let creds = localStorage.getItem(ANON_USER_KEY);
      let email, password;

      if (creds) {
        ({ email, password } = JSON.parse(creds));
        console.log('[AnonAuth] Found creds in localStorage:', { email, password });
      } else {
        const uuid = uuidv4();
        email = `anon-${uuid}@qrplus.app`;
        password = uuidv4();
        localStorage.setItem(ANON_USER_KEY, JSON.stringify({ email, password }));
        console.log('[AnonAuth] Generated new creds:', { email, password });
      }

      // Try to sign in
      let { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('[AnonAuth] Sign in result:', { data, error });
      if (error) {
        // If user doesn't exist, sign up
        if (error.message.includes("Invalid login credentials")) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
          console.log('[AnonAuth] Sign up result:', { signUpData, signUpError });
          if (signUpError) {
            console.error("Anonymous sign up failed:", signUpError);
            setLoading(false);
            return;
          }
          setUser(signUpData.user);
        } else {
          console.error("Anonymous sign in failed:", error);
        }
      } else {
        setUser(data.user);
      }
      setLoading(false);
    };

    tryAuth();
  }, [mainUser, mainAuthLoading]);

  return { user, loading };
} 