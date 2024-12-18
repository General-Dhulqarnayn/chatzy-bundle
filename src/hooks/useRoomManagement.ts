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

      // Ensure participants is an array and properly formatted for Postgres
      const updatedParticipants = Array.isArray(currentRoom.participants) 
        ? [...currentRoom.participants, userId]
        : [userId];
      
      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update({ 
          participants: updatedParticipants 
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
      // Query for rooms with less than 2 participants using array length
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('subject_category', category)
        .filter('participants', 'cs', '{}')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error finding room:', error);
        return null;
      }

      return room;
    } catch (error) {
      console.error('Error finding room:', error);
      return null;
    }
  };

  return { joinExistingRoom, findAvailableRoom };
};