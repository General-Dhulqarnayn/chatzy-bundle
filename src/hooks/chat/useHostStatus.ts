import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useHostStatus = (roomId: string) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) return;

    console.log('Setting up host status subscription for room:', roomId);

    const channel = supabase
      .channel(`host-${roomId}`)
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
          const { data: room } = await supabase
            .from('chat_rooms')
            .select('host_id, participants')
            .eq('id', roomId)
            .single();

          if (!room || !room.host_id || !room.participants.includes(room.host_id)) {
            console.log('Host has left the room');
            toast.error("The host has ended this chat session");
            navigate('/join-rooms');
          }
        }
      )
      .subscribe((status) => {
        console.log('Host status subscription status:', status);
      });

    return () => {
      console.log('Cleaning up host status subscription');
      supabase.removeChannel(channel);
    };
  }, [roomId, navigate]);
};