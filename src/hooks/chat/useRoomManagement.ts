import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];

export const useRoomManagement = () => {
  const checkExistingRoom = async (roomId: string, userId: string) => {
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('participants')
      .eq('id', roomId)
      .single();

    if (!room?.participants) return null;

    if (room.participants.length >= 2 && !room.participants.includes(userId)) {
      toast.error("This room is full");
      return null;
    }

    return room;
  };

  const addFirstParticipant = async (roomId: string, userId: string) => {
    const { error: updateError } = await supabase
      .from('chat_rooms')
      .update({ participants: [userId] })
      .eq('id', roomId);

    if (updateError) {
      console.error('Error updating chat room:', updateError);
      throw updateError;
    }
  };

  return {
    checkExistingRoom,
    addFirstParticipant,
  };
};