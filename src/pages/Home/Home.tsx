// src/components/Home/Home.tsx

import { Info } from "lucide-react";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast, Toaster } from "sonner";
import DesignCircles from "../../components/DesignCircles/DesignCircles";
import DuelRequestPopup from "../../components/DuelRequestPopup/DuelRequestPopup";
import Footer from "../../components/Footer";
import SkeletonLoader from "../../components/SkeletonLoader/SkeletonLoader";
import useSchoolTimer from "../../hooks/useSchoolTimer";
import { getActiveDuel, requestDuel } from "../../services/duelService";
import { getDesks, getSeatById, takeSeat } from "../../services/seatService";
import { initializeSocket, socket } from "../../services/socketService";
import { findUserById } from "../../services/userService";
import type { SeatType } from "../../types/seat.types";
import type { userType } from "../../types/user.types";
import DeskContainer from "./DeskContainer/DeskContainer";
import styles from "./Home.module.css";
import SeatModal from "./SeatModal/SeatModal";
import Timer from "./Timer/Timer";

interface HomeProps {
  user: userType;
}

export interface DuelRequest {
  duelId: number;
  challengerId: string;
  challengerName: string;
  challengedId: string;
  challengedName: string;
  seatId: number;
  isConfirmed?: boolean;
  createdAt: string;
}

interface DuelTimeoutEventDetail {
  duel: {
    seatId: number;
    player1: string;
    player2: string;
  };
}

const Home: FC<HomeProps> = ({ user }) => {
  const { time, isGameActive } = useSchoolTimer();
  const [desks, setDesks] = useState<SeatType[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<SeatType | null>(null);
  const [occupiedByUser, setOccupiedByUser] = useState<userType | null>(null);
  const [duelRequest, setDuelRequest] = useState<DuelRequest | null>(null);
  const duelRequestRef = useRef<DuelRequest | null>(null);
  const [shouldRerender, setShouldRerender] = useState(false);
  const rerenderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isSocketInitializedRef = useRef(false);
  const [activeDuelAsInitiator, setActiveDuelAsInitiator] =
    useState<DuelRequest | null>(null);
  const [activeDuelAsTarget, setActiveDuelAsTarget] =
    useState<DuelRequest | null>(null);

  duelRequest;

  useCallback(() => {
    if (rerenderTimeoutRef.current) {
      clearTimeout(rerenderTimeoutRef.current);
    }
    rerenderTimeoutRef.current = setTimeout(() => {
      setShouldRerender((prev) => !prev);
    }, 1000);
  }, []);

  useEffect(() => {
    const fetchInitialDesks = async () => {
      try {
        setIsLoading(true);
        const data = await getDesks();
        setDesks(data);
      } catch (error) {
        console.error("Error fetching desks:", error);
        toast.error("Ошибка загрузки мест. Попробуйте позже.");
      } finally {
        setIsLoading(false);
      }
    };

    // Проверяем активные дуэли при загрузке
    const checkActiveDuel = async () => {
      try {
        const activeDuel = await getActiveDuel(user.telegramId);
        if (activeDuel && activeDuel.duel) {
          const { duel } = activeDuel;

          // Определяем роль пользователя в дуэли
          const isInitiator = duel.player1 === user.telegramId;

          // Получаем имена участников
          const [challenger, challenged] = await Promise.all([
            findUserById(duel.player1),
            findUserById(duel.player2),
          ]);

          const duelRequest: DuelRequest = {
            duelId: duel.id,
            challengerId: duel.player1,
            challengerName: challenger.user?.name || "Игрок 1",
            challengedId: duel.player2,
            challengedName: challenged.user?.name || "Игрок 2",
            seatId: duel.seatId,
            createdAt: duel.createdAt,
          };

          // Показываем соответствующий попап
          if (isInitiator) {
            setActiveDuelAsInitiator(duelRequest);
            toast.custom(
              (t: any) => (
                <DuelRequestPopup
                  request={duelRequest}
                  onClose={() => toast.dismiss(t.id)}
                  isInitiator={true}
                  handleDeclineDuel={handleDeclineDuel}
                  handleAcceptDuel={handleAcceptDuel}
                  isDeclined={false}
                />
              ),
              {
                duration: 60000,
                id: duelRequest.duelId,
                dismissible: false,
              }
            );
          } else {
            setActiveDuelAsTarget(duelRequest);
            toast.custom(
              (t: any) => (
                <DuelRequestPopup
                  request={duelRequest}
                  onClose={() => toast.dismiss(t.id)}
                  isInitiator={false}
                  handleDeclineDuel={handleDeclineDuel}
                  handleAcceptDuel={handleAcceptDuel}
                  isDeclined={false}
                />
              ),
              {
                duration: 60000,
                id: duelRequest.duelId,
                dismissible: false,
              }
            );
          }
        }
      } catch (error) {
        console.error("Error checking active duel:", error);
      }
    };

    console.log("[Home] Checking socket initialization");

    // Initialize socket and register handlers only once
    if (!isSocketInitializedRef.current) {
      console.log("[Home] Initializing socket connection");
      isSocketInitializedRef.current = true;
      const cleanupSocket = initializeSocket(
        user.telegramId,
        (updatedSeats) => {
          console.log("Socket callback received seats update:", updatedSeats);
          if (updatedSeats && Array.isArray(updatedSeats)) {
            setDesks(updatedSeats);
          }
        },
        duelRequestRef,
        showDuelRequestPopupToOpponent
      );

      // Request initial seats data and check active duels
      socket.emit("requestInitialSeats");
      checkActiveDuel();

      // Listen for seat updates
      socket.on("seatsUpdated", (updatedSeats) => {
        if (updatedSeats && Array.isArray(updatedSeats)) {
          console.log("Received seatsUpdated event:", updatedSeats);
          setDesks(updatedSeats);
        }
      });

      // Listen for duel request
      socket.on("duelRequest", (request: DuelRequest) => {
        console.log("Received duel request in Home:", request);
        showDuelRequestPopupToOpponent(request);
      });

      // Listen for duel accepted event
      socket.on("duelAccepted", (data) => {
        console.log("Received duelAccepted event:", data);
        // Очищаем состояния активных дуэлей
        setActiveDuelAsInitiator(null);
        setActiveDuelAsTarget(null);
        toast.dismiss(data.duel?.id);
      });

      // Listen for duel declined event
      socket.on("duelDeclined", (data) => {
        console.log("Received duelDeclined event:", data);
        // Очищаем состояния активных дуэлей
        setActiveDuelAsInitiator(null);
        setActiveDuelAsTarget(null);
        toast.dismiss(data.duel?.id);
      });

      // Listen for duel timeout event
      socket.on("duelTimeout", (data) => {
        console.log("Received duelTimeout event:", data);
        // Очищаем состояния активных дуэлей
        setActiveDuelAsInitiator(null);
        setActiveDuelAsTarget(null);
        toast.dismiss(data.duel?.id);
      });

      fetchInitialDesks();

      return () => {
        console.log("[Home] Cleaning up socket connection");
        isSocketInitializedRef.current = false;
        cleanupSocket();
        socket.off("seatsUpdated");
        socket.off("duelRequest");
        socket.off("duelAccepted");
        socket.off("duelDeclined");
        socket.off("duelTimeout");
        if (rerenderTimeoutRef.current) {
          clearTimeout(rerenderTimeoutRef.current);
        }
      };
    }
  }, [user.telegramId]);

  useEffect(() => {
    const handleDuelTimeout = async (event: Event) => {
      const customEvent = event as CustomEvent<DuelTimeoutEventDetail>;
      const { duel } = customEvent.detail;

      try {
        // Проверяем, что текущий пользователь участвует в этой дуэли
        const isParticipant =
          user.telegramId === duel.player1 || user.telegramId === duel.player2;

        if (!isParticipant) {
          // Если пользователь не участник дуэли, ничего не делаем
          return;
        }

        const seat = await getSeatById(duel.seatId);
        const player1Name = await findUserById(duel.player1);

        // Логика для инициатора дуэли (победителя по таймауту)
        if (user.telegramId === duel.player1) {
          toast.success(
            `Вы заняли место №${seat.id}, так как оппонент не ответил на вызов.`,
            { duration: 5000 }
          );
        }
        // Логика для оппонента
        else {
          toast.info(
            `Место #${seat.id} занято ${player1Name.user?.name}, так как вы не ответили на вызов.`,
            { duration: 5000 }
          );
        }

        // Обновляем состояние мест
        setShouldRerender((prev) => !prev);
      } catch (error) {
        console.error("Ошибка при обработке таймаута дуэли:", error);
        toast.error("Произошла ошибка при обработке таймаута дуэли");
      }
    };

    // Добавляем обработчик события таймаута дуэли
    window.addEventListener("duelTimeout", handleDuelTimeout);

    // Очищаем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener("duelTimeout", handleDuelTimeout);
    };
  }, [user.telegramId]);

  const handleChallengeToDuel = async () => {
    if (selectedSeat && selectedSeat.occupiedBy && occupiedByUser) {
      try {
        const latestSeat = await getSeatById(selectedSeat.id);
        if (!latestSeat || latestSeat.occupiedBy !== selectedSeat.occupiedBy) {
          toast.error("Это место уже занято другим пользователем");
          return;
        }

        // Проверяем, не является ли пользователь инициатором активной дуэли
        if (activeDuelAsInitiator) {
          const now = new Date();
          const duelCreatedAt = new Date(activeDuelAsInitiator.createdAt);
          const timeSinceLastDuel =
            (now.getTime() - duelCreatedAt.getTime()) / 1000;

          if (timeSinceLastDuel < 60) {
            toast.error(
              "Вы не можете начать новую дуэль, пока не завершится текущая или не пройдет 60 секунд",
              {
                closeButton: true,
                duration: 3000,
              }
            );
            return;
          }
        }

        // Проверяем, не является ли пользователь целью другой активной дуэли
        if (activeDuelAsTarget) {
          toast.error(
            "Вы не можете начать дуэль, пока не ответите на текущий вызов",
            {
              closeButton: true,
              duration: 3000,
            }
          );
          return;
        }

        // Проверяем, не является ли цель инициатором или целью другой дуэли
        const targetHasActiveDuel = desks.some(
          (desk) =>
            desk.hasPendingDuel &&
            (desk.pendingDuelInitiator === selectedSeat.occupiedBy ||
              desk.pendingDuelTarget === selectedSeat.occupiedBy)
        );

        if (targetHasActiveDuel) {
          toast.error("Этот игрок уже участвует в другой дуэли", {
            closeButton: true,
            duration: 3000,
          });
          return;
        }

        // Отправляем запрос на создание дуэли
        const data = await requestDuel(
          user.telegramId,
          selectedSeat.occupiedBy.toString(),
          selectedSeat.id
        );

        console.log("Duel request response:", data);

        if (data && data.duel) {
          const { duel } = data;

          const duelRequest: DuelRequest = {
            duelId: duel.id,
            challengerId: user.telegramId,
            challengerName: user.name,
            challengedId: selectedSeat.occupiedBy.toString(),
            challengedName: occupiedByUser?.name || "Соперник",
            seatId: selectedSeat.id,
            createdAt: duel.createdAt || new Date().toISOString(),
          };

          // Устанавливаем активную дуэль для инициатора
          setActiveDuelAsInitiator(duelRequest);

          // show a toast with the duel request to initiator
          toast.custom(
            (t: any) => (
              <DuelRequestPopup
                request={duelRequest}
                onClose={() => toast.dismiss(t.id)}
                isInitiator={true}
                handleDeclineDuel={handleDeclineDuel}
                handleAcceptDuel={handleAcceptDuel}
                isDeclined={false}
              />
            ),
            {
              duration: 60000,
              id: duelRequest.duelId,
              dismissible: false,
            }
          );

          // Отправляем запрос на дуэль через сокет
          socket.emit("duelRequest", {
            challengerId: user.telegramId,
            challengedId: selectedSeat.occupiedBy.toString(),
            seatId: selectedSeat.id,
            challengerName: user.name,
            challengedName: occupiedByUser?.name || "Соперник",
            duelId: duel.id,
            createdAt: duel.createdAt,
          });
          console.log("Duel request sent:", duelRequest);
        } else {
          console.error("Ошибка создания дуэли: Некорректный ответ от сервера");
          toast.error("Ошибка создания дуэли");
        }
      } catch (error: any) {
        // ... rest of error handling ...
      }
    }
  };

  const showDuelRequestPopupToOpponent = (request: DuelRequest) => {
    console.log("Showing duel request popup:", request);

    if (user.telegramId === request.challengedId) {
      const requestWithTime = {
        ...request,
        createdAt: request.createdAt || new Date().toISOString(),
      };

      // Устанавливаем активную дуэль для цели
      setActiveDuelAsTarget(requestWithTime);

      toast.custom(
        (t: any) => (
          <DuelRequestPopup
            request={requestWithTime}
            onClose={() => toast.dismiss(t.id)}
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
    }
  };

  const handleAcceptDuel = async (request: DuelRequest) => {
    try {
      // Очищаем состояния активных дуэлей
      setActiveDuelAsInitiator(null);
      setActiveDuelAsTarget(null);

      // Очищаем состояние дуэли
      duelRequestRef.current = null;
      setDuelRequest(null);

      // Отправляем только через сокет
      socket.emit("acceptDuel", {
        duelId: request.duelId,
      });

      // Закрываем уведомление
      toast.dismiss(request.duelId);
    } catch (e: any) {
      console.log(`Error accepting duel: ${e}`);
      toast.error(e.message || "Ошибка при принятии дуэли.", {
        closeButton: true,
        duration: 3000,
      });
    }
  };

  const handleDeclineDuel = async (
    request: DuelRequest,
    isTimeout: boolean = false
  ) => {
    // Если это не таймаут и это первое нажатие на "Отклонить"
    if (!isTimeout && !request.isConfirmed) {
      // Показываем подтверждение отклонения
      toast.custom(
        (t: any) => (
          <DuelRequestPopup
            request={{ ...request, isConfirmed: true }}
            onClose={() => toast.dismiss(t.id)}
            isInitiator={false}
            handleDeclineDuel={handleDeclineDuel}
            handleAcceptDuel={handleAcceptDuel}
            isDeclined={true}
          />
        ),
        {
          duration: 60000,
          id: request.duelId,
          dismissible: false,
        }
      );
      return;
    }

    try {
      // Очищаем состояния активных дуэлей
      setActiveDuelAsInitiator(null);
      setActiveDuelAsTarget(null);

      // Отправляем событие отклонения через сокет
      socket.emit("declineDuel", {
        duelId: request.duelId,
        isTimeout: isTimeout,
      });

      // Закрываем уведомление о дуэли
      toast.dismiss(request.duelId);

      // Очищаем состояние дуэли
      duelRequestRef.current = null;
      setDuelRequest(null);
    } catch (error: any) {
      console.error("Error declining duel:", error);
      toast.error(error.message || "Ошибка при отклонении дуэли.", {
        closeButton: true,
        duration: 3000,
      });
    }
  };

  const handleSelectSeat = async (seat: SeatType) => {
    setSelectedSeat(seat);
    if (seat.occupiedBy) {
      try {
        const occupant = await findUserById(seat.occupiedBy);
        setOccupiedByUser(occupant.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Ошибка загрузки информации о пользователе.");
      }
    } else {
      setOccupiedByUser(null);
    }
  };

  const handleCloseModal = () => {
    setSelectedSeat(null);
    setOccupiedByUser(null);
  };

  const handleOccupySeat = async () => {
    if (selectedSeat) {
      // Optimistically update the UI immediately
      setDesks((prevDesks) =>
        prevDesks.map((desk) => {
          if (desk.id === selectedSeat.id) {
            // Set new seat
            return { ...desk, occupiedBy: user.telegramId };
          } else if (desk.occupiedBy === user.telegramId) {
            // Clear previous seat
            return { ...desk, occupiedBy: null };
          }
          return desk;
        })
      );
      setSelectedSeat(null);
      setOccupiedByUser(null);

      try {
        await toast.promise(
          (async () => {
            const updatedSeat = await takeSeat(
              user.telegramId,
              selectedSeat.id
            );
            socket.emit("updateSeat", {
              seatId: selectedSeat.id,
              userId: user.telegramId,
            });
            return updatedSeat;
          })(),
          {
            loading: "Занимаем место...",
            success: "Место успешно занято!",
            error: "Ошибка! Попробуйте позже.",
          }
        );
      } catch (error: any) {
        // If the update fails, revert both the new and previous seat changes
        setDesks((prevDesks) =>
          prevDesks.map((desk) => {
            if (desk.id === selectedSeat.id) {
              // Revert new seat
              return { ...desk, occupiedBy: null };
            } else {
              // Check if this was the user's previous seat
              const wasUsersPreviousSeat = prevDesks.find(
                (d) => d.id === desk.id && d.occupiedBy === user.telegramId
              );
              if (wasUsersPreviousSeat) {
                // Restore previous seat
                return { ...desk, occupiedBy: user.telegramId };
              }
            }
            return desk;
          })
        );
        console.error("Error occupying seat:", error);
      }
    }
  };

  // Добавляем эффект для очистки истекших дуэлей
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();

      // Проверяем и очищаем истекшие дуэли инициатора
      if (activeDuelAsInitiator) {
        const duelCreatedAt = new Date(activeDuelAsInitiator.createdAt);
        const timeSinceLastDuel =
          (now.getTime() - duelCreatedAt.getTime()) / 1000;

        if (timeSinceLastDuel >= 60) {
          setActiveDuelAsInitiator(null);
        }
      }
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, [activeDuelAsInitiator]);

  return (
    <DesignCircles>
      <Toaster
        position="top-center"
        expand={true}
        richColors
        closeButton={false}
      />
      <div className={styles.home_wrapper}>
        <Link to={"/info"} className={styles.infoButton}>
          <Info size={32} />
        </Link>
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <>
            <div className={styles.container}>
              <p className={styles.title}>
                Привет, <b>{user.name}</b>!
              </p>
              <p className={styles.subtitle}>До начала</p>
              <Timer time={time} isActive={isGameActive} />
              {isGameActive && (
                <p className={styles.gameStatus}>
                  Игра активна!
                  <br />
                  Быстрее займи своё место!
                </p>
              )}
            </div>
            <DeskContainer
              key={shouldRerender ? "rerender" : "initial"}
              desks={desks}
              onSelect={handleSelectSeat}
              isModalOpen={!!selectedSeat}
            />
          </>
        )}
        <Footer styles={{ marginTop: "10px" }} />
      </div>

      <SeatModal
        isOpen={!!selectedSeat}
        onClose={handleCloseModal}
        seat={selectedSeat}
        occupiedByUser={occupiedByUser}
        user={user}
        onChallenge={handleChallengeToDuel}
        onOccupy={handleOccupySeat}
      />
    </DesignCircles>
  );
};

export default Home;
