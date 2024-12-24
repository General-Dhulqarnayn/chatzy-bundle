import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { MessageSquare, Lightbulb } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { theme, setTheme } = useTheme();

  const handleSupportContact = () => {
    window.location.href = "mailto:info@studibudi.com";
    toast.success("Opening your email client...");
  };

  const handleFeatureRequest = () => {
    window.location.href = "mailto:info@studibudi.com?subject=Feature%20Request";
    toast.success("Opening your email client...");
  };

  return (
    <div className="container mx-auto max-w-md pt-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Card className="glass">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Toggle dark mode appearance
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSupportContact}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Support
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleFeatureRequest}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              Feature Request
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;