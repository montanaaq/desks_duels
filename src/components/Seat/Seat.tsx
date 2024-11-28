// src/components/Seat/Seat.tsx
import { FC } from "react";
import { toast } from "sonner";
import { SeatType } from "../../types/seat.types";
import styles from "./Seat.module.css";
import useSchoolTimer from "../../hooks/useSchoolTimer";

interface SeatProps {
  seat: SeatType;
  isSelected: boolean;
  onSelect: (seat: SeatType) => void;
  isModalOpen: boolean;
}

const Seat: FC<SeatProps> = ({ seat, isSelected, onSelect, isModalOpen }) => {
  // const { isGameActive } = useSchoolTimer();
  const isGameActive = true;

  let circleClass;
  if (seat.status === 'dueled') {
    // If seat has been dueled, mark it as unavailable
    circleClass = styles.unavailable;
  } else if (seat.occupiedBy) {
    // If seat is occupied and not dueled
    circleClass = styles.occupied;
  } else {
    // If seat is free (not occupied)
    circleClass = styles.free;
  }

  const handleSeatClick = () => {
    if (!isGameActive) {
      setTimeout(() => {
        toast.error("Места можно занимать только когда игра активна!", {
          closeButton: true,
          duration: 3000,
        });
      }, 250);
      return;
    }
    onSelect(seat);
  };

  return (
    <div
      onClick={handleSeatClick}
      className={`${styles.desk_circle} ${circleClass} ${
        isSelected && isModalOpen ? styles.active : ""
      }`}
    ></div>
  );
};

export default Seat;
