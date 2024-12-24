import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { MessageSquare, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [supportOpen, setSupportOpen] = useState(false);
  const [featureOpen, setFeatureOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (type: "support" | "feature") => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { type, message, userEmail: email },
      });

      if (error) throw error;

      toast.success("Message sent successfully!");
      setMessage("");
      setEmail("");
      type === "support" ? setSupportOpen(false) : setFeatureOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
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
              onClick={() => setSupportOpen(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Support
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setFeatureOpen(true)}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              Feature Request
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
              Send us a message and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-email">Your Email (optional)</Label>
              <Input
                id="support-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-message">Message</Label>
              <Textarea
                id="support-message"
                placeholder="How can we help you?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleSubmit("support")}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={featureOpen} onOpenChange={setFeatureOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Request</DialogTitle>
            <DialogDescription>
              Share your ideas for new features or improvements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feature-email">Your Email (optional)</Label>
              <Input
                id="feature-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-message">Feature Description</Label>
              <Textarea
                id="feature-message"
                placeholder="Describe the feature you'd like to see..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleSubmit("feature")}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;