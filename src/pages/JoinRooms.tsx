import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Room } from "@/types/room";
import RoomsList from "@/components/rooms/RoomsList";

const JoinRooms = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        console.log('Fetching available rooms');
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('*')
          .not('participants', 'is', null)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter rooms that aren't full and have an active host
        const availableRooms = data.filter(room => {
          const participantCount = Array.isArray(room.participants) ? room.participants.length : 0;
          const hasHost = room.participants.includes(room.host_id);
          return participantCount < 2 && hasHost;
        });

        console.log('Available rooms:', availableRooms);
        setRooms(availableRooms);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast.error("Failed to load rooms");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();

    // Set up real-time subscription for room updates
    const channel = supabase
      .channel('room-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_rooms' },
        () => {
          console.log('Room changes detected, refreshing...');
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const handleJoinRoom = async (roomId: string) => {
    if (!session?.user?.id) {
      toast.error("Please sign in to join a room");
      return;
    }

    try {
      setJoiningRoom(roomId);
      console.log('Attempting to join room:', roomId);

      const { data: room } = await supabase
        .from('chat_rooms')
        .select('participants, host_id')
        .eq('id', roomId)
        .single();

      if (!room) {
        toast.error("Room not found");
        return;
      }

      const participants = Array.isArray(room.participants) ? room.participants : [];
      
      // Check if host is still in the room
      if (!participants.includes(room.host_id)) {
        toast.error("This room is no longer active");
        return;
      }

      if (participants.length >= 2) {
        toast.error("Room is full");
        return;
      }

      if (participants.includes(session.user.id)) {
        console.log('User already in room, redirecting...');
        navigate(`/chat/${roomId}`);
        return;
      }

      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update({
          participants: [...participants, session.user.id]
        })
        .eq('id', roomId);

      if (updateError) {
        console.error('Error joining room:', updateError);
        throw updateError;
      }

      console.log('Successfully joined room:', roomId);
      toast.success("Joined room successfully!");
      navigate(`/chat/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error("Failed to join room");
    } finally {
      setJoiningRoom(null);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight slide-up">
          Join a Chat Room
        </h1>
        <p className="text-muted-foreground mt-2 slide-up animation-delay-100">
          Select an available room to start chatting
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <RoomsList
          rooms={rooms}
          joiningRoom={joiningRoom}
          onJoinRoom={handleJoinRoom}
        />
      )}
    </div>
  );
};

export default JoinRooms;