import { Room } from "@/types/room";
import RoomCard from "./RoomCard";

interface RoomsListProps {
  rooms: Room[];
  joiningRoom: string | null;
  onJoinRoom: (roomId: string) => void;
}

const RoomsList = ({ rooms, joiningRoom, onJoinRoom }: RoomsListProps) => {
  if (rooms.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No rooms available. Try creating a new room!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          {...room}
          isJoining={joiningRoom === room.id}
          onJoinRoom={onJoinRoom}
        />
      ))}
    </div>
  );
};

export default RoomsList;