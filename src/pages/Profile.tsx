import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import ProfileForm from "@/components/profile/ProfileForm";

const Profile = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out", {
        description: error.message,
      });
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container max-w-md mx-auto pt-8">
        <Card className="p-6 glass">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                  },
                },
              },
            }}
            providers={[]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto pt-8">
      <Card className="p-6 glass">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Profile</h2>
            <p className="text-muted-foreground">
              Logged in as: {session.user.email}
            </p>
          </div>
          
          <ProfileForm />

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Profile;