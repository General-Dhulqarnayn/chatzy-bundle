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

  const handleJoinRoom = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to join a room");
      return;
    }

    try {
      setIsJoining(true);
      console.log('Joining room for category:', selectedCategory);
      
      const roomId = ROOM_IDS[selectedCategory];
      
      // Check if room exists, if not create it
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (!existingRoom) {
        console.log('Creating permanent room for category:', selectedCategory);
        const { error: createError } = await supabase
          .from('chat_rooms')
          .insert([{
            id: roomId,
            subject_category: selectedCategory,
            participants: [session.user.id]
          }]);

        if (createError) throw createError;
      } else {
        // Add user to existing room if not already present
        const currentParticipants = existingRoom.participants || [];
        if (!currentParticipants.includes(session.user.id)) {
          const { error: updateError } = await supabase
            .from('chat_rooms')
            .update({
              participants: [...currentParticipants, session.user.id]
            })
            .eq('id', roomId);

          if (updateError) throw updateError;
        }
      }

      console.log('Successfully joined room:', roomId);
      toast.success("Room joined successfully!");
      navigate(`/chat/${roomId}`);

    } catch (error) {
      console.error('Error joining room:', error);
      toast.error("Failed to join room. Please try again.");
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
              Join Room
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