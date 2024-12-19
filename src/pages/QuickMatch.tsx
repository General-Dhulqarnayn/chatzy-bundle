import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const QuickMatch = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);

  const handleQuickJoin = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to join a room");
      return;
    }

    try {
      setIsJoining(true);
      console.log('Quick Match: Starting join process for user:', session.user.id);

      // First, check for an available room
      const { data: rooms, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('subject_category', 'general')
        .not('participants', 'is', null);

      if (roomError) {
        console.error('Quick Match: Error fetching rooms:', roomError);
        throw roomError;
      }

      console.log('Quick Match: Found rooms:', rooms);

      // Find a room with exactly one participant that isn't the current user
      const availableRoom = rooms?.find(room => 
        Array.isArray(room.participants) && 
        room.participants.length === 1 &&
        !room.participants.includes(session.user.id)
      );

      console.log('Quick Match: Available room found:', availableRoom);

      if (availableRoom) {
        // Join existing room
        console.log('Quick Match: Attempting to join room:', availableRoom.id);
        const updatedParticipants = [...availableRoom.participants, session.user.id];
        console.log('Quick Match: Updated participants will be:', updatedParticipants);

        const { error: updateError } = await supabase
          .from('chat_rooms')
          .update({ 
            participants: updatedParticipants
          })
          .eq('id', availableRoom.id);

        if (updateError) {
          console.error('Quick Match: Error joining room:', updateError);
          throw updateError;
        }
        
        console.log('Quick Match: Successfully joined room:', availableRoom.id);
        toast.success("Joined existing room!");
        navigate(`/chat/${availableRoom.id}`);
      } else {
        // Create new room
        const newRoomId = `quick-${Date.now()}`;
        console.log('Quick Match: Creating new room:', newRoomId);

        const { error: createError } = await supabase
          .from('chat_rooms')
          .insert([{
            id: newRoomId,
            subject_category: 'general',
            participants: [session.user.id]
          }]);

        if (createError) {
          console.error('Quick Match: Error creating room:', createError);
          throw createError;
        }

        console.log('Quick Match: Successfully created room:', newRoomId);
        toast.success("Created new room!");
        navigate(`/chat/${newRoomId}`);
      }
    } catch (error) {
      console.error('Quick Match: Error in quick match process:', error);
      toast.error("Failed to join room. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight slide-up">
          Quick Match
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto slide-up animation-delay-100">
          Join an available room or create a new one instantly.
        </p>
        
        <div className="max-w-xs mx-auto space-y-6 slide-up animation-delay-200">
          <Button
            size="lg"
            className="w-full"
            onClick={handleQuickJoin}
            disabled={isJoining}
          >
            {isJoining ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-5 w-5" />
            )}
            {isJoining ? "Joining..." : "Quick Join"}
          </Button>
        </div>

        {!session && (
          <p className="text-sm text-muted-foreground slide-up animation-delay-300">
            Sign in to access all features and save your chats
          </p>
        )}
      </div>
    </div>
  );
};

export default QuickMatch;