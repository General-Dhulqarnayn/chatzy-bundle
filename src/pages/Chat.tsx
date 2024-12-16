import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { useMessages } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const Chat = () => {
  const { roomId } = useParams();
  const { session } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<{ username: string | null; avatar_url: string | null } | null>(null);
  
  const { isMatched, isSearching } = useMatchmaking(roomId!, session?.user?.id);
  const { messages, sendMessage } = useMessages(roomId!);

  useEffect(() => {
    const fetchOtherUserProfile = async () => {
      if (!isMatched || !roomId || !session?.user?.id) return;

      const { data: room } = await supabase
        .from('chat_rooms')
        .select('participants')
        .eq('id', roomId)
        .single();

      if (room && Array.isArray(room.participants)) {
        const otherUserId = room.participants.find(id => id !== session.user.id);
        if (otherUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', otherUserId)
            .single();

          if (profile) {
            setOtherUser(profile);
          }
        }
      }
    };

    fetchOtherUserProfile();
  }, [isMatched, roomId, session?.user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isMatched) return;
    await sendMessage(newMessage, session?.user?.id);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {!isMatched && (
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
      
      {isMatched && (
        <>
          {otherUser && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {otherUser.avatar_url && (
                    <img 
                      src={otherUser.avatar_url} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span>
                    Chatting with: {otherUser.username || 'Anonymous User'}
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>
          )}
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
          <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
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