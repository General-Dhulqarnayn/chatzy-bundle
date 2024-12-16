import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleStartChat = async () => {
    try {
      // Create a new chat room for all users
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([{ participants: [] }])
        .select('id')
        .single();

      if (roomError) throw roomError;
      if (!room) throw new Error('No room created');

      // Navigate to the chat room where matchmaking will happen
      navigate(`/chat/${room.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error("Failed to start chat. Please try again.");
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
          className="slide-up animation-delay-200 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleStartChat}
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          Start Chatting
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