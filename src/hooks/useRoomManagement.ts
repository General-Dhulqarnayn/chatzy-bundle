import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRoomManagement = () => {
  const joinExistingRoom = async (roomId: string, userId: string) => {
    try {
      // First get current participants
      const { data: currentRoom } = await supabase
        .from('chat_rooms')
        .select('participants')
        .eq('id', roomId)
        .maybeSingle();

      if (!currentRoom) {
        toast.error("Room not found");
        return false;
      }

      // Ensure participants is an array and remove duplicates
      const currentParticipants = Array.isArray(currentRoom.participants) ? currentRoom.participants : [];
      const uniqueParticipants = [...new Set([...currentParticipants, userId])];
      
      // Only allow max 2 participants
      if (uniqueParticipants.length > 2) {
        toast.error("Room is full");
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
        toast.error("Failed to join room");
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error("Failed to join room");
      return false;
    }
  };

  const findAvailableRoom = async (category: string) => {
    try {
      // Query for rooms with exactly one participant
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('subject_category', category)
        .neq('participants', '{}')  // Not empty
        .filter('participants', 'cs', '{1}')  // Has exactly one participant
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error finding room:', error);
        return null;
      }

      return rooms;
    } catch (error) {
      console.error('Error finding room:', error);
      return null;
    }
  };

  return { joinExistingRoom, findAvailableRoom };
};