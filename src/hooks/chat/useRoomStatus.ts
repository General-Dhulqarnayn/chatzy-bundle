import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useRoomStatus = (roomId: string, userId: string | undefined) => {
  const [isMatched, setIsMatched] = useState(false);
  const navigate = useNavigate();

  const checkRoomStatus = async () => {
    if (!userId) {
      console.log('No user ID provided for room status check');
      return false;
    }
    
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .select('participants')
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('Error checking room status:', error);
      return false;
    }

    console.log('Room status check:', { room, userId });

    if (!room) {
      console.log('Room not found');
      toast.error("Chat room not found");
      navigate('/');
      return false;
    }

    if (room.participants && Array.isArray(room.participants)) {
      const isUserInRoom = room.participants.includes(userId);
      const hasTwoParticipants = room.participants.length === 2;

      console.log('Room status:', { isUserInRoom, hasTwoParticipants, participants: room.participants });

      if (isUserInRoom && hasTwoParticipants) {
        console.log('Match confirmed - both users in room');
        setIsMatched(true);
        return true;
      }

      if (hasTwoParticipants && !isUserInRoom) {
        console.log('Room is full and user is not a participant');
        toast.error("This room is full");
        navigate('/');
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    if (!userId || !roomId) return;

    console.log('Setting up room status subscription:', { roomId, userId });

    // Initial check
    checkRoomStatus();

    // Subscribe to room changes
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
          filter: `id=eq.${roomId}`
        },
        async (payload) => {
          console.log('Room update received:', payload);
          await checkRoomStatus();
        }
      )
      .subscribe((status) => {
        console.log('Room subscription status:', status);
      });

    return () => {
      console.log('Cleaning up room status subscription');
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  return { isMatched, checkRoomStatus };
};