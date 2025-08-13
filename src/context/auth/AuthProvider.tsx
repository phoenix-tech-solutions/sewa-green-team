import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "~/lib/supabase";
import { type User, type Session } from "@supabase/supabase-js";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [justSignedOut, setJustSignedOut] = useState(false);

  useEffect(() => {
    // Initialize session & user
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    init();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Don't set loading to false here - only set it to false after initial load
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    setJustSignedOut(true);
    setTimeout(() => setJustSignedOut(false), 2000);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, justSignedOut }}>
      {children}
    </AuthContext.Provider>
  );
};
