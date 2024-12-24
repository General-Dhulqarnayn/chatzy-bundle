import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";

interface RoomCardProps {
  id: string;
  subject_category: string;
  participants: string[];
  isJoining: boolean;
  onJoinRoom: (roomId: string) => void;
}

const RoomCard = ({ id, subject_category, participants, isJoining, onJoinRoom }: RoomCardProps) => {
  return (
    <div className="p-4 border rounded-lg hover:border-primary transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold capitalize">
            {subject_category} Room
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {participants.length}/2 participants
            </span>
            <Badge variant="secondary" className="capitalize">
              {subject_category}
            </Badge>
          </div>
        </div>
        <Button
          onClick={() => onJoinRoom(id)}
          disabled={isJoining}
          className="w-full sm:w-auto"
        >
          {isJoining ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            "Join Room"
          )}
        </Button>
      </div>
    </div>
  );
};

export default RoomCard;