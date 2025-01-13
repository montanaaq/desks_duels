import type {FC} from "react";
import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";
import type {DuelRequest} from "../../pages/Home/Home";
import {socket} from "@/services/socketService.ts";
import styles from "./DuelRequestPopup.module.css";

const DUEL_TIMEOUT_SECONDS = 60;

const DuelRequestPopup: FC<{
  request: DuelRequest;
  onClose: () => void;
  isInitiator: boolean | null;
  handleDeclineDuel: (request: DuelRequest, isTimeout?: boolean) => void;
  handleAcceptDuel: (request: DuelRequest) => void;
  isDeclined: boolean;
}> = ({
        request,
        onClose,
        isInitiator,
        handleDeclineDuel,
        handleAcceptDuel,
        isDeclined,
      }) => {
  const [remainingTime, setRemainingTime] =
    useState<number>(DUEL_TIMEOUT_SECONDS);
  const intervalRef = useRef<NodeJS.Timeout | null | undefined>(null);
  const isHandlingTimeout = useRef<boolean>(false);

  useEffect(() => {
    // Вычисляем оставшееся время на основе времени создания дуэли
    const calculateRemainingTime = () => {
      try {
        // Парсим ISO строку в объект Date
        const createdAt = new Date(request.createdAt);
        const now = new Date();

        // Проверяем валидность даты
        if (isNaN(createdAt.getTime())) {
          console.error("Invalid date format:", request.createdAt);
          return DUEL_TIMEOUT_SECONDS;
        }

        // Вычисляем разницу в секундах
        const elapsedSeconds = Math.floor(
          (now.getTime() - createdAt.getTime()) / 1000
        );
        const remaining = Math.max(0, DUEL_TIMEOUT_SECONDS - elapsedSeconds);

        return remaining;
      } catch (error) {
        console.error("Error calculating remaining time:", error);
        return DUEL_TIMEOUT_SECONDS;
      }
    };

    // Устанавливаем начальное значение
    const initialRemaining = calculateRemainingTime();
    setRemainingTime(initialRemaining);

    // Если время уже истекло, сразу вызываем таймаут
    if (initialRemaining <= 0 && !isHandlingTimeout.current) {
      isHandlingTimeout.current = true;
      handleDeclineDuel(request, true);
      onClose();
      return;
    }

    // Запускаем таймер
    intervalRef.current = setInterval(() => {
      const remaining = calculateRemainingTime();

      if (remaining <= 0 && !isHandlingTimeout.current) {
        isHandlingTimeout.current = true;
        handleDeclineDuel(request, true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onClose();
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);

    // Listen for socket events
    const handleDuelAccepted = (data: { duelId: number }) => {
      console.log(
        "[DuelRequestPopup] Received duelAccepted event with data:",
        data
      );
      if (data.duelId === request.duelId) {
        console.log("[DuelRequestPopup] Clearing interval and closing popup");
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onClose();
      }
    };

    const handleDuelDeclined = (data: {
      duelId: number;
      challengerId?: string;
      challengedId?: string;
      seatId?: number;
    }) => {
      if (data.duelId === request.duelId) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onClose();
      }
    };

    const handleDuelTimeout = (data: {
      duel: {
        seatId: number;
        player1: string;
        player2: string;
        isTimeout: boolean;
      };
    }) => {
      if (
        data.duel.seatId === request.seatId &&
        (data.duel.player1 === request.challengerId ||
          data.duel.player2 === request.challengedId)
      ) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onClose();
      }
    };

    socket.on("duelAccepted", handleDuelAccepted);
    socket.on("duelDeclined", handleDuelDeclined);
    socket.on("duelTimeout", handleDuelTimeout);

    // Очистка при размонтировании
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      socket.off("duelAccepted", handleDuelAccepted);
      socket.off("duelDeclined", handleDuelDeclined);
      socket.off("duelTimeout", handleDuelTimeout);
    };
  }, [request.createdAt, handleDeclineDuel, onClose]);

  const handleDecline = async () => {
    try {
      // Вызываем handleDeclineDuel из родительского компонента
      handleDeclineDuel(request, false);
      console.log(
        "Duel decline step:",
        request.isConfirmed ? "confirmed" : "initial"
      );
    } catch (error) {
      console.error("Ошибка при отклонении дуэли:", error);
      toast.error("Не удалось отклонить дуэль");
    }
  };

  const handleAccept = () => {
    if (isDeclined) {
      // Если это экран подтверждения отклонения и нажата "Отмена",
      // просто закрываем текущий попап
      // И показываем исходный попап дуэли
      toast.custom(
        (id: string | number) => (
          <DuelRequestPopup
            request={request}
            onClose={() => toast.dismiss(id)}
            isInitiator={false}
            handleDeclineDuel={handleDeclineDuel}
            handleAcceptDuel={handleAcceptDuel}
            isDeclined={false}
          />
        ),
        {
          duration: 60000,
          id: request.duelId,
          dismissible: false,
        }
      );
    } else {
      // Если это первый экран и нажата кнопка "Принять"
      handleAcceptDuel(request);
    }
  };

  return (
    <div>
      {isDeclined ? (
        <div className={styles.duel_request_pop_up}>
          <p>
            Вы уверены, что хотите отклонить дуэль? Место перейдет к{" "}
            <b>{request.challengerName}</b>.
          </p>
          <p>Оставшееся время: {remainingTime} секунд</p>
          <div>
            <button className={styles.button_decline} onClick={handleAccept}>
              Отмена
            </button>
            <button className={styles.button_accept} onClick={handleDecline}>
              Подтвердить
            </button>
          </div>
        </div>
      ) : isInitiator ? (
        <div className={styles.duel_request_pop_up}>
          <p className={styles.is_initiator}>
            Вы вызвали игрока <b>{request.challengedName}</b> на дуэль. Если
            игрок не примет дуэль в течение 60 секунд,{" "}
            <b>вы автоматически выиграете</b>.
          </p>
          <p>Оставшееся время: {remainingTime} секунд</p>
        </div>
      ) : (
        <div className={styles.duel_request_pop_up}>
          <p>
            Пользователь <b>{request.challengerName}</b> вызвал вас на дуэль!
            Если вы не примете дуэль в течение 60 секунд,{" "}
            <b>вы автоматически проиграете</b>.
          </p>
          <p className={styles.remainingTime}>
            Оставшееся время: {remainingTime} секунд
          </p>
          <div>
            <button className={styles.button_decline} onClick={handleDecline}>
              Отказаться
            </button>
            <button className={styles.button_accept} onClick={handleAccept}>
              Принять
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuelRequestPopup;
