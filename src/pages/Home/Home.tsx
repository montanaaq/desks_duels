// src/components/Home/Home.tsx

import { FC, useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import DesignCircles from "../../components/DesignCircles/DesignCircles";
import Footer from "../../components/Footer";
import Logo from "../../components/Logo";
import useSchoolTimer from "../../hooks/useSchoolTimer";
import { requestDuel, sendAcceptDuel } from "../../services/duelService";
import { getDesks, getSeatById, takeSeat } from "../../services/seatService";
import { initializeSocket, socket } from "../../services/socketService";
import { findUserById } from "../../services/userService";
import { SeatType } from "../../types/seat.types";
import { userType } from "../../types/user.types";
import DeskContainer from "./DeskContainer/DeskContainer";
import DuelRequestPopup from "./DuelRequestPopup/DuelRequestPopup";
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
    fetchInitialDesks();

    // Initialize socket and register handlers
    const cleanupSocket = initializeSocket(
      user.telegramId,
      setDesks,
      duelRequestRef,
      showDuelRequestPopup
    );

    return () => cleanupSocket(); // Clean up socket on component unmount
  }, [user.telegramId]);

  const handleChallengeToDuel = async () => {
    if (selectedSeat && selectedSeat.occupiedBy) {
      try {
        const latestSeat = await getSeatById(selectedSeat.id);
        // Проверяем, не участвует ли место в дуэли
        if (latestSeat.dueled) {
          toast.error("Это место уже участвует в дуэли.");
          return;
        }

        // Проверяем, не участвует ли текущий пользователь в другой дуэли
        if (user.dueling) {
          toast.error("Вы уже участвуете в другой дуэли.");
          return;
        }

        // Проверяем, не участвует ли противник в другой дуэли
        const opponent = await findUserById(Number(selectedSeat.occupiedBy));
        if (opponent.user.dueling) {
          toast.error("Противник уже участвует в другой дуэли.");
          return;
        }

        // Proceed with duel request
        const response = await requestDuel(
          user.telegramId,
          selectedSeat.occupiedBy.toString(),
          selectedSeat.id
        );
        const { duel } = response;

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
        toast.success("Дуэль предложена");
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
    duelRequestRef.current = request;
    setDuelRequest(request);
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
    if (isTimeout) {
      toast.info("Время истекло. ${request.challengerName} занимает место.");
    } else {
      let remainingTime = initialTime;
      let toastId = toast(
        "Вы автоматически проиграете в дуэли, при отказе. Оставшееся время: ${remainingTime} секунд",
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
            "Вы автоматически проиграете в дуэли, при отказе. Оставшееся время: ${remainingTime} секунд",
            {
              action: {
                label: "Принять",
                onClick: () => acceptDuel(request),
              },
            }
          );
        } else {
          clearInterval(intervalId);
        }
      }, 1000);
    }

    duelRequestRef.current = null;
    setDuelRequest(null);
  };

  const handleSelectSeat = async (seat: SeatType) => {
    setSelectedSeat(seat);
    if (seat.occupiedBy) {
      try {
        const occupant = await findUserById(Number(seat.occupiedBy));
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
      try {
        const updatedSeat = await takeSeat(user.telegramId, selectedSeat.id);
        socket.emit("seatOccupied", updatedSeat);
        setSelectedSeat(null);
        setOccupiedByUser(null); // Обновляем состояние, чтобы исключить использование `occupiedByUser?.name`
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        toast.success("Успешно занято!");
      } catch (error: any) {
        console.error("Error occupying seat:", error);
        toast.error(error.message || "Ошибка! Попробуйте позже.");
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
          <Timer
            time={time}
            isActive={isGameActive}
          />
          {isGameActive && (
            <p className={styles.gameStatus}>
              Игра активна!
              <br />
              Быстрее займи своё место!
            </p>
          )}
        </div>
        <DeskContainer
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

      {duelRequest && (
        <DuelRequestPopup
          request={duelRequest}
          onAccept={acceptDuel}
          onDecline={handleDeclineDuel}
        />
      )}
    </DesignCircles>
  );
};

export default Home;
