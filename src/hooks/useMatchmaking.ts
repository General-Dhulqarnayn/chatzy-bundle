import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { useRoomManagement } from "./chat/useRoomManagement";
import { useWaitingRoom } from "./chat/useWaitingRoom";
import { useNavigate } from "react-router-dom";

type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];

export const useMatchmaking = (roomId: string, userId: string | undefined) => {
  const [isMatched, setIsMatched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { addFirstParticipant } = useRoomManagement();
  const { joinWaitingRoom, findMatch, removeFromWaitingRoom } = useWaitingRoom();
  const navigate = useNavigate();

  // Function to check if room is matched
  const checkRoomStatus = async () => {
    if (!userId) return;
    
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('participants')
      .eq('id', roomId)
      .single();

    console.log('Room status:', room);

    if (room?.participants && Array.isArray(room.participants)) {
      const isUserInRoom = room.participants.includes(userId);
      const hasTwoParticipants = room.participants.length === 2;

      console.log('Room check:', {
        roomId,
        participants: room.participants,
        isUserInRoom,
        hasTwoParticipants
      });

      if (isUserInRoom && hasTwoParticipants) {
        setIsMatched(true);
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    if (!userId || !roomId) return;

    const initializeRoom = async () => {
      console.log('Initializing room:', { roomId, userId });
      
      // Get current room state
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('participants')
        .eq('id', roomId)
        .single();

      console.log('Initial room state:', room);

      if (!room) {
        console.error('Room not found');
        return;
      }

      // If room is already matched, just set the state
      if (room.participants.length === 2) {
        if (room.participants.includes(userId)) {
          setIsMatched(true);
          setIsSearching(false);
        } else {
          // If room is full and user is not in it, redirect them to create a new room
          navigate('/');
          toast.error("This room is full");
        }
        return;
      }

      // If room has one participant and it's not the current user, join this room
      if (room.participants.length === 1 && !room.participants.includes(userId)) {
        try {
          const { error: updateError } = await supabase
            .from('chat_rooms')
            .update({ participants: [...room.participants, userId] })
            .eq('id', roomId);

          if (updateError) throw updateError;
          
          await checkRoomStatus();
          return;
        } catch (error) {
          console.error('Error joining room:', error);
          toast.error("Failed to join room");
          return;
        }
      }

      // If room is empty or user is the only participant, start matchmaking process
      if (room.participants.length === 0 || (room.participants.length === 1 && room.participants.includes(userId))) {
        setIsSearching(true);
        
        try {
          // Add first participant if room is empty
          if (room.participants.length === 0) {
            await addFirstParticipant(roomId, userId);
            console.log('Added first participant');
          }
          
          // Remove from waiting room if present
          await removeFromWaitingRoom([userId]);
          
          // Join waiting room
          await joinWaitingRoom(userId);
          console.log('Joined waiting room');
          
          toast("Looking for someone to chat with...");
          
          // Look for a match
          const matchedUser = await findMatch(userId);
          console.log('Found match:', matchedUser);
          
          if (matchedUser) {
            // Update room with both participants
            const { error: updateError } = await supabase
              .from('chat_rooms')
              .update({ participants: [userId, matchedUser.user_id] })
              .eq('id', roomId);

            if (updateError) {
              console.error('Error updating room:', updateError);
              return;
            }

            // Clean up waiting room
            await removeFromWaitingRoom([userId, matchedUser.user_id]);
            
            // Check final room status
            await checkRoomStatus();
          }
        } catch (error) {
          console.error('Error in matchmaking:', error);
          toast.error("Failed to set up matchmaking");
        }
      }
    };

    // Set up real-time subscription
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_rooms',
          filter: `id=eq.${roomId}`
        },
        async (payload: RealtimePostgresChangesPayload<ChatRoom>) => {
          console.log('Room update received:', payload);
          await checkRoomStatus();
        }
      )
      .subscribe();

    // Initialize room
    initializeRoom();
    
    // Initial room status check
    checkRoomStatus();

    return () => {
      console.log('Cleaning up matchmaking...');
      if (userId) {
        removeFromWaitingRoom([userId])
          .catch(error => console.error('Error cleaning up waiting room:', error));
      }
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  return { isMatched, isSearching };
};