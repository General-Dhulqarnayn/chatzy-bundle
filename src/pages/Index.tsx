import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleStartChat = () => {
    if (!session) {
      navigate("/profile");
    } else {
      // Handle starting a chat (this will be implemented later)
      console.log("Starting chat...");
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight slide-up">
          Start a New Chat
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto slide-up animation-delay-100">
          {session 
            ? "Connect with someone new and start a conversation. It's that simple."
            : "Try it out as a guest or sign in to access all features."}
        </p>
        <Button
          size="lg"
          className="slide-up animation-delay-200 glass hover:bg-primary/90"
          onClick={handleStartChat}
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          {session ? "Find New Chat" : "Try as Guest"}
        </Button>
        {!session && (
          <p className="text-sm text-muted-foreground slide-up animation-delay-300">
            Sign in to access all features and save your chats
          </p>
        )}
      </div>
    </div>
  );
};

export default Index;