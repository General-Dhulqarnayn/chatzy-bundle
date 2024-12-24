import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuthOperations = () => {
  const navigate = useNavigate();

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during sign out:", error);
        // If we get a session not found error, we can consider the user logged out
        if (error.status === 403 && error.message.includes("session_not_found")) {
          toast.success("Signed out successfully");
          navigate("/profile");
          return;
        }
        toast.error("Error signing out", {
          description: error.message,
        });
      } else {
        toast.success("Signed out successfully");
        navigate("/profile");
      }
    } catch (err) {
      console.error("Unexpected error during sign out:", err);
      toast.error("Unexpected error during sign out");
    }
  };

  return { signOut };
};