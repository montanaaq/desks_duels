import { io } from "socket.io-client";
import { toast } from "sonner";
import { url } from "../config";
import type { DuelRequest } from "../pages/Home/Home";
import type { SeatType } from "../types/seat.types";

export const socket = io(url, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const initializeSocket = (
  telegramId: string,
  onSeatsUpdate: (seats: any) => void,
  duelRequestRef: React.MutableRefObject<DuelRequest | null>,
  showDuelRequestPopupToOpponent: (request: DuelRequest) => void
) => {
  // Отключаем сокет если он уже был подключен
  if (socket.connected) {
    // Удаляем все существующие обработчики перед переподключением
    socket.removeAllListeners();
    socket.disconnect();
  }

  // Устанавливаем обработчики событий
  socket.on("connect", () => {
    console.log("Socket connected");
    // После подключения присоединяемся к комнате пользователя
    socket.emit("join", telegramId);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
    if (error.message) {
      toast.error(error.message);
    }
  });

  socket.on("seatsUpdated", onSeatsUpdate);

  // Обработчик входящего запроса на дуэль
  socket.on("duelRequest", (request: DuelRequest) => {
    console.log("Received duel request:", request);
    duelRequestRef.current = request;
    showDuelRequestPopupToOpponent(request);
  });

  // Обработчик подтверждения отправки запроса на дуэль
  socket.on("duelRequestSent", (data: { duelId: number, challengedId: string, seatId: number }) => {
    console.log("Duel request sent confirmation:", data);
  });

  socket.on("seatUpdated", (updatedSeat: SeatType) => {
    onSeatsUpdate((prevDesks: SeatType[]) =>
      prevDesks.map((desk) => (desk.id === updatedSeat.id ? updatedSeat : desk))
    );
  });

  socket.on("duelAccepted", (data) => {
    console.log("[socketService] Received duelAccepted event with data:", data);
    
    // Закрываем уведомление
    if (data.duelId) {
      console.log("[socketService] Dismissing toast with id:", data.duelId);
      toast.dismiss(data.duelId);
    }

    // Показываем роль и перенаправляем
    if (data.roleMessage) {
      console.log("[socketService] Showing role message:", data.roleMessage);
      toast(data.roleMessage, { duration: 5000 });
      console.log("[socketService] Setting redirect timeout to coinflip page");
      setTimeout(() => {
        window.location.href = `/coinflip/${data.request.duelId}/${data.request.challengerId}/${data.request.challengedId}`;
      }, 3000);
    }
  });

  socket.on("duelDeclined", (data) => {
    // Закрываем уведомление о дуэли если есть duelId
    if (data.duelId) {
      toast.dismiss(data.duelId);
    }

    // Показываем уведомление о занятии места
    if (data.message) {
      toast.info(data.message, { duration: 5000 });
    }

  });

  socket.on("duelCompleted", (updatedSeat: SeatType) => {
    onSeatsUpdate((prevDesks: SeatType[]) =>
      prevDesks.map((seat) => (seat.id === updatedSeat.id ? updatedSeat : seat))
    );
    toast.success("Дуэль завершена, статус места обновлён!");
  });

  // Подключаем сокет
  if (!socket.connected) {
    socket.connect();
  }

  // Возвращаем функцию очистки
  return () => {
    socket.removeAllListeners();
    socket.disconnect();
  };
};
