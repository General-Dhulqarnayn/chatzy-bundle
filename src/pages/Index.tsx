import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Calculator, BookOpen, Beaker, PlusCircle, UserPlus } from "lucide-react";
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
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const previousChatId = location.state?.from?.split('/chat/')?.[1];

  useEffect(() => {
    if (previousChatId) {
      navigate(`/chat/${previousChatId}`);
    }
  }, [previousChatId, navigate]);

  const handleCreateRoom = async () => {
    try {
      setIsCreatingRoom(true);
      toast.loading("Creating room and waiting for participants...");

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

      // Start checking for participants
      let attempts = 0;
      const maxAttempts = 20; // 20 seconds
      const checkInterval = setInterval(async () => {
        const { data: updatedRoom, error: checkError } = await supabase
          .from('chat_rooms')
          .select('participants')
          .eq('id', room.id)
          .single();

        if (checkError) {
          console.error('Error checking room:', checkError);
          return;
        }

        attempts++;

        // If someone joined or we've waited too long
        if (updatedRoom?.participants?.length >= 2 || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setIsCreatingRoom(false);
          
          if (attempts >= maxAttempts && (!updatedRoom?.participants || updatedRoom.participants.length < 2)) {
            // Clean up the room if no one joined
            await supabase
              .from('chat_rooms')
              .delete()
              .eq('id', room.id);
            
            toast.dismiss();
            toast.error("No one joined the room. Please try again.");
            return;
          }

          // If someone joined, navigate to the chat
          toast.dismiss();
          toast.success("Room created successfully!");
          navigate(`/chat/${room.id}`, { replace: true });
        }
      }, 1000); // Check every second

    } catch (error) {
      console.error('Error creating room:', error);
      toast.error("Failed to create room. Please try again.");
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    try {
      const { data: availableRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('subject_category', selectedCategory)
        .lt('participants', 2)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (roomError && roomError.code !== 'PGRST116') {
        throw roomError;
      }

      if (!availableRoom) {
        toast.error("No available rooms found. Try creating one!");
        return;
      }

      navigate(`/chat/${availableRoom.id}`, { replace: true });
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error("Failed to join room. Please try again.");
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
                <Beaker className="h-4 w-4" />
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
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="w-full"
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Room
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={handleJoinRoom}
                disabled={isCreatingRoom}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Join Room
              </Button>
            </div>
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