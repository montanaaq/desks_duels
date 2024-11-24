// src/components/Home/Home.tsx

import { FC, useCallback, useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import DesignCircles from "../../components/DesignCircles/DesignCircles";
import Footer from "../../components/Footer";
import Logo from "../../components/Logo";
import useSchoolTimer from "../../hooks/useSchoolTimer";
import {
  declineDuel,
  requestDuel,
  sendAcceptDuel,
} from "../../services/duelService";
import { getDesks, getSeatById, takeSeat } from "../../services/seatService";
import { initializeSocket, socket } from "../../services/socketService";
import { findUserById } from "../../services/userService";
import { SeatType } from "../../types/seat.types";
import { userType } from "../../types/user.types";
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
      showDuelRequestPopup
    );

    // Request initial seats data
    socket.emit("requestInitialSeats");

    // Listen for seat updates
    socket.on("seatsUpdated", (updatedSeats) => {
      setDesks(updatedSeats);
    });

    fetchInitialDesks();

    return () => {
      cleanupSocket();
      socket.off("seatsUpdated");
      if (rerenderTimeoutRef.current) {
        clearTimeout(rerenderTimeoutRef.current);
      }
    };
  }, [user.telegramId]);

  const handleChallengeToDuel = async () => {
    if (selectedSeat && selectedSeat.occupiedBy) {
      try {
        const latestSeat = await getSeatById(selectedSeat.id);
        // Проверяем, не участвует ли место в дуэли
        if (latestSeat.status === 'dueled') {
          toast.error("Это место уже участвует в дуэли.");
          return;
        }

        // Проверяем, не участвует ли текущий пользователь в другой дуэли
        if (user.dueling) {
          toast.error("Вы уже участвуете в другой дуэли.");
          return;
        }

        // Проверяем, не участвует ли противник в другой дуэли
        const opponent = await findUserById(selectedSeat.occupiedBy);
        if (opponent.user.dueling) {
          toast.error("Противник уже участвует в другой дуэли.");
          return;
        }

        // Proceed with duel request
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
          toast.error("Один из игроков уже участвует в активной дуэли.");
        } else {
          toast.error(error.message || "Ошибка при создании дуэли.");
        }
      }
    }
  };

  const showDuelRequestPopup = (request: DuelRequest) => {
    const DuelRequestPopup: FC<{
      request: DuelRequest;
      onClose: () => void;
    }> = ({ request, onClose }) => {
      const [remainingTime, setRemainingTime] = useState(60);
      const intervalRef = useRef<NodeJS.Timeout | null | undefined>(null);

      useEffect(() => {
        // Start the countdown
        intervalRef.current = setInterval(() => {
          setRemainingTime((prevTime) => {
            if (prevTime <= 1) {
              // Time expired
              onClose();
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);

        // Cleanup interval on unmount
        return () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        };
      }, [onClose]);

      const handleDecline = () => {
        handleDeclineDuel(request, false, remainingTime);
        onClose();
      };

      const handleAccept = () => {
        acceptDuel(request);
        onClose();
      };

      return (
        <div className={styles.duel_request_pop_up}>
          <p>
            Пользователь <b>{request.challengerName}</b> вызвал вас на дуэль!
          </p>
          <p>Оставшееся время: {remainingTime} секунд</p>
          <div>
            <button className={styles.button_decline} onClick={handleDecline}>
              Отказаться
            </button>
            <button className={styles.button_accept} onClick={handleAccept}>
              Принять
            </button>
          </div>
        </div>
      );
    };

    // Show the custom toast with the new dynamic component
    toast.custom(
      (t: any) => (
        <DuelRequestPopup
          request={request}
          onClose={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 60000,
        id: request.duelId,
        // Prevent auto-dismissal
        dismissible: false,
      }
    );
  };

  const acceptDuel = async (request: DuelRequest) => {
    try {
      duelRequestRef.current = null;
      setDuelRequest(null);
      await sendAcceptDuel(request.duelId);
      toast.success("Дуэль успешно принята!");

      // Emit acceptDuel via Socket.IO
      socket.emit("acceptDuel", {
        duelId: request.duelId,
      });
    } catch (e: any) {
      console.log(`Error accepting duel: ${e}`);
      toast.error(e.message || "Ошибка при принятии дуэли.");
    }
  };

  const handleDeclineDuel = (
    request: DuelRequest,
    isTimeout = false,
    initialTime = 60
  ) => {
    const handleDecline = async () => {
      try {
        // Send decline request to backend
        await declineDuel(request.duelId);

        if (isTimeout) {
          toast.info(
            `Время истекло. ${request.challengerName} занимает место.`
          );
        } else {
          toast.info(`Вы отклонили дуэль с ${request.challengerName}.`);
        }
      } catch (error: any) {
        toast.error(error.message || "Ошибка при отклонении дуэли");
      } finally {
        duelRequestRef.current = null;
        setDuelRequest(null);
      }
    };

    if (!isTimeout) {
      let remainingTime = initialTime;
      let toastId = toast(
        `Вы автоматически проиграете в дуэли, при отказе. Оставшееся время: ${remainingTime} секунд`,
        {
          action: {
            label: "Принять",
            onClick: () => acceptDuel(request),
          },
        }
      );

      const intervalId = setInterval(() => {
        remainingTime -= 1;
        if (remainingTime > 0) {
          toast.dismiss(toastId);
          toastId = toast(
            `Вы автоматически проиграете в дуэли, при отказе. Оставшееся время: ${remainingTime} секунд`,
            {
              action: {
                label: "Принять",
                onClick: () => acceptDuel(request),
              },
            }
          );
        } else {
          clearInterval(intervalId);
          handleDecline();
        }
      }, 1000);
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
        position="bottom-center"
        expand={true}
        richColors
        closeButton={false}
      />
      <div className={styles.home_wrapper}>
        <Logo
          style={{
            width: "82.5px",
            height: "55px",
            position: "absolute",
            top: "35px",
            left: "10px",
          }}
          textStyles={{
            position: "absolute",
            top: "20px",
            left: "10px",
            fontSize: "12px",
          }}
        />
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
        <Footer />
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
