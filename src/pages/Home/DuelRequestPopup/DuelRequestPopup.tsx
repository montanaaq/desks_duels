// src/components/Home/DuelRequestPopup/DuelRequestPopup.tsx

import { FC, useEffect, useState } from "react";
import { toast } from "sonner";
import { DuelRequest } from "../Home";
import styles from "./DuelRequestPopup.module.css";

interface DuelRequestPopupProps {
  request: DuelRequest;
  onAccept: (request: DuelRequest) => void;
  onDecline: (
    request: DuelRequest,
    isTimeout?: boolean,
    initialTime?: number
  ) => void;
}

const DuelRequestPopup: FC<DuelRequestPopupProps> = ({
  request,
  onAccept,
  onDecline,
}) => {
  const [remainingTime, setRemainingTime] = useState(60);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingTime((prev) => prev - 1);
    }, 1000);

    if (remainingTime <= 0) {
      clearInterval(intervalId);
      onDecline(request, true, 0);
      toast.info(`Время истекло. ${request.challengerName} занимает место.`);
    }

    return () => clearInterval(intervalId);
  }, [remainingTime, onDecline, request]);

  const handleDecline = () => {
    onDecline(request, false, remainingTime);
    toast.dismiss();
  };

  const handleAccept = () => {
    onAccept(request);
    toast.dismiss();
  };

  return (
    <div className={styles.duel_request_pop_up}>
      <p>Пользователь {request.challengerName} вызвал вас на дуэль!</p>
      <p>Оставшееся время: {remainingTime} секунд</p>
      <div>
        <button onClick={handleDecline} className={styles.button_decline}>
          Отказаться
        </button>
        <button onClick={handleAccept} className={styles.button_accept}>
          Принять
        </button>
      </div>
    </div>
  );
};

export default DuelRequestPopup;
