import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Chat = () => {
  const { roomId } = useParams();
  const { session } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    const setupMatchmaking = async () => {
      if (session?.user?.id) {
        try {
          // First, ensure user exists in public.users table
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (!existingUser) {
            // Create user entry if it doesn't exist
            await supabase
              .from('users')
              .insert([{ 
                id: session.user.id,
                email: session.user.email 
              }]);
          }

          // Clean up any existing waiting room entries
          await supabase
            .from('waiting_room')
            .delete()
            .eq('user_id', session.user.id);

          // Now safely add to waiting room
          const { error: waitingError } = await supabase
            .from('waiting_room')
            .insert([{ user_id: session.user.id }]);

          if (waitingError) {
            console.error('Error joining waiting room:', waitingError);
            toast.error("Failed to join waiting room");
            return;
          }

          toast("Looking for someone to chat with...");
        } catch (error) {
          console.error('Error in matchmaking setup:', error);
          toast.error("Failed to set up matchmaking");
        }
      }
    };

    setupMatchmaking();

    // Subscribe to chat room changes to detect when someone joins
    const roomChannel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          if (payload.new.participants?.length >= 2) {
            setIsMatched(true);
            toast.success("Match found! You can now start chatting.");
          }
        }
      )
      .subscribe();

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
    const messageChannel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`
        },
        (payload) => {
          setMessages(current => [...current, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [roomId, session]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isMatched) return;

    const { error } = await supabase
      .from('messages')
      .insert([
        {
          content: newMessage,
          chat_room_id: roomId,
          user_id: session?.user?.id
        }
      ]);

    if (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
      return;
    }

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {!isMatched && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-lg">Looking for someone to chat with...</p>
          </div>
        </div>
      )}
      
      {isMatched && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.user_id === session?.user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.user_id === session?.user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit">Send</Button>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;