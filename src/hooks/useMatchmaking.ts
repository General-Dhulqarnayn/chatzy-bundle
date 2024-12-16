import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useMatchmaking = (roomId: string, userId: string | undefined) => {
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const setupMatchmaking = async () => {
      try {
        // Clean up any existing waiting room entries
        await supabase
          .from('waiting_room')
          .delete()
          .eq('user_id', userId);

        // Add to waiting room
        const { error: waitingError } = await supabase
          .from('waiting_room')
          .insert([{ user_id: userId }]);

        if (waitingError) {
          console.error('Error joining waiting room:', waitingError);
          toast.error("Failed to join waiting room");
          return;
        }

        // Start looking for matches
        const { data: waitingUsers, error: matchError } = await supabase
          .from('waiting_room')
          .select('user_id')
          .neq('user_id', userId)
          .limit(1);

        if (matchError) {
          console.error('Error finding match:', matchError);
          return;
        }

        if (waitingUsers && waitingUsers.length > 0) {
          // Found a match! Update chat room with both participants
          const { error: updateError } = await supabase
            .from('chat_rooms')
            .update({ 
              participants: [userId, waitingUsers[0].user_id] 
            })
            .eq('id', roomId);

          if (updateError) {
            console.error('Error updating chat room:', updateError);
            return;
          }

          // Remove both users from waiting room
          await supabase
            .from('waiting_room')
            .delete()
            .in('user_id', [userId, waitingUsers[0].user_id]);

          setIsMatched(true);
          toast.success("Match found! You can now start chatting.");
        } else {
          toast("Looking for someone to chat with...");
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
        (payload) => {
          if (payload.new.participants?.length >= 2) {
            setIsMatched(true);
            toast.success("Match found! You can now start chatting.");
          }
        }
      )
      .subscribe();

    // Subscribe to waiting room changes
    const waitingChannel = supabase
      .channel('waiting_room')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waiting_room'
        },
        async () => {
          if (userId && !isMatched) {
            const { data: waitingUsers, error: matchError } = await supabase
              .from('waiting_room')
              .select('user_id')
              .neq('user_id', userId)
              .limit(1);

            if (matchError || !waitingUsers?.length) return;

            await supabase
              .from('chat_rooms')
              .update({ 
                participants: [userId, waitingUsers[0].user_id] 
              })
              .eq('id', roomId);

            await supabase
              .from('waiting_room')
              .delete()
              .in('user_id', [userId, waitingUsers[0].user_id]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(waitingChannel);
    };
  }, [roomId, userId, isMatched]);

  return { isMatched };
};