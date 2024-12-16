import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { useRoomManagement } from "./chat/useRoomManagement";
import { useWaitingRoom } from "./chat/useWaitingRoom";

type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];

export const useMatchmaking = (roomId: string, userId: string | undefined) => {
  const [isMatched, setIsMatched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { checkExistingRoom, addFirstParticipant } = useRoomManagement();
  const { joinWaitingRoom, findMatch, removeFromWaitingRoom } = useWaitingRoom();

  // Function to check if room is matched
  const checkRoomStatus = async () => {
    if (!userId) return;
    
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('participants')
      .eq('id', roomId)
      .single();

    if (room && Array.isArray(room.participants)) {
      const isUserInRoom = room.participants.includes(userId);
      const hasTwoParticipants = room.participants.length === 2;

      console.log('Room status check:', {
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
    if (!userId) return;

    const setupMatchmaking = async () => {
      try {
        // Initial room check
        const room = await checkExistingRoom(roomId, userId);
        if (!room) return;

        // If room is already matched and user is participant, set matched state
        if (room.participants.length === 2 && room.participants.includes(userId)) {
          setIsMatched(true);
          setIsSearching(false);
          return;
        }

        // Start searching process
        setIsSearching(true);

        // If room is empty, add as first participant
        if (room.participants.length === 0) {
          await addFirstParticipant(roomId, userId);
          await removeFromWaitingRoom([userId]);
          toast("Looking for someone to chat with...");
          await joinWaitingRoom(userId);
          
          const matchedUser = await findMatch(userId);
          if (matchedUser) {
            await supabase
              .from('chat_rooms')
              .update({ participants: [userId, matchedUser.user_id] })
              .eq('id', roomId);

            await removeFromWaitingRoom([userId, matchedUser.user_id]);
            await checkRoomStatus(); // Check room status after update
          }
        }
      } catch (error) {
        console.error('Error in matchmaking setup:', error);
        toast.error("Failed to set up matchmaking");
      }
    };

    setupMatchmaking();

    // Subscribe to room changes
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
          await checkRoomStatus(); // Check room status on every update
        }
      )
      .subscribe();

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