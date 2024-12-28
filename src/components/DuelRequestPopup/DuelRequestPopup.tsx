import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { DuelRequest } from "../../pages/Home/Home";
import { socket } from "../../services/socketService";
import styles from "./DuelRequestPopup.module.css";

const DuelRequestPopup: FC<{
  request: DuelRequest;
  onClose: () => void;
  isInitiator: boolean | null;
  handleDeclineDuel: (
    request: DuelRequest,
    isTimeout?: boolean,
    initialTime?: number
  ) => void;
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
  const [remainingTime, setRemainingTime] = useState<number>(60);
  const intervalRef = useRef<NodeJS.Timeout | null | undefined>(null);
  const isHandlingTimeout = useRef<boolean>(false);

  useEffect(() => {
    // Start the countdown
    intervalRef.current = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1 && !isHandlingTimeout.current) {
          // Time expired, handle the timeout
          isHandlingTimeout.current = true;

          // Use setTimeout to avoid state updates during render
          setTimeout(() => {
            handleDeclineDuel(request, isHandlingTimeout.current, 0); // true indicates timeout
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            onClose();
          }, 0);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Listen for duel response events
    const handleDuelAccepted = (data: { duelId: number }) => {
      if (data.duelId === request.duelId) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        // Use setTimeout to avoid state updates during render
        setTimeout(() => {
          toast.dismiss(data.duelId);
          onClose();
        }, 0);
      }
    };

    const handleDuelDeclined = (data: { duelId: number }) => {
      if (data.duelId === request.duelId) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        // Use setTimeout to avoid state updates during render
        setTimeout(() => {
          toast.dismiss(data.duelId);
          onClose();
        }, 0);
      }
    };

    socket.on("duelAccepted", handleDuelAccepted);
    socket.on("duelDeclined", handleDuelDeclined);

    // Cleanup interval and socket listeners on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      socket.off("duelAccepted", handleDuelAccepted);
      socket.off("duelDeclined", handleDuelDeclined);
    };
  }, [onClose, request, handleDeclineDuel]);

  const handleDecline = () => {
    console.log("DuelRequestPopup: Declining duel", request.duelId);
    handleDeclineDuel(request, false, remainingTime);

    // Broadcast the decline event
    socket.emit("duelDeclined", {
      duelId: request.duelId,
      challengerId: request.challengerId,
      challengedId: request.challengedId,
    });

    // Close own toast
    toast.dismiss(request.duelId);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onClose();
  };

  const handleAccept = () => {
    console.log("DuelRequestPopup: Accepting duel", request.duelId);
    handleAcceptDuel(request);

    // Broadcast the accept event
    socket.emit("duelAccepted", {
      duelId: request.duelId,
      challengerId: request.challengerId,
      challengedId: request.challengedId,
    });

    // Close own toast
    toast.dismiss(request.duelId);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onClose();
  };

  return (
    <div>
      {isDeclined && (
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
      {isInitiator ? (
        <div className={styles.duel_request_pop_up}>
          <p className={styles.is_initiator}>
            Вы вызвали игрока <b>{request.challengedName}</b> на дуэль. Если
            игрок не примет дуэль в течение 60 секунд,{" "}
            <b>вы автоматически выйграете</b>.
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
