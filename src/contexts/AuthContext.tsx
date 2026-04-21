import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: "admin" | "moderator" | "user" | null;
  isAdmin: boolean;
  isModerator: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"admin" | "moderator" | "user" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  const updateRoleFlags = async (userId: string) => {
    try {
      const [adminResult, moderatorResult] = await Promise.all([
        supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
        supabase.rpc("has_role", { _user_id: userId, _role: "moderator" }),
      ]);

      const admin = !!adminResult.data;
      const moderator = !!moderatorResult.data;
      setIsAdmin(admin);
      setIsModerator(moderator);
      setRole(admin ? "admin" : moderator ? "moderator" : "user");
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsAdmin(false);
      setIsModerator(false);
      setRole("user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize auth state from session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        updateRoleFlags(session.user.id);
      } else {
        setRole(null);
        setIsAdmin(false);
        setIsModerator(false);
        setLoading(false);
      }
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        updateRoleFlags(session.user.id);
      } else {
        setRole(null);
        setIsAdmin(false);
        setIsModerator(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: "https://casetrendskenya.co.ke" },
    });
    if (error) throw error;

    // Store email in profiles table if signup was successful
    if (data.user?.id) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ email })
        .eq("user_id", data.user.id);
      
      if (profileError) {
        console.warn("Could not update email in profile:", profileError);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, isAdmin, isModerator, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
