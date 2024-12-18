import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWaitingRoom = () => {
  const joinWaitingRoom = async (userId: string) => {
    try {
      console.log('Attempting to join waiting room:', userId);
      
      // First check if user is already in waiting room
      const { data: existing, error: checkError } = await supabase
        .from('waiting_room')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking waiting room:', checkError);
        throw checkError;
      }

      // If user is already in waiting room, don't add them again
      if (existing) {
        console.log('User already in waiting room');
        return;
      }

      const { error: insertError } = await supabase
        .from('waiting_room')
        .insert([{ user_id: userId }]);

      if (insertError) {
        console.error('Error joining waiting room:', insertError);
        toast.error("Failed to join waiting room");
        throw insertError;
      }

      console.log('Successfully joined waiting room');
    } catch (error) {
      console.error('Error in joinWaitingRoom:', error);
      throw error;
    }
  };

  const findMatch = async (userId: string) => {
    try {
      console.log('Looking for match for user:', userId);
      
      // Get all waiting users except current user, ordered by creation time
      const { data: waitingUsers, error: matchError } = await supabase
        .from('waiting_room')
        .select('id, user_id, created_at')
        .neq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (matchError) {
        console.error('Error finding match:', matchError);
        return null;
      }

      console.log('Available matches:', waitingUsers);

      return waitingUsers;
    } catch (error) {
      console.error('Error in findMatch:', error);
      return null;
    }
  };

  const removeFromWaitingRoom = async (userIds: string[]) => {
    if (!userIds.length) return;
    
    try {
      console.log('Removing users from waiting room:', userIds);
      
      const { error } = await supabase
        .from('waiting_room')
        .delete()
        .in('user_id', userIds);

      if (error) {
        console.error('Error removing from waiting room:', error);
        return;
      }

      console.log('Successfully removed users from waiting room');
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