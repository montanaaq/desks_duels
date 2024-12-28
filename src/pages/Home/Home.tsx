// src/components/Home/Home.tsx

import { Info } from "lucide-react";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast, Toaster } from "sonner";
import DesignCircles from "../../components/DesignCircles/DesignCircles";
import DuelRequestPopup from "../../components/DuelRequestPopup/DuelRequestPopup";
import Footer from "../../components/Footer";
import useSchoolTimer from "../../hooks/useSchoolTimer";
import {
  declineDuel,
  requestDuel,
  sendAcceptDuel,
} from "../../services/duelService";
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
        const data = await getDesks();
        setDesks(data);
      } catch (error) {
        console.error("Error fetching desks:", error);
        toast.error("Ошибка загрузки мест. Попробуйте позже.");
      }
    };

    // Initialize socket and register handlers
    const cleanupSocket = initializeSocket(
      user.telegramId,
      (updatedSeats) => {
        console.log("Socket callback received seats update:", updatedSeats);
        setDesks(updatedSeats);
      },
      duelRequestRef,
      showDuelRequestPopupToOpponent
    );

    // Request initial seats data
    socket.emit("requestInitialSeats");

    // Listen for seat updates
    socket.on("seatsUpdated", (updatedSeats) => {
      setDesks(updatedSeats);
    });

    // Listen for duel response events
    socket.on("duelAccepted", (data: { duelId: number }) => {
      console.log("Home: Duel accepted, dismissing toast", data.duelId);
      toast.dismiss(data.duelId);
    });

    socket.on(
      "duelDeclined",
      async (data: {
        duel: {
          seatId: number;
          player1: string;
          player2: string;
          isAutoDeclined: boolean;
        };
      }) => {
        const { duel } = data;

        try {
          // Проверяем, что текущий пользователь участвует в этой дуэли
          const isParticipant =
            user.telegramId === duel.player1 ||
            user.telegramId === duel.player2;

          if (!isParticipant) {
            return;
          }

          const [seat, player1Name] = await Promise.all([
            getSeatById(duel.seatId),
            findUserById(duel.player1),
          ]);

          // Если дуэль автоматически отклонена (по истечении времени)
          if (duel.isAutoDeclined) {
            if (user.telegramId === duel.player1) {
              // Для инициатора дуэли
              toast.success(
                `Вы заняли место №${seat.id}, так как оппонент не ответил на вызов.`,
                { duration: 5000 }
              );
            } else {
              // Для оппонента
              toast.info(
                `Место #${seat.id} занято ${player1Name.user?.name}, так как вы не ответили на вызов.`,
                { duration: 5000 }
              );
            }
          } else {
            // Для обычного отклонения
            if (user.telegramId === duel.player1) {
              toast.error(
                `Ваш вызов на дуэль за место №${seat.id} был отклонен.`,
                { duration: 5000 }
              );
            } else {
              toast.success(
                `Вы отклонили вызов на дуэль за место №${seat.id}.`,
                { duration: 5000 }
              );
            }
          }

          // Обновляем состояние мест
          setShouldRerender((prev) => !prev);
        } catch (error) {
          console.error("Ошибка при обработке отклонения дуэли:", error);
          toast.error("Произошла ошибка при обработке отклонения дуэли");
        }
      }
    );

    fetchInitialDesks();

    return () => {
      cleanupSocket();
      socket.off("seatsUpdated");
      socket.off("duelAccepted");
      socket.off("duelDeclined");
      if (rerenderTimeoutRef.current) {
        clearTimeout(rerenderTimeoutRef.current);
      }
    };
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
          try {
            await takeSeat(user.telegramId, seat.id);
            toast.success(
              `Вы заняли место №${seat.id}, так как оппонент не ответил на вызов.`,
              { duration: 5000 }
            );
          } catch (error) {
            toast.error(
              `Не удалось занять место №${seat.id}. Возможно, оно уже занято.`,
              { duration: 5000 }
            );
          }
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
    if (selectedSeat && selectedSeat.occupiedBy) {
      try {
        const latestSeat = await getSeatById(selectedSeat.id);
        // Проверяем, не участвует ли место в дуэли
        if (latestSeat.status === "dueled") {
          toast.error("Это место уже участвует в дуэли.", {
            closeButton: true,
            duration: 3000,
          });
          return;
        }

        // Проверяем, не участвует ли текущий пользователь в другой дуэли
        if (user.dueling) {
          toast.error("Вы уже участвуете в другой дуэли.", {
            closeButton: true,
            duration: 3000,
          });
          return;
        }

        // Проверяем, не участвует ли противник в другой дуэли
        const opponent = await findUserById(selectedSeat.occupiedBy);
        if (opponent.user.dueling) {
          toast.error("Противник уже участвует в другой дуэли.", {
            closeButton: true,
            duration: 3000,
          });
          return;
        }

        // render a toast with a loading indicator
        const response = await toast.promise(
          requestDuel(
            user.telegramId,
            selectedSeat.occupiedBy.toString(),
            selectedSeat.id
          ),
          {
            loading: "Отправка запроса на дуэль...",
            success: "Запрос на дуэль отправлен",
            error: "Ошибка! Попробуйте позже.",
          }
        );
        const data = await response.unwrap();
        if (data && data.duel) {
          const { duel } = data;

          const duelRequest: DuelRequest = {
            duelId: duel.id,
            challengerId: user.telegramId,
            challengerName: user.name,
            challengedId: selectedSeat.occupiedBy.toString(),
            challengedName: occupiedByUser?.name || "Соперник",
            seatId: selectedSeat.id,
          };
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

          // Emit duelRequest with duelId
          socket.emit("duelRequest", duelRequest);
        } else {
          console.error("Ошибка создания дуэли: Некорректный ответ от сервера");
          toast.error("Ошибка создания дуэли");
        }
      } catch (error: any) {
        console.error("Error creating duel:", error);
        if (
          error.message.includes("Seat is already involved in another duel.")
        ) {
          toast.error("Место уже участвует в другой дуэли.");
        } else if (error.message.includes("Seat is not occupied.")) {
          toast.error("Это место не занято.");
        } else if (
          error.message.includes(
            "One of the players is already in an active duel."
          )
        ) {
          toast.error("Один из игроков уже участвует в активной дуэли.", {
            closeButton: true,
            duration: 3000,
          });
        } else {
          toast.error(error.message || "Ошибка при создании дуэли.", {
            closeButton: true,
            duration: 3000,
          });
        }
      }
    }
  };

  const showDuelRequestPopupToOpponent = (request: DuelRequest) => {
    // Toast for the challenged user (recipient)
    toast.custom(
      (t: any) => (
        <DuelRequestPopup
          request={request}
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
  };

  const handleAcceptDuel = async (request: DuelRequest) => {
    try {
      duelRequestRef.current = null;
      setDuelRequest(null);
      await sendAcceptDuel(request.duelId);
      toast.success("Дуэль успешно принята!");

      // Emit acceptDuel via Socket.IO
      socket.emit("acceptDuel", {
        duelId: request.duelId,
      });

      // Dismiss the toast for both users
      socket.emit("duelAccepted", {
        duelId: request.duelId,
      });
    } catch (e: any) {
      console.log(`Error accepting duel: ${e}`);
      toast.error(e.message || "Ошибка при принятии дуэли.", {
        closeButton: true,
        duration: 3000,
      });
    }
  };

  const handleDeclineDuel = (
    request: DuelRequest,
    isTimeout = false
  ) => {
    const handleDecline = async () => {
      try {
        // Send decline request to backend с параметром isTimeout
        await declineDuel(request.duelId, isTimeout);
        // Broadcast the decline event
        socket.emit("duelDeclined", {
          duelId: request.duelId,
          challengerId: request.challengerId,
          challengedId: request.challengedId,
        });

        // Close own toast
        toast.dismiss(request.duelId);

        // Emit duelDeclined to close toasts for both users
        socket.emit("duelDeclined", {
          duelId: request.duelId,
        });

        if (isTimeout) {
          toast.info(
            `Время истекло. ${request.challengerName} занимает место.`,
            {
              duration: 5000,
            }
          );
        } else {
          toast.info(`Вы отклонили дуэль с ${request.challengerName}.`, {
            duration: 5000,
          });
        }
      } catch (error: any) {
        toast.error(error.message || "Ошибка при отклонении дуэли", {
          closeButton: true,
          duration: 3000,
        });
      } finally {
        duelRequestRef.current = null;
        setDuelRequest(null);
      }
    };

    if (!isTimeout) {
      toast.custom(
        (t: any) => (
          <DuelRequestPopup
            request={request}
            onClose={() => toast.dismiss(t.id)}
            isInitiator={null}
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
    } else {
      handleDecline();
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
            console.log("Emitting updateSeat event:", {
              seatId: selectedSeat.id,
              userId: user.telegramId,
            });
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
