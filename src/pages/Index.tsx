import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're coming from a chat route
  const isFromChat = location.state?.from?.includes('/chat/');
  const previousChatId = isFromChat ? location.state.from.split('/chat/')[1] : null;

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

  // If user was in a chat and didn't explicitly choose to start a new one,
  // redirect them back to their chat
  useEffect(() => {
    if (previousChatId) {
      navigate(`/chat/${previousChatId}`);
    }
  }, [previousChatId, navigate]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight slide-up">
          {previousChatId ? "Return to Chat or Start New" : "Start a New Chat"}
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto slide-up animation-delay-100">
          {session 
            ? "Connect with someone new and start a conversation. It's that simple."
            : "Try it out as a guest or sign in to access all features."}
        </p>
        <div className="space-y-4 slide-up animation-delay-200">
          {previousChatId && (
            <Button
              size="lg"
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => navigate(`/chat/${previousChatId}`)}
            >
              Return to Current Chat
            </Button>
          )}
          <Button
            size="lg"
            className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleStartChat}
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Start New Chat
          </Button>
        </div>
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