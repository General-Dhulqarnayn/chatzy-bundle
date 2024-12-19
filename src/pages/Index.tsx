import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RoomSelectionForm from "@/components/chat/RoomSelectionForm";

const ROOM_IDS = {
  general: 'general-room',
  maths: 'maths-room',
  english: 'english-room',
  science: 'science-room'
};

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = React.useState('general');
  const [isJoining, setIsJoining] = React.useState(false);
  const [joinCount, setJoinCount] = React.useState(0);

  const handleJoinRoom = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to join a room");
      return;
    }

    try {
      setIsJoining(true);
      console.log('Join attempt count:', joinCount, 'Creating room:', joinCount % 2 === 0);
      
      const roomId = ROOM_IDS[selectedCategory];

      // Check if room exists
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

      // If it's an even number (including 0), create a new room
      if (joinCount % 2 === 0) {
        console.log('Creating new room for category:', selectedCategory);
        if (!existingRoom) {
          const { error: createError } = await supabase
            .from('chat_rooms')
            .insert([{
              id: roomId,
              subject_category: selectedCategory,
              participants: [session.user.id]
            }]);

          if (createError) {
            console.error('Error creating room:', createError);
            throw createError;
          }
        } else {
          // Reset participants if room exists
          const { error: updateError } = await supabase
            .from('chat_rooms')
            .update({
              participants: [session.user.id]
            })
            .eq('id', roomId);

          if (updateError) {
            console.error('Error updating room:', updateError);
            throw updateError;
          }
        }
      } else {
        // Odd number - join existing room if possible
        if (!existingRoom) {
          toast.error("No room available to join. Try again!");
          return;
        }

        const currentParticipants = existingRoom.participants || [];
        if (currentParticipants.length >= 2) {
          toast.error("Room is full. Try again!");
          return;
        }

        if (!currentParticipants.includes(session.user.id)) {
          const { error: updateError } = await supabase
            .from('chat_rooms')
            .update({
              participants: [...currentParticipants, session.user.id]
            })
            .eq('id', roomId);

          if (updateError) {
            console.error('Error updating room:', updateError);
            throw updateError;
          }
        }
      }

      setJoinCount(prev => prev + 1);
      console.log('Successfully processed room action:', roomId);
      toast.success(joinCount % 2 === 0 ? "Room created successfully!" : "Room joined successfully!");
      navigate(`/chat/${roomId}`);

    } catch (error) {
      console.error('Error processing room action:', error);
      toast.error("Failed to process room action. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight slide-up">
          Join a Chat Room
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto slide-up animation-delay-100">
          {session 
            ? "Select a subject and join a room to start chatting."
            : "Try it out as a guest or sign in to access all features."}
        </p>
        
        <div className="max-w-xs mx-auto space-y-6 slide-up animation-delay-200">
          <RoomSelectionForm 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full"
              onClick={handleJoinRoom}
              disabled={isJoining}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              {isJoining ? "Processing..." : (joinCount % 2 === 0 ? "Create Room" : "Join Room")}
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