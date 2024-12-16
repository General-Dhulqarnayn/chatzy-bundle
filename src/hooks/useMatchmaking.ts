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

  useEffect(() => {
    if (!userId) return;

    const setupMatchmaking = async () => {
      try {
        const room = await checkExistingRoom(roomId, userId);
        if (!room) return;

        console.log('Current room state:', room);
        
        // Check if this is a matched room (has 2 participants)
        const isMatchedRoom = room.participants.length === 2;
        const isUserParticipant = room.participants.includes(userId);

        if (isMatchedRoom && isUserParticipant) {
          console.log('Room is already matched and user is participant');
          setIsMatched(true);
          setIsSearching(false);
          return;
        }

        // If user is the only participant or room is empty, start searching
        if (room.participants.length <= 1) {
          console.log('Room needs matching, starting search');
          setIsSearching(true);
          
          // If room is empty, add user as first participant
          if (room.participants.length === 0) {
            console.log('Adding user as first participant');
            await addFirstParticipant(roomId, userId);
          }

          // Clean up any existing waiting room entries
          await removeFromWaitingRoom([userId]);

          // Start matchmaking process
          toast("Looking for someone to chat with...");
          await joinWaitingRoom(userId);
          const matchedUser = await findMatch(userId);

          if (matchedUser) {
            console.log('Found match:', matchedUser);
            const { error: updateError } = await supabase
              .from('chat_rooms')
              .update({ 
                participants: [userId, matchedUser.user_id] 
              })
              .eq('id', roomId);

            if (updateError) {
              console.error('Error updating chat room:', updateError);
              return;
            }

            await removeFromWaitingRoom([userId, matchedUser.user_id]);
            setIsMatched(true);
            setIsSearching(false);
            toast.success("Match found! You can now start chatting.");
          }
        }
      } catch (error) {
        console.error('Error in matchmaking setup:', error);
        toast.error("Failed to set up matchmaking");
      }
    };

    setupMatchmaking();

    // Subscribe to chat room changes
    const roomChannel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_rooms',
          filter: `id=eq.${roomId}`
        },
        (payload: RealtimePostgresChangesPayload<ChatRoom>) => {
          console.log('Room updated:', payload);
          const newData = payload.new as ChatRoom;
          
          if (newData && Array.isArray(newData.participants)) {
            const isUserParticipant = newData.participants.includes(userId);
            const hasTwoParticipants = newData.participants.length === 2;

            console.log('Real-time update - User participant:', isUserParticipant);
            console.log('Real-time update - Has two participants:', hasTwoParticipants);

            if (isUserParticipant && hasTwoParticipants) {
              console.log('Setting matched state for user:', userId);
              setIsMatched(true);
              setIsSearching(false);
              toast.success("Match found! You can now start chatting.");
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up matchmaking...');
      if (userId) {
        removeFromWaitingRoom([userId])
          .then(() => console.log('Cleaned up waiting room entry'))
          .catch((error) => console.error('Error cleaning up waiting room:', error));
      }
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, userId]);

  return { isMatched, isSearching };
};