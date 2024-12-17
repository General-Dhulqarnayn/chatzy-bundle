import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Calculator, BookOpen, Flask } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('general');

  // Check if we're coming from a chat route
  const previousChatId = location.state?.from?.split('/chat/')?.[1];

  useEffect(() => {
    // If user was in a chat and didn't explicitly choose to start a new one,
    // redirect them back to their chat
    if (previousChatId) {
      navigate(`/chat/${previousChatId}`);
    }
  }, [previousChatId, navigate]);

  const handleStartChat = async () => {
    try {
      // Create a new chat room with selected category
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([{ 
          participants: [],
          subject_category: selectedCategory 
        }])
        .select('id')
        .single();

      if (roomError) throw roomError;
      if (!room) throw new Error('No room created');

      // Navigate to the chat room where matchmaking will happen
      navigate(`/chat/${room.id}`, { replace: true });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error("Failed to start chat. Please try again.");
    }
  };

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
        
        <div className="max-w-xs mx-auto space-y-6 slide-up animation-delay-200">
          <RadioGroup
            defaultValue="general"
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="general" id="general" />
              <Label htmlFor="general" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>General</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="maths" id="maths" />
              <Label htmlFor="maths" className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Maths</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="english" id="english" />
              <Label htmlFor="english" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>English</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="science" id="science" />
              <Label htmlFor="science" className="flex items-center space-x-2">
                <Flask className="h-4 w-4" />
                <span>Science</span>
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-4">
            {previousChatId && (
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/chat/${previousChatId}`)}
              >
                Return to Current Chat
              </Button>
            )}
            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleStartChat}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Start New Chat
            </Button>
          </div>
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