// src/pages/Home/DeskContainer/DeskContainer.tsx
import { useState, type FC } from "react";
import Seat from "@/components/Seat/Seat.tsx";
import SkeletonLoader from "@/components/SkeletonLoader/SkeletonLoader.tsx";
import type { SeatType } from "@/types/seat.types.ts";
import styles from "./DeskContainer.module.css";

interface DeskContainerProps {
  desks: SeatType[];
  onSelect: (seat: SeatType) => void;
  isModalOpen: boolean;
}

const DeskContainer: FC<DeskContainerProps> = ({
  desks,
  onSelect,
  isModalOpen,
}) => {
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);

  const handleSeatSelect = (seat: SeatType) => {
    setSelectedSeatId(seat.id);
    onSelect(seat);
  };

  if (!desks || desks.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <div className={styles.desks_container}>
      <div className={styles.desks}>
        {[...Array(18)].map((_, deskIndex) => (
          <div className={styles.desk} key={deskIndex}>
            {[...Array(2)].map((_, varIndex) => {
              const seatIndex = deskIndex * 2 + varIndex;
              const seat = desks[seatIndex];

              // Если места нет в массиве, возвращаем пустой div
              if (!seat) {
                return (
                  <div
                    key={`empty-${seatIndex}`}
                    className={styles.empty_seat}
                  />
                );
              }

              return (
                <Seat
                  key={seat.id}
                  seat={seat}
                  isSelected={seat.id === selectedSeatId}
                  isModalOpen={isModalOpen}
                  onSelect={handleSeatSelect}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeskContainer;
