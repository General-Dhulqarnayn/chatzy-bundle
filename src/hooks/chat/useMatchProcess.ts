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
    if (!userId) {
      console.error('No user ID provided for matchmaking');
      return;
    }

    try {
      console.log('Starting matchmaking process for user:', userId);

      // First, check if the room exists and is available
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .select('participants')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('Error checking room:', roomError);
        throw roomError;
      }

      if (!room) {
        console.error('Room not found');
        toast.error("Chat room not found");
        navigate('/');
        return;
      }

      // If room is empty, add first participant
      if (!room.participants || room.participants.length === 0) {
        await addFirstParticipant(roomId, userId);
        console.log('Added as first participant');
      }

      // Clean up any existing waiting room entries for this user
      await removeFromWaitingRoom([userId]);
      console.log('Cleaned up existing waiting room entries');

      // Join waiting room
      await joinWaitingRoom(userId);
      console.log('Joined waiting room');

      // Look for a match with retries
      let matchAttempts = 0;
      const maxAttempts = 10; // Increased from 5 to 10 attempts
      const retryDelay = 2000; // 2 seconds between attempts
      let matchedUser = null;

      while (matchAttempts < maxAttempts && !matchedUser) {
        console.log(`Match attempt ${matchAttempts + 1} of ${maxAttempts}`);
        matchedUser = await findMatch(userId);
        
        if (!matchedUser) {
          matchAttempts++;
          if (matchAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      if (!matchedUser) {
        console.log('No match found after all attempts');
        toast.error("Couldn't find a match at this time. Please try again.");
        await removeFromWaitingRoom([userId]);
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
        console.log('Room is no longer available');
        toast.error("Room is no longer available");
        await removeFromWaitingRoom([userId]);
        navigate('/');
        return;
      }

      // Update room with both participants
      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update({ 
          participants: [userId, matchedUser.user_id]
        })
        .eq('id', roomId);

      if (updateError) {
        console.error('Error updating room:', updateError);
        throw updateError;
      }

      // Clean up waiting room
      await removeFromWaitingRoom([userId, matchedUser.user_id]);
      console.log('Cleaned up waiting room after successful match');
      
      toast.success("Match found! Starting chat...");
    } catch (error) {
      console.error('Error in matchmaking:', error);
      toast.error("Failed to set up matchmaking");
      await removeFromWaitingRoom([userId]);
      navigate('/');
    }
  };

  return { startMatchmaking };
};