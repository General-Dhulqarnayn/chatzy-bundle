import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, isLoading: true });

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const getErrorMessage = (error: AuthError) => {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'Email not confirmed':
      return 'Please verify your email address before signing in.';
    case 'User not found':
      return 'No user found with these credentials.';
    default:
      return error.message;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Setting up auth state...");
    
    // Get initial session
    const setupAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          toast.error(getErrorMessage(error));
          // Clear any invalid session state
          await supabase.auth.signOut();
          setSession(null);
        } else {
          console.log("Initial session:", data.session);
          setSession(data.session);
          
          // Only redirect to join rooms if user is on root page
          if (data.session && location.pathname === "/") {
            navigate("/join-rooms");
          }
        }
        
        // Only redirect to profile if trying to access protected routes without auth
        if (!data.session && location.pathname !== "/" && location.pathname !== "/profile") {
          navigate("/profile");
        }
      } catch (err) {
        console.error("Error in auth setup:", err);
        if (err instanceof AuthError) {
          toast.error(getErrorMessage(err));
        }
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    setupAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, currentSession);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token was refreshed successfully');
      }
      
      if (event === 'SIGNED_IN') {
        setSession(currentSession);
        navigate("/join-rooms");
      }
      
      if (event === 'SIGNED_OUT') {
        // Clear any remaining session data
        setSession(null);
        if (location.pathname !== "/" && location.pathname !== "/profile") {
          toast("You have been signed out");
          navigate("/profile");
        }
      } else if (event === 'USER_UPDATED') {
        setSession(currentSession);
      } else if (event === 'AUTH_ERROR') {
        toast.error("Authentication error occurred");
      }
      
      setIsLoading(false);
    });

    return () => {
      console.log("Cleaning up auth subscriptions");
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};