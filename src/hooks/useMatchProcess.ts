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
      toast.error("User ID is required for matchmaking");
      return;
    }

    try {
      console.log('Starting matchmaking process:', { userId, roomId });

      // First verify the user exists in the users table
      const { data: userExists, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userCheckError || !userExists) {
        console.error('User not found in users table:', userCheckError);
        toast.error("Please try again in a moment");
        return;
      }

      // Check if the room exists and is available
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .select('participants, subject_category')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('Error checking room:', roomError);
        throw roomError;
      }

      if (!room) {
        console.error('Room not found:', roomId);
        toast.error("Chat room not found");
        navigate('/');
        return;
      }

      console.log('Current room state:', room);

      // If room already has participants, verify if current user is one of them
      if (room.participants && room.participants.length > 0) {
        if (room.participants.includes(userId)) {
          console.log('User already in room');
          return;
        }
        if (room.participants.length >= 2) {
          console.log('Room is full');
          toast.error("This room is already full");
          navigate('/');
          return;
        }
      }

      // If room is empty, add first participant
      if (!room.participants || room.participants.length === 0) {
        console.log('Adding first participant to room');
        await addFirstParticipant(roomId, userId);
      }

      // Clean up any existing waiting room entries
      console.log('Cleaning up existing waiting room entries');
      await removeFromWaitingRoom([userId]);

      // Join waiting room
      console.log('Joining waiting room');
      await joinWaitingRoom(userId);

      // Look for a match with retries
      let matchAttempts = 0;
      const maxAttempts = 15;
      const retryDelay = 2000;
      let matchedUser = null;

      while (matchAttempts < maxAttempts && !matchedUser) {
        console.log(`Match attempt ${matchAttempts + 1} of ${maxAttempts}`);
        matchedUser = await findMatch(userId, roomId); // Pass both userId and roomId
        
        if (!matchedUser) {
          matchAttempts++;
          if (matchAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      if (!matchedUser) {
        console.log('No match found after all attempts');
        toast.error("Couldn't find a match. Please try again.");
        await removeFromWaitingRoom([userId]);
        navigate('/');
        return;
      }

      console.log('Match found:', matchedUser);

      // Verify room is still available
      const { data: currentRoom } = await supabase
        .from('chat_rooms')
        .select('participants')
        .eq('id', roomId)
        .single();

      if (!currentRoom) {
        console.error('Room no longer exists');
        toast.error("Chat room no longer exists");
        await removeFromWaitingRoom([userId]);
        navigate('/');
        return;
      }

      if (currentRoom.participants.length >= 2) {
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
          participants: [
            ...currentRoom.participants.filter((p: string) => p !== matchedUser.user_id),
            userId,
            matchedUser.user_id
          ]
        })
        .eq('id', roomId);

      if (updateError) {
        console.error('Error updating room:', updateError);
        throw updateError;
      }

      console.log('Successfully updated room with both participants');

      // Clean up waiting room
      await removeFromWaitingRoom([userId, matchedUser.user_id]);
      
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