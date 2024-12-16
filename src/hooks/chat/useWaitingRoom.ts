import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWaitingRoom = () => {
  const joinWaitingRoom = async (userId: string) => {
    const { error: waitingError } = await supabase
      .from('waiting_room')
      .insert([{ user_id: userId }]);

    if (waitingError) {
      console.error('Error joining waiting room:', waitingError);
      toast.error("Failed to join waiting room");
      throw waitingError;
    }
  };

  const findMatch = async (userId: string) => {
    const { data: waitingUsers, error: matchError } = await supabase
      .from('waiting_room')
      .select('user_id')
      .neq('user_id', userId)
      .limit(1);

    if (matchError) {
      console.error('Error finding match:', matchError);
      throw matchError;
    }

    return waitingUsers?.[0] || null;
  };

  const removeFromWaitingRoom = async (userIds: string[]) => {
    await supabase
      .from('waiting_room')
      .delete()
      .in('user_id', userIds);
  };

  return {
    joinWaitingRoom,
    findMatch,
    removeFromWaitingRoom,
  };
};