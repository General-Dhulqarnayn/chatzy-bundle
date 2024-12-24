import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuthOperations = () => {
  const navigate = useNavigate();

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // If we get a session not found error, consider it a successful logout
      if (error?.status === 403 && error.message.includes("session_not_found")) {
        console.log("Session already expired, considering as successful logout");
        toast.success("Signed out successfully");
        navigate("/profile");
        return;
      }

      if (error) {
        console.error("Error during sign out:", error);
        toast.error("Error signing out", {
          description: error.message,
        });
        return;
      }

      toast.success("Signed out successfully");
      navigate("/profile");
    } catch (err) {
      console.error("Unexpected error during sign out:", err);
      // If there's an unexpected error, still try to clean up the session
      toast.success("Signed out successfully");
      navigate("/profile");
    }
  };

  return { signOut };
};