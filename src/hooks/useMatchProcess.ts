import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useWaitingRoom } from "./chat/useWaitingRoom";

export const useMatchProcess = (roomId: string, userId: string | undefined) => {
  const navigate = useNavigate();
  const { joinWaitingRoom, findMatch, removeFromWaitingRoom } = useWaitingRoom();

  const startMatchmaking = async () => {
    if (!userId) {
      toast.error("User ID is required for matchmaking");
      return;
    }

    try {
      // Join waiting room
      await joinWaitingRoom(userId);

      // Look for a match
      const matchedUser = await findMatch(userId);
      
      if (!matchedUser) {
        await removeFromWaitingRoom([userId]);
        toast.error("Couldn't find a match. Please try again.");
        navigate('/');
        return;
      }

      // Get the existing room ID from the matched user
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .contains('participants', [matchedUser.user_id])
        .single();

      const targetRoomId = existingRoom?.id || roomId;

      // Update room with both participants
      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update({ 
          participants: [userId, matchedUser.user_id]
        })
        .eq('id', targetRoomId);

      if (updateError) {
        await removeFromWaitingRoom([userId]);
        throw updateError;
      }

      // Only remove from waiting room after successful match
      await removeFromWaitingRoom([userId, matchedUser.user_id]);
      
      // Navigate to the correct room
      if (targetRoomId !== roomId) {
        navigate(`/chat/${targetRoomId}`, { replace: true });
      }
      
      toast.success("Match found! Starting chat...");
    } catch (error) {
      console.error('Error in matchmaking:', error);
      toast.error("Failed to set up matchmaking");
      if (userId) {
        await removeFromWaitingRoom([userId]);
      }
      navigate('/');
    }
  };

  return { startMatchmaking };
};