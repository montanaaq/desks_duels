// src/pages/Home/DeskContainer/DeskContainer.tsx
import type { FC } from "react";
import { useState } from "react";
import Seat from "../../../components/Seat/Seat";
import SkeletonLoader from "../../../components/SkeletonLoader/SkeletonLoader";
import type { SeatType } from "../../../types/seat.types";
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

  return (
    <div className={styles.desks_container}>
      <div className={styles.desks}>
        {desks.length > 0 ? (
          [...Array(18)].map((_, deskIndex) => (
            <div className={styles.desk} key={deskIndex}>
              {[...Array(2)].map((_, varIndex) => {
                const seat = desks[deskIndex * 2 + varIndex];
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
          ))
        ) : (
          <SkeletonLoader />
        )}
      </div>
    </div>
  );
};

export default DeskContainer;
