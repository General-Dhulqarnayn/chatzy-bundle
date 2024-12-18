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

      // Try finding a match for 20 seconds
      let matchedUser = null;
      let attempts = 0;
      const maxAttempts = 20; // 20 attempts with 1 second delay = 20 seconds
      
      while (!matchedUser && attempts < maxAttempts) {
        console.log(`Match attempt ${attempts + 1} of ${maxAttempts}`);
        matchedUser = await findMatch(userId);
        if (!matchedUser) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
          attempts++;
        }
      }

      if (!matchedUser) {
        await removeFromWaitingRoom([userId]);
        toast.error("Couldn't find a match after 20 seconds. Please try again.");
        navigate('/');
        return;
      }

      // Let the first user (who's been waiting longer) be the room creator
      const shouldCreateRoom = matchedUser.created_at > new Date().toISOString();
      const targetRoomId = shouldCreateRoom ? roomId : matchedUser.room_id;

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