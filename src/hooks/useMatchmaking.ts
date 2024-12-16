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

        if (room.participants.includes(userId) && room.participants.length === 2) {
          setIsMatched(true);
          setIsSearching(false);
          return;
        }

        if (room.participants.includes(userId) && room.participants.length === 1) {
          setIsSearching(true);
        }

        if (room.participants.length === 0) {
          await addFirstParticipant(roomId, userId);
          setIsSearching(true);
        }

        // Clean up any existing waiting room entries
        await removeFromWaitingRoom([userId]);

        if (!isMatched) {
          setIsSearching(true);
          toast("Looking for someone to chat with...");

          await joinWaitingRoom(userId);
          const matchedUser = await findMatch(userId);

          if (matchedUser) {
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
            if (newData.participants.includes(userId) && newData.participants.length === 2) {
              setIsMatched(true);
              setIsSearching(false);
              toast.success("Match found! You can now start chatting.");
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (userId) {
        removeFromWaitingRoom([userId])
          .then(() => console.log('Cleaned up waiting room entry'))
          .catch((error) => console.error('Error cleaning up waiting room:', error));
      }
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, userId, isMatched]);

  return { isMatched, isSearching };
};