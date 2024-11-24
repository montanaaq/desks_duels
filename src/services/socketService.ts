import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { DuelRequest } from "../pages/Home/Home";
import { SeatType } from "../types/seat.types";
import { url } from "./userService";

const socket: Socket = io(url);

const initializeSocket = (
  userId: string,
  setDesks: Dispatch<SetStateAction<SeatType[]>>,
  duelRequestRef: MutableRefObject<DuelRequest | null>,
  showDuelRequestPopup: (request: DuelRequest) => void
) => {
  socket.emit("join", userId);

  socket.on("seatUpdated", (updatedSeat: SeatType) => {
    setDesks((prevDesks) =>
      prevDesks.map((desk) =>
        desk.id === updatedSeat.id ? updatedSeat : desk
      )
    );
  });

  socket.on("duelRequest", (duelData) => {
    duelRequestRef.current = duelData;
    showDuelRequestPopup(duelData);
  });

  socket.on("showDuelRoles", ({ roleMessage, request }) => {
    toast(roleMessage, { duration: 5000 });

    setTimeout(() => {
      window.location.href = `/coinflip/${request.duelId}/${request.challengerId}/${request.challengedId}`;
    }, 5000);
  });

  socket.on("duelCompleted", (updatedSeat: SeatType) => {
    setDesks((prevDesks) =>
      prevDesks.map((seat) => (seat.id === updatedSeat.id ? updatedSeat : seat))
    );
    toast.success("Дуэль завершена, статус места обновлён!");
  });

  return () => {
    socket.off("seatUpdated");
    socket.off("duelRequest");
    socket.off("showDuelRoles");
    socket.off("duelCompleted");
    socket.disconnect();
  };
};

export { initializeSocket, socket };
