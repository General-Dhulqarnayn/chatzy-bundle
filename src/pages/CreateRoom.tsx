import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateRoom = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("general");

  const handleCreateRoom = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to create a room");
      return;
    }

    try {
      setIsCreating(true);
      console.log('Creating room with category:', selectedCategory);

      const newRoomId = `${selectedCategory}-${Date.now()}`;
      
      // Explicitly create the participants array with the creator's ID
      const participants = [session.user.id];
      console.log('Setting initial participants:', participants);

      const { error: createError } = await supabase
        .from('chat_rooms')
        .insert([{
          id: newRoomId,
          subject_category: selectedCategory,
          participants: participants // Explicitly set the array
        }]);

      if (createError) {
        console.error('Error creating room:', createError);
        throw createError;
      }

      console.log('Successfully created room:', newRoomId);
      toast.success("Room created successfully!");
      navigate(`/chat/${newRoomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error("Failed to create room. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight slide-up">
          Create a Chat Room
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto slide-up animation-delay-100">
          Select a subject and create a new room for others to join.
        </p>
        
        <div className="max-w-xs mx-auto space-y-6 slide-up animation-delay-200">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="maths">Mathematics</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="science">Science</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="lg"
            className="w-full"
            onClick={handleCreateRoom}
            disabled={isCreating}
          >
            {isCreating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Plus className="mr-2 h-5 w-5" />
            )}
            {isCreating ? "Creating..." : "Create Room"}
          </Button>
        </div>

        {!session && (
          <p className="text-sm text-muted-foreground slide-up animation-delay-300">
            Sign in to create rooms and chat with others
          </p>
        )}
      </div>
    </div>
  );
};

export default CreateRoom;