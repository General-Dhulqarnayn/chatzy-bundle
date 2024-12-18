import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRoomManagement = () => {
  const joinExistingRoom = async (roomId: string, userId: string) => {
    try {
      console.log('Attempting to join room:', { roomId, userId });
      
      // First get current participants
      const { data: currentRoom } = await supabase
        .from('chat_rooms')
        .select('participants')
        .eq('id', roomId)
        .maybeSingle();

      if (!currentRoom) {
        console.log('Room not found');
        return false;
      }

      // Ensure participants is an array and remove duplicates
      const currentParticipants = Array.isArray(currentRoom.participants) ? currentRoom.participants : [];
      const uniqueParticipants = [...new Set([...currentParticipants, userId])];
      
      console.log('Current room state:', { currentParticipants, uniqueParticipants });
      
      // Only allow max 2 participants
      if (uniqueParticipants.length > 2) {
        console.log('Room is full');
        return false;
      }
      
      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update({ 
          participants: uniqueParticipants 
        })
        .eq('id', roomId);

      if (updateError) {
        console.error('Error updating room:', updateError);
        return false;
      }

      console.log('Successfully joined room');
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      return false;
    }
  };

  const findAvailableRoom = async (category: string) => {
    try {
      console.log('Looking for available room in category:', category);
      
      // Get rooms in the specified category with exactly one participant
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('subject_category', category)
        .not('participants', 'is', null);

      if (error) {
        console.error('Error finding room:', error);
        return null;
      }

      // Find a room with exactly one participant
      const availableRoom = rooms?.find(room => 
        Array.isArray(room.participants) && 
        room.participants.length === 1 &&
        room.participants[0] !== null // Ensure the participant is valid
      );

      console.log('Available room found:', availableRoom);
      return availableRoom || null;
    } catch (error) {
      console.error('Error finding room:', error);
      return null;
    }
  };

  return { joinExistingRoom, findAvailableRoom };
};