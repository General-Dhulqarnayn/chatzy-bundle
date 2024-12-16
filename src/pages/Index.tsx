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
      // If not logged in, create a temporary entry in waiting room
      if (!session) {
        const tempId = crypto.randomUUID();
        // Add directly to waiting room with temporary ID
        const { error: waitingError } = await supabase
          .from('waiting_room')
          .insert([{ user_id: tempId }]);

        if (waitingError) throw waitingError;

        // Start listening for matches
        listenForMatch(tempId);
      } else {
        // Add authenticated user to waiting room
        const { error: waitingError } = await supabase
          .from('waiting_room')
          .insert([{ user_id: session.user.id }]);

        if (waitingError) throw waitingError;

        // Start listening for matches
        listenForMatch(session.user.id);
      }

      toast("Looking for someone to chat with...");
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error("Failed to start chat. Please try again.");
    }
  };

  const listenForMatch = (userId: string) => {
    const channel = supabase
      .channel('chat-matching')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_rooms',
          filter: `participants=cs.{${userId}}`
        },
        (payload) => {
          console.log('Match found:', payload);
          // Navigate to chat room when match is found
          if (payload.new && payload.new.id) {
            navigate(`/chat/${payload.new.id}`);
          }
        }
      )
      .subscribe();

    // Clean up subscription when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
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