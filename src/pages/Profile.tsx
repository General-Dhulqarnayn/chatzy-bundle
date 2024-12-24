import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import ProfileForm from "@/components/profile/ProfileForm";
import { Separator } from "@/components/ui/separator";

type ProfileData = {
  username: string | null;
  age: number | null;
  gender: string | null;
};

const Profile = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) return;

      try {
        console.log("Fetching profile data for user:", session.user.id);
        const { data, error } = await supabase
          .from("profiles")
          .select("username, gender, age")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error loading profile:", error);
          throw error;
        }

        console.log("Profile data received:", data);
        setProfileData(data);
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile information");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [session]);

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

  if (isLoading || isLoadingProfile) {
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
    <div className="container max-w-md mx-auto pt-8 space-y-6">
      <Card className="p-6 glass">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Profile Information</h2>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{session.user.email}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Username</p>
            <p className="font-medium">{profileData?.username || "Not set"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Age</p>
            <p className="font-medium">{profileData?.age || "Not set"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Gender</p>
            <p className="font-medium">{profileData?.gender || "Not set"}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 glass">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Edit Profile</h2>
            <p className="text-muted-foreground">
              Update your profile information below
            </p>
          </div>
          
          <ProfileForm />

          <Separator />

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