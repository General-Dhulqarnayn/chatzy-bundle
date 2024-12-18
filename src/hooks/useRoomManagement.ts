import { supabase } from "@/integrations/supabase/client";

export const useRoomManagement = () => {
  const joinExistingRoom = async (roomId: string, userId: string) => {
    try {
      console.log('Attempting to join room:', { roomId, userId });
      
      const { data: currentRoom } = await supabase
        .from('chat_rooms')
        .select('participants')
        .eq('id', roomId)
        .maybeSingle();

      if (!currentRoom) {
        console.log('Room not found');
        return false;
      }

      const currentParticipants = Array.isArray(currentRoom.participants) ? currentRoom.participants : [];
      const uniqueParticipants = [...new Set([...currentParticipants, userId])];
      
      console.log('Current room state:', { currentParticipants, uniqueParticipants });
      
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
      
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('subject_category', category)
        .not('participants', 'is', null);

      if (error) {
        console.error('Error finding room:', error);
        return null;
      }

      const availableRoom = rooms?.find(room => 
        Array.isArray(room.participants) && 
        room.participants.length === 1 &&
        room.participants[0] !== null
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