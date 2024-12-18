import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RoomSelectionForm from "@/components/chat/RoomSelectionForm";
import { useRoomManagement } from "@/hooks/useRoomManagement";

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const { findAvailableRoom, joinExistingRoom } = useRoomManagement();

  const handleCreateRoom = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to create a room");
      return;
    }

    try {
      setIsCreatingRoom(true);
      const toastId = toast.loading("Creating room and waiting for participants...");

      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([{ 
          participants: [session.user.id],
          subject_category: selectedCategory 
        }])
        .select('id')
        .single();

      if (roomError) throw roomError;
      if (!room) throw new Error('No room created');

      // Wait for 20 seconds for someone to join
      setTimeout(async () => {
        const { data: updatedRoom } = await supabase
          .from('chat_rooms')
          .select('participants')
          .eq('id', room.id)
          .single();

        if (!updatedRoom || updatedRoom.participants.length < 2) {
          // Delete the room if no one joined
          await supabase
            .from('chat_rooms')
            .delete()
            .eq('id', room.id);
          
          toast.dismiss(toastId);
          toast.error("No one joined the room. Please try again.");
          setIsCreatingRoom(false);
          return;
        }

        toast.dismiss(toastId);
        toast.success("Room created and participant joined!");
        navigate(`/chat/${room.id}`, { replace: true });
      }, 20000);

    } catch (error) {
      console.error('Error creating room:', error);
      toast.error("Failed to create room. Please try again.");
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to join a room");
      return;
    }

    try {
      setIsJoiningRoom(true);
      const toastId = toast.loading("Searching for available rooms...");
      
      // Try to find a room for 20 seconds
      const startTime = Date.now();
      const timeoutDuration = 20000; // 20 seconds
      
      const findRoom = async () => {
        const availableRoom = await findAvailableRoom(selectedCategory);
        
        if (availableRoom) {
          const success = await joinExistingRoom(availableRoom.id, session.user.id);
          if (success) {
            toast.dismiss(toastId);
            toast.success("Room joined successfully!");
            navigate(`/chat/${availableRoom.id}`, { replace: true });
            return true;
          }
        }
        
        // Check if we've been searching for less than 20 seconds
        if (Date.now() - startTime < timeoutDuration) {
          // Wait for 1 second before trying again
          await new Promise(resolve => setTimeout(resolve, 1000));
          return findRoom();
        }
        
        return false;
      };
      
      const found = await findRoom();
      
      if (!found) {
        toast.dismiss(toastId);
        toast.error("No available rooms found after 20 seconds. Please try again or create a new room.");
      }
      
      setIsJoiningRoom(false);
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error("Failed to join room. Please try again.");
      setIsJoiningRoom(false);
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
        
        <div className="max-w-xs mx-auto space-y-6 slide-up animation-delay-200">
          <RoomSelectionForm 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="w-full"
                onClick={handleCreateRoom}
                disabled={isCreatingRoom || isJoiningRoom}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Room
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={handleJoinRoom}
                disabled={isCreatingRoom || isJoiningRoom}
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