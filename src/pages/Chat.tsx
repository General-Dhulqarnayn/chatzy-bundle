import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useMessages } from "@/hooks/useMessages";
import { useHostStatus } from "@/hooks/chat/useHostStatus";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";

const Chat = () => {
  const { roomId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState<{ 
    username: string | null; 
    avatar_url: string | null 
  } | null>(null);
  const [isRoomReady, setIsRoomReady] = useState(false);
  const { messages, sendMessage } = useMessages(roomId!);
  
  useHostStatus(roomId!);

  useEffect(() => {
    if (!roomId || !session?.user?.id) {
      console.log('Missing required data:', { roomId, userId: session?.user?.id });
      navigate('/');
      return;
    }

    // Store the active room ID
    localStorage.setItem('activeRoomId', roomId);

    const checkRoomStatus = async () => {
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('participants, host_id')
        .eq('id', roomId)
        .single();

      if (!room?.participants?.includes(session.user.id)) {
        console.log('User not in room');
        toast.error("You're not a participant in this room");
        localStorage.removeItem('activeRoomId');
        navigate('/join-rooms');
        return;
      }

      if (!room.host_id || !room.participants.includes(room.host_id)) {
        console.log('Host has left the room');
        toast.error("The host has ended this chat session");
        localStorage.removeItem('activeRoomId');
        navigate('/join-rooms');
        return;
      }

      const hasTwoParticipants = room.participants.length === 2;
      setIsRoomReady(hasTwoParticipants);

      if (hasTwoParticipants) {
        const otherUserId = room.participants.find(id => id !== session.user.id);
        if (otherUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', otherUserId)
            .single();
          
          // Set a default username since we don't have it in the database anymore
          setOtherUser({
            username: 'Anonymous User',
            avatar_url: profile?.avatar_url || null
          });
        }
      }
    };

    // Initial check
    checkRoomStatus();

    // Subscribe to room changes
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
          filter: `id=eq.${roomId}`
        },
        () => {
          checkRoomStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, session?.user?.id, navigate]);

  const handleSendMessage = async (content: string) => {
    if (!session?.user?.id || !isRoomReady) {
      console.log('Cannot send message:', { userId: session?.user?.id, isRoomReady });
      return;
    }
    await sendMessage(content, session.user.id);
  };

  const handleLeaveChat = async () => {
    if (!roomId || !session?.user?.id) return;

    try {
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('participants, host_id')
        .eq('id', roomId)
        .single();

      if (room) {
        // Remove the current user from participants
        const updatedParticipants = room.participants.filter(id => id !== session.user.id);
        
        await supabase
          .from('chat_rooms')
          .update({ participants: updatedParticipants })
          .eq('id', roomId);

        localStorage.removeItem('activeRoomId');
        toast.success("Left the chat room");
        navigate('/join-rooms');
      }
    } catch (error) {
      console.error('Error leaving chat:', error);
      toast.error("Failed to leave the chat");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {!isRoomReady ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-lg">Waiting for another user to join...</p>
          </div>
        </div>
      ) : (
        <>
          <ChatHeader otherUser={otherUser} onLeaveChat={handleLeaveChat} />
          <MessageList messages={messages} currentUserId={session?.user?.id} />
          <MessageInput onSendMessage={handleSendMessage} disabled={!isRoomReady} />
        </>
      )}
    </div>
  );
};

export default Chat;