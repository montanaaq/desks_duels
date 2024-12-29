// pages/CoinFlip/CoinFlip.tsx

import type { FC } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import { toast, Toaster } from "sonner";
import DesignCircles from "../../components/DesignCircles/DesignCircles";
import Footer from "../../components/Footer";
import Logo from "../../components/Logo";
import CoinFlipSkeletonLoader from "../../components/SkeletonLoader/CoinFlipSkeletonLoader";
import { url } from "../../config";
import { completeDuel } from "../../services/duelService";
import { findUserById, setDuelingFlag } from "../../services/userService";
import styles from "./CoinFlip.module.css";

const socket = io(url);

const CoinFlip: FC = () => {
  const { duelId, challengerId, challengedId } = useParams<{
    duelId: string;
    challengerId: string;
    challengedId: string;
  }>();

  const navigate = useNavigate();

  const [flipping, setFlipping] = useState<boolean>(true);
  const [result, setResult] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [challengedName, setChallengedName] = useState<string | null>(null);
  const [challengerName, setChallengerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!challengerId || !challengedId || !duelId) {
      toast.error("Параметры дуэли не найдены! Попробуйте позже.");
      setTimeout(() => {
        navigate("/");
      }, 5000);
      return;
    }

    // Устанавливаем флаг 'dueling' для обоих участников
    const setDuelingFlagOnStart = async () => {
      try {
        console.log(
          `Устанавливаем флаг dueling для ${challengerId} и ${challengedId}`
        );
        await Promise.all([
          setDuelingFlag(challengerId, true),
          setDuelingFlag(challengedId, true),
        ]);
        console.log(
          `Флаг dueling установлен для ${challengerId} и ${challengedId}`
        );
      } catch (error) {
        console.error("Ошибка при установке флага dueling:", error);
      }
    };

    setDuelingFlagOnStart();

    // Обработчик события duelResult
    const handleDuelResult = async (data: any) => {
      if (data.duelId === duelId) {
        try {
          const response = await completeDuel(Number(duelId));

          // Null check for response and duel
          if (response?.duel) {
            setFlipping(false);

            // Set coin flip result from backend
            setResult(response.duel.coinFlipResult);

            // Safely set winner name with fallback
            const winnerUser = await findUserById(response.duel.winner);
            const winnerName = winnerUser.user?.name;
            setWinnerName(winnerName);
            // Show winner information prominently
            toast.success(`🏆 ${winnerName} выиграл дуэль!`, {
              duration: 5000,
              position: "top-center",
            });

            // Перенаправляем пользователей на страницу выбора места через 3 секунды
            setTimeout(() => {
              console.log(`Перенаправляем на страницу выбора места`);
              navigate("/");
            }, 5000);
          } else {
            throw new Error("Invalid duel response");
          }
        } catch (error) {
          console.error("Ошибка при завершении дуэли:", error);
          toast.error("Не удалось завершить дуэль. Попробуйте позже.", {
            duration: 3000,
            position: "top-center",
          });

          // Fallback navigation in case of error
          setTimeout(() => {
            navigate("/");
          }, 5000);
        }
      }
    };

    socket.on("duelResult", handleDuelResult);

    return () => {
      socket.off("duelResult", handleDuelResult);

      // Сбрасываем флаг 'dueling' для обоих участников при размонтировании компонента
      const resetDuelingFlagOnUnmount = async () => {
        try {
          console.log(
            `Сбрасываем флаг dueling для ${challengerId} и ${challengedId}`
          );
          await Promise.all([
            setDuelingFlag(challengerId, false),
            setDuelingFlag(challengedId, false),
          ]);
          console.log(
            `Флаг dueling сброшен для ${challengerId} и ${challengedId}`
          );
        } catch (error) {
          console.error("Ошибка при сбросе флага dueling:", error);
        }
      };

      resetDuelingFlagOnUnmount();
    };
  }, [challengerId, challengedId, duelId, navigate]);

  const startCoinFlip = async () => {
    if (!challengerId || !challengedId || !duelId) return;

    setFlipping(true);
    setIsLoading(true);

    try {
      const [challengedUser, challengerUser] = await Promise.all([
        findUserById(challengedId),
        findUserById(challengerId),
      ]);

      setChallengedName(challengedUser.user?.name);
      setChallengerName(challengerUser.user?.name);

      const response = await completeDuel(Number(duelId));

      if (response?.duel) {
        setFlipping(false);
        setResult(response.duel.coinFlipResult);

        const winnerUser = await findUserById(response.duel.winner);
        const winnerName = winnerUser.user?.name;
        setWinnerName(winnerName);

        toast.info(`🏆 ${winnerName} выиграл дуэль!`, {
          duration: 5000,
        });

        socket.emit("duelResult", {
          duelId: parseInt(duelId),
          result: response.duel,
        });

        setTimeout(() => {
          navigate("/");
        }, 5000);
      } else {
        throw new Error("Invalid duel response");
      }
    } catch (error) {
      console.error("Ошибка при завершении дуэли:", error);
      toast.error("Не удалось завершить дуэль. Попробуйте позже.", {
        duration: 3000,
        position: "top-center",
      });

      setTimeout(() => {
        navigate("/");
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startCoinFlip();
  }, []);

  if (isLoading || !challengerName || !challengedName) {
    return <CoinFlipSkeletonLoader />;
  }

  return (
    <DesignCircles>
      <Toaster position="top-center" expand={true} richColors />
      <div className={styles.coinFlip_wrapper}>
        <Logo
          style={{ marginTop: "10px", width: "135px", height: "90px" }}
          textStyles={{ fontSize: "20px", marginTop: "10px" }}
        />
        <div className={styles.coinFlip_container}>
          <div className={styles.playerNames}>
            <div className={styles.challengerName}>{challengerName}</div>
            <div className={styles.vsText}>VS</div>
            <div className={styles.challengedName}>{challengedName}</div>
          </div>
          <p>Подбрасываем монету...</p>
          <div className={`${styles.coin} ${flipping ? styles.flipping : ""}`}>
            {result ? <span>{result}</span> : <span>...</span>}
          </div>
          {winnerName && (
            <h2 style={{ fontSize: "24px" }}>
              Победитель: <b>{winnerName}</b>
            </h2>
          )}
        </div>
        <Footer styles={{ marginTop: "auto" }} />
      </div>
    </DesignCircles>
  );
};

export default CoinFlip;
