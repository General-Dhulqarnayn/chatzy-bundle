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
        .single();

      if (!currentRoom) {
        toast.error("Room not found");
        return false;
      }

      // Update room with new participant
      const updatedParticipants = [...(currentRoom.participants || []), userId];
      
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

  return { joinExistingRoom };
};