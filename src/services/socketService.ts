// services/socketService.ts

import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { DuelRequest } from "../pages/Home/Home";
import { SeatType } from "../types/seat.types";
import { url } from "./userService";

// Создаем экземпляр сокета
const socket: Socket = io(url);

const initializeSocket = (
  userId: string,
  setDesks: Dispatch<SetStateAction<SeatType[]>>,
  duelRequestRef: MutableRefObject<DuelRequest | null>,
  showDuelRequestPopup: (request: DuelRequest) => void
) => {
  // Подключение к комнате пользователя
  socket.emit("join", userId);

  // Обработка обновлений мест
  socket.on("seatUpdated", (updatedSeat: SeatType) => {
    setDesks((prevDesks) =>
      prevDesks.map((seat) => (seat.id === updatedSeat.id ? updatedSeat : seat))
    );
  });

  socket.on("duelRequest", (duelData) => {
    duelRequestRef.current = duelData;
    showDuelRequestPopup(duelData);
    console.log("Duel request received:", duelData);
  });

  socket.on("showDuelRoles", ({ roleMessage, request }) => {
    if (request.challengerId === userId) {
      toast.success("Соперник успешно принял дуэль!");
    }
    toast(roleMessage, { duration: 5000 });

    setTimeout(() => {
      window.location.href = `/coinflip/${request.duelId}/${request.challengerId}/${request.challengedId}`;
    }, 5000);
  });

  // Обработка завершения дуэли
  socket.on("duelCompleted", (updatedSeat: SeatType) => {
    setDesks((prevDesks) =>
      prevDesks.map((seat) => (seat.id === updatedSeat.id ? updatedSeat : seat))
    );
    toast.success("Дуэль завершена, статус места обновлён!");
  });

  // Очистка слушателей при размонтировании компонента
  return () => {
    socket.off("seatUpdated");
    socket.off("duelRequest");
    socket.off("showDuelRoles");
    socket.off("duelCompleted");
    socket.disconnect();
  };
};

export { initializeSocket, socket };
