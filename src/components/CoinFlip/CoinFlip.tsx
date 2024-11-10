// pages/CoinFlip/CoinFlip.tsx

import { FC, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { toast, Toaster } from "sonner";
import { completeDuel } from "../../services/duelService";
import { findUserById, setDuelingFlag, url } from "../../services/userService";
import DesignCircles from "../../components/DesignCircles/DesignCircles";
import Footer from "../../components/Footer";
import Logo from "../../components/Logo";
import styles from "./CoinFlip.module.css";

const socket = io(url);

const CoinFlip: FC = () => {
  const { duelId, challengerId, challengedId } = useParams<{
    duelId: string;
    challengerId: string;
    challengedId: string;
  }>();
  
  const navigate = useNavigate();

  const [flipping, setFlipping] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [challengerName, setChallengerName] = useState<string | null>(null);
  const [challengedName, setChallengedName] = useState<string | null>(null);

  useEffect(() => {
    if (!challengerId || !challengedId || !duelId) {
      toast.error("Параметры дуэли не найдены!");
      return;
    }

    const fetchUserNames = async () => {
      try {
        const [challenger, challenged] = await Promise.all([
          findUserById(Number(challengerId)),
          findUserById(Number(challengedId)),
        ]);
        setChallengerName(challenger.user?.name || "Челленджер");
        setChallengedName(challenged.user?.name || "Соперник");
      } catch (error) {
        toast.error("Ошибка загрузки участников дуэли");
      }
    };

    fetchUserNames();

    // Устанавливаем флаг 'dueling' для обоих участников
    const setDuelingFlagOnStart = async () => {
      try {
        console.log(`Устанавливаем флаг dueling для ${challengerId} и ${challengedId}`);
        await Promise.all([
          setDuelingFlag(challengerId, true),
          setDuelingFlag(challengedId, true),
        ]);
        console.log(`Флаг dueling установлен для ${challengerId} и ${challengedId}`);
      } catch (error) {
        console.error("Ошибка при установке флага dueling:", error);
      }
    };

    setDuelingFlagOnStart();

    // Обработчик события duelResult
    const handleDuelResult = (data: any) => {
      if (data.duelId === duelId) {
        setFlipping(false);
        setResult(data.result);
        setWinnerName(data.winnerName);
        toast.success(`${data.winnerName} выиграл дуэль и занимает место!`);

        // Перенаправляем пользователей на главное меню после небольшой задержки
        setTimeout(() => {
          console.log(`Перенаправляем на главное меню`);
          navigate('/main-menu'); // Замените '/main-menu' на реальный путь вашего главного меню
        }, 3000);
      }
    };

    socket.on("duelResult", handleDuelResult);

    return () => {
      socket.off("duelResult", handleDuelResult);

      // Сбрасываем флаг 'dueling' для обоих участников при размонтировании компонента
      const resetDuelingFlagOnUnmount = async () => {
        try {
          console.log(`Сбрасываем флаг dueling для ${challengerId} и ${challengedId}`);
          await Promise.all([
            setDuelingFlag(challengerId, false),
            setDuelingFlag(challengedId, false),
          ]);
          console.log(`Флаг dueling сброшен для ${challengerId} и ${challengedId}`);
        } catch (error) {
          console.error("Ошибка при сбросе флага dueling:", error);
        }
      };

      resetDuelingFlagOnUnmount();
    };
  }, [challengerId, challengedId, duelId, navigate]);

  /**
   * Функция для запуска подбрасывания монеты.
   */
  const startCoinFlip = () => {
    if (!challengerId || !challengedId || !duelId) return;

    setFlipping(true);
    setTimeout(async () => {
      const isHeads = Math.random() < 0.5;
      const resultText = isHeads ? "Орёл" : "Решка";
      const winnerId = isHeads ? challengerId : challengedId;
      const winner = isHeads ? challengerName : challengedName;
      setResult(resultText);
      setWinnerName(winner);

      // Отправляем результат через Socket.IO
      socket.emit("coinFlipResult", {
        duelId,
        result: resultText,
        winnerId,
        winnerName: winner,
      });

      try {
        await completeDuel(parseInt(duelId), winnerId);
        toast.success("Победитель отправлен на сервер");
      } catch (error: any) {
        toast.error("Ошибка при отправке победителя: " + error.message);
      }
    }, 3000);
  };

  useEffect(() => {
    // Запускаем подбрасывание монеты сразу при загрузке страницы
    startCoinFlip();
  }, []);

  return (
    <DesignCircles>
      <Toaster position="bottom-center" expand={true} richColors />
      <div className={styles.coinFlip_wrapper}>
        <Logo
          style={{ marginTop: "10px", width: "135px", height: "90px" }}
          textStyles={{ fontSize: "20px", marginTop: "10px" }}
        />
        <div className={styles.coinFlip_container}>
          <p>Подбрасываем монету...</p>
          <div className={`${styles.coin} ${flipping ? styles.flipping : ""}`}>
            {result ? <span>{result}</span> : <span>...</span>}
          </div>
          {winnerName && <p>Победитель: {winnerName}</p>}
        </div>
        <Footer />
      </div>
    </DesignCircles>
  );
};

export default CoinFlip;
