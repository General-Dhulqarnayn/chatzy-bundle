import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useRoomStatus = (roomId: string, userId: string | undefined) => {
  const [isMatched, setIsMatched] = useState(false);
  const navigate = useNavigate();

  const checkRoomStatus = async () => {
    if (!userId) return false;
    
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('participants')
      .eq('id', roomId)
      .single();

    console.log('Room status check:', { room, userId });

    if (room?.participants && Array.isArray(room.participants)) {
      const isUserInRoom = room.participants.includes(userId);
      const hasTwoParticipants = room.participants.length === 2;

      if (isUserInRoom && hasTwoParticipants) {
        setIsMatched(true);
        return true;
      }

      if (hasTwoParticipants && !isUserInRoom) {
        navigate('/');
        toast.error("This room is full");
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    if (!userId || !roomId) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_rooms',
          filter: `id=eq.${roomId}`
        },
        async () => {
          await checkRoomStatus();
        }
      )
      .subscribe();

    // Initial check
    checkRoomStatus();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  return { isMatched, checkRoomStatus };
};