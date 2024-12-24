import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthOperations } from "@/hooks/useAuthOperations";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  gender: z.enum(["Male", "Female"]),
  age: z.number().min(12, "You must be at least 12 years old"),
});

const Profile = () => {
  const { session, isLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const { signOut } = useAuthOperations();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      gender: undefined,
      age: undefined,
    },
  });

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
          form.reset({
            username: data.username || "",
            gender: data.gender as "Male" | "Female" | undefined,
            age: data.age || undefined,
          });
          setIsProfileComplete(!!data.gender && !!data.age);
        }
      }
    };

    fetchProfile();
  }, [session?.user?.id]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        username: values.username,
        ...(isProfileComplete ? {} : { gender: values.gender, age: values.age }),
      })
      .eq("id", session.user.id);

    if (error) {
      toast.error("Error updating profile", {
        description: error.message,
      });
      return;
    }

    toast.success("Profile updated successfully");
    setIsProfileComplete(true);
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
              {isProfileComplete 
                ? "You can update your username below"
                : "Complete your profile to continue"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isProfileComplete && (
                <>
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Male" id="male" />
                              <Label htmlFor="male">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Female" id="female" />
                              <Label htmlFor="female">Female</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={12}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button type="submit" className="w-full">
                {isProfileComplete ? "Update Username" : "Complete Profile"}
              </Button>
            </form>
          </Form>

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