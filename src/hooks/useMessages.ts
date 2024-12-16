import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useMessages = (roomId: string) => {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Load existing messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        toast.error("Failed to load messages");
        return;
      }

      setMessages(data || []);
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages(current => [...current, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendMessage = async (content: string, userId: string | undefined) => {
    if (!content.trim() || !userId) return;

    try {
      const newMessage = {
        content,
        chat_room_id: roomId,
        user_id: userId,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };

      // Optimistically add the message to the UI
      setMessages(current => [...current, newMessage]);

      const { error } = await supabase
        .from('messages')
        .insert([{
          content,
          chat_room_id: roomId,
          user_id: userId
        }]);

      if (error) {
        console.error('Error sending message:', error);
        toast.error("Failed to send message");
        // Remove the optimistically added message if there was an error
        setMessages(current => current.filter(msg => msg.id !== newMessage.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  };

  return { messages, sendMessage };
};