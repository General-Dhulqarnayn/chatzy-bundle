import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { useMessages } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";

const Chat = () => {
  const { roomId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState<{ username: string | null; avatar_url: string | null } | null>(null);
  const [canSendMessages, setCanSendMessages] = useState(false);
  
  const { isMatched, isSearching } = useMatchmaking(roomId!, session?.user?.id);
  const { messages, sendMessage } = useMessages(roomId!);

  // Effect to check if user can send messages and fetch other user's profile
  useEffect(() => {
    const checkRoomAndFetchProfile = async () => {
      if (!roomId || !session?.user?.id) {
        console.log('Missing required data:', { roomId, userId: session?.user?.id });
        return;
      }

      try {
        console.log('Checking room participants...');
        const { data: room, error: roomError } = await supabase
          .from('chat_rooms')
          .select('participants')
          .eq('id', roomId)
          .single();

        if (roomError) {
          console.error('Error fetching room:', roomError);
          toast.error("Failed to load chat room");
          navigate('/');
          return;
        }

        if (!room?.participants) {
          console.log('No participants found in room');
          return;
        }

        console.log('Room participants:', room.participants);
        const isUserInRoom = room.participants.includes(session.user.id);
        const hasTwoParticipants = room.participants.length === 2;
        
        if (!isUserInRoom) {
          console.log('User not in room, redirecting...');
          navigate('/');
          return;
        }

        if (isUserInRoom && hasTwoParticipants) {
          setCanSendMessages(true);
          // Fetch other user's profile
          const otherUserId = room.participants.find(id => id !== session.user.id);
          if (otherUserId) {
            console.log('Fetching other user profile:', otherUserId);
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', otherUserId)
              .single();

            if (profileError) {
              console.error('Error fetching profile:', profileError);
            } else {
              console.log('Other user profile:', profile);
              setOtherUser(profile);
            }
          }
        } else {
          setCanSendMessages(false);
        }
      } catch (error) {
        console.error('Error in checkRoomAndFetchProfile:', error);
      }
    };

    // Run check immediately when component mounts or when isMatched changes
    checkRoomAndFetchProfile();

    // Subscribe to room changes
    console.log('Setting up room subscription...');
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
        () => {
          console.log('Room update received, checking room status...');
          checkRoomAndFetchProfile();
        }
      )
      .subscribe((status) => {
        console.log('Room subscription status:', status);
      });

    return () => {
      console.log('Cleaning up room subscription');
      supabase.removeChannel(channel);
    };
  }, [roomId, session?.user?.id, isMatched, navigate]);

  const handleSendMessage = async (content: string) => {
    if (!session?.user?.id) {
      console.log('No user ID available for sending message');
      return;
    }
    console.log('Sending message:', { content, userId: session.user.id });
    await sendMessage(content, session.user.id);
  };

  const handleLeaveChat = async () => {
    if (!roomId || !session?.user?.id) return;

    try {
      console.log('Leaving chat room:', roomId);
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('participants')
        .eq('id', roomId)
        .single();

      if (room && Array.isArray(room.participants)) {
        const updatedParticipants = room.participants.filter(id => id !== session.user.id);

        const { error } = await supabase
          .from('chat_rooms')
          .update({ participants: updatedParticipants })
          .eq('id', roomId);

        if (error) throw error;

        console.log('Successfully left chat room');
        toast.success("Successfully left the chat");
        navigate('/');
      }
    } catch (error) {
      console.error('Error leaving chat:', error);
      toast.error("Failed to leave the chat");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {!canSendMessages && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-lg">
              {isSearching 
                ? "Looking for someone to chat with..." 
                : "Setting up chat..."}
            </p>
          </div>
        </div>
      )}
      
      {canSendMessages && (
        <>
          <ChatHeader otherUser={otherUser} onLeaveChat={handleLeaveChat} />
          <MessageList messages={messages} currentUserId={session?.user?.id} />
          <MessageInput onSendMessage={handleSendMessage} disabled={!canSendMessages} />
        </>
      )}
    </div>
  );
};

export default Chat;