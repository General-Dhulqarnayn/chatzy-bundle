import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthOperations } from "@/hooks/useAuthOperations";
import { AuthUI } from "@/components/profile/AuthUI";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { session, isLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const { signOut } = useAuthOperations();

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) {
          toast.error("Error fetching profile");
          return;
        }

        if (data) {
          setProfile(data);
          setIsProfileComplete(!!data.gender && !!data.age);
        }
      }
    };

    fetchProfile();
  }, [session?.user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthUI />;
  }

  return (
    <div className="container max-w-md mx-auto pt-8">
      <Card className="p-6 glass">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Profile</h2>
            <p className="text-muted-foreground">
              {isProfileComplete 
                ? "You can update your username below"
                : "Complete your profile to continue"}
            </p>
          </div>

          <ProfileForm
            initialData={profile}
            userId={session.user.id}
            isProfileComplete={isProfileComplete}
            onProfileUpdate={() => setIsProfileComplete(true)}
          />

          <Button
            variant="destructive"
            className="w-full"
            onClick={signOut}
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Profile;