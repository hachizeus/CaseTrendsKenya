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
  signUp: (email: string, password: string, fullName: string, captchaToken?: string | null) => Promise<void>;
  signIn: (email: string, password: string, captchaToken?: string | null) => Promise<void>;
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

  const signUp = async (email: string, password: string, fullName: string, captchaToken?: string | null) => {
    const options: any = {
      data: { full_name: fullName },
      emailRedirectTo: import.meta.env.VITE_SITE_URL || window.location.origin,
    };

    // Only add captcha token if provided (for production)
    if (captchaToken) {
      options.captchaToken = captchaToken;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });
    
    if (error) {
      // Handle specific Supabase error codes
      if (error.message?.includes("captcha")) {
        throw new Error("CAPTCHA verification failed. Please try again.");
      }
      if (error.message?.includes("User already registered")) {
        throw new Error("User already registered");
      }
      throw error;
    }

    // Update profile with email if signup was successful
    if (data.user?.id) {
      try {
        // @ts-ignore - Suppress TypeScript error for Supabase types
        await supabase
          .from("profiles")
          // @ts-ignore
          .update({ email: email })
          // @ts-ignore
          .eq("user_id", data.user.id);
      } catch (profileUpdateError) {
        console.warn("Profile update failed:", profileUpdateError);
      }
    }
  };

  const signIn = async (email: string, password: string, captchaToken?: string | null) => {
    const signInOptions: any = {
      email,
      password,
    };

    // Only add captcha token if provided (for production)
    if (captchaToken) {
      signInOptions.options = {
        captchaToken: captchaToken,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword(signInOptions);
    
    if (error) {
      // Handle specific error types
      if (error.message?.includes("captcha")) {
        throw new Error("CAPTCHA verification failed. Please try again.");
      }
      if (error.message?.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password. Please try again.");
      }
      if (error.message?.includes("Email not confirmed")) {
        throw new Error("Please verify your email address before signing in.");
      }
      throw error;
    }

    // Check if email is verified
    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      throw new Error("Please verify your email address before signing in. Check your inbox for the verification link.");
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      role, 
      isAdmin, 
      isModerator, 
      signUp, 
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};