import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight slide-up">
          Start a New Chat
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto slide-up animation-delay-100">
          Connect with someone new and start a conversation. It's that simple.
        </p>
        <Button
          size="lg"
          className="slide-up animation-delay-200 glass hover:bg-primary/90"
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          Find New Chat
        </Button>
      </div>
    </div>
  );
};

export default Index;