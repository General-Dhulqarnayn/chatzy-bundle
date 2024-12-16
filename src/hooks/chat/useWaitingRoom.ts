import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWaitingRoom = () => {
  const joinWaitingRoom = async (userId: string) => {
    try {
      // First check if user is already in waiting room
      const { data: existing } = await supabase
        .from('waiting_room')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // User is already in waiting room, no need to add them again
        return;
      }

      const { error: waitingError } = await supabase
        .from('waiting_room')
        .insert([{ user_id: userId }]);

      if (waitingError) {
        console.error('Error joining waiting room:', waitingError);
        toast.error("Failed to join waiting room");
        throw waitingError;
      }
    } catch (error) {
      console.error('Error in joinWaitingRoom:', error);
      throw error;
    }
  };

  const findMatch = async (userId: string) => {
    try {
      // Get the earliest waiting user that isn't the current user
      const { data: waitingUsers, error: matchError } = await supabase
        .from('waiting_room')
        .select('user_id')
        .neq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1);

      if (matchError) {
        console.error('Error finding match:', matchError);
        throw matchError;
      }

      return waitingUsers?.[0] || null;
    } catch (error) {
      console.error('Error in findMatch:', error);
      throw error;
    }
  };

  const removeFromWaitingRoom = async (userIds: string[]) => {
    try {
      const { error } = await supabase
        .from('waiting_room')
        .delete()
        .in('user_id', userIds);

      if (error) {
        console.error('Error removing from waiting room:', error);
      }
    } catch (error) {
      console.error('Error in removeFromWaitingRoom:', error);
    }
  };

  return {
    joinWaitingRoom,
    findMatch,
    removeFromWaitingRoom,
  };
};