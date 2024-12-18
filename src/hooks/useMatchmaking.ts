import { useState, useEffect } from "react";
import { useRoomStatus } from "./chat/useRoomStatus";
import { useMatchProcess } from "./useMatchProcess";
import { useWaitingRoom } from "./chat/useWaitingRoom";

export const useMatchmaking = (roomId: string, userId: string | undefined) => {
  const [isSearching, setIsSearching] = useState(false);
  const { isMatched } = useRoomStatus(roomId, userId);
  const { startMatchmaking } = useMatchProcess(roomId, userId);
  const { removeFromWaitingRoom } = useWaitingRoom();

  useEffect(() => {
    if (!userId || !roomId) {
      console.log('Missing required data for matchmaking:', { userId, roomId });
      return;
    }

    const initializeMatchmaking = async () => {
      console.log('Initializing matchmaking:', { roomId, userId });
      setIsSearching(true);
      await startMatchmaking();
    };

    initializeMatchmaking();

    return () => {
      console.log('Cleaning up matchmaking...');
      if (userId) {
        removeFromWaitingRoom([userId])
          .catch(error => console.error('Error cleaning up waiting room:', error));
      }
    };
  }, [roomId, userId]);

  return { isMatched, isSearching };
};