import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWaitingRoom = () => {
  const joinWaitingRoom = async (userId: string) => {
    try {
      console.log('Attempting to join waiting room:', userId);
      
      // First check if user is already in waiting room
      const { data: existing, error: checkError } = await supabase
        .from('waiting_room')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking waiting room:', checkError);
        throw checkError;
      }

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
      
      // Get all waiting users except current user
      const { data: waitingUsers, error: matchError } = await supabase
        .from('waiting_room')
        .select('*')
        .neq('user_id', userId)
        .limit(1)
        .order('created_at', { ascending: true });

      if (matchError) {
        console.error('Error finding match:', matchError);
        throw matchError;
      }

      console.log('Available matches:', waitingUsers);

      if (waitingUsers && waitingUsers.length > 0) {
        console.log('Found potential match:', waitingUsers[0]);
        return waitingUsers[0];
      }

      console.log('No matches found');
      return null;
    } catch (error) {
      console.error('Error in findMatch:', error);
      throw error;
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
        throw error;
      }

      console.log('Successfully removed users from waiting room');
    } catch (error) {
      console.error('Error in removeFromWaitingRoom:', error);
      // Don't throw here as this is often called during cleanup
    }
  };

  return {
    joinWaitingRoom,
    findMatch,
    removeFromWaitingRoom,
  };
};