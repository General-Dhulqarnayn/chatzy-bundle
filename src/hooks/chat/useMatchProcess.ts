import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useRoomManagement } from "./useRoomManagement";
import { useWaitingRoom } from "./useWaitingRoom";

export const useMatchProcess = (roomId: string, userId: string | undefined) => {
  const navigate = useNavigate();
  const { addFirstParticipant } = useRoomManagement();
  const { joinWaitingRoom, findMatch, removeFromWaitingRoom } = useWaitingRoom();

  const startMatchmaking = async () => {
    if (!userId) return;

    try {
      // Get current room state
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('participants')
        .eq('id', roomId)
        .single();

      if (!room) {
        console.error('Room not found');
        return;
      }

      // If room is empty, add first participant
      if (room.participants.length === 0) {
        await addFirstParticipant(roomId, userId);
        console.log('Added as first participant');
      }

      // Clean up any existing waiting room entries
      await removeFromWaitingRoom([userId]);

      // Join waiting room
      await joinWaitingRoom(userId);
      console.log('Joined waiting room');

      // Look for a match with retries
      let matchAttempts = 0;
      const maxAttempts = 5;
      let matchedUser = null;

      while (matchAttempts < maxAttempts && !matchedUser) {
        matchedUser = await findMatch(userId);
        if (!matchedUser) {
          matchAttempts++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between attempts
        }
      }

      if (!matchedUser) {
        toast.error("Couldn't find a match at this time. Please try again.");
        navigate('/');
        return;
      }

      console.log('Found match:', matchedUser);

      // Verify room is still available
      const { data: currentRoom } = await supabase
        .from('chat_rooms')
        .select('participants')
        .eq('id', roomId)
        .single();

      if (currentRoom?.participants.length === 2) {
        toast.error("Room is no longer available");
        navigate('/');
        return;
      }

      // Update room with both participants
      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update({ participants: [userId, matchedUser.user_id] })
        .eq('id', roomId);

      if (updateError) throw updateError;

      // Clean up waiting room
      await removeFromWaitingRoom([userId, matchedUser.user_id]);
      
      toast.success("Match found! Starting chat...");
    } catch (error) {
      console.error('Error in matchmaking:', error);
      toast.error("Failed to set up matchmaking");
      navigate('/');
    }
  };

  return { startMatchmaking };
};