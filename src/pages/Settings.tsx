import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  return (
    <div className="container mx-auto max-w-md pt-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Card className="glass">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive chat notifications
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sound</Label>
              <p className="text-sm text-muted-foreground">
                Play sound on new message
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Online Status</Label>
              <p className="text-sm text-muted-foreground">
                Show when you're online
              </p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;