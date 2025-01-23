// src/components/Home/SeatModal/SeatModal.tsx

import Modal from "@/components/Modal/Modal.tsx";
import InlineSkeletonLoader from "@/components/SkeletonLoader/InlineSkeletonLoader.tsx";
import type { SeatType } from "@/types/seat.types.ts";
import type { userType } from "@/types/user.types.ts";
import type { FC } from "react";
import styles from "./SeatModal.module.css";

interface SeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  seat: SeatType | null;
  occupiedByUser: userType | null;
  user: userType;
  onChallenge: () => void;
  onOccupy: () => void;
}

const SeatModal: FC<SeatModalProps> = ({
  isOpen,
  onClose,
  seat,
  occupiedByUser,
  user,
  onChallenge,
  onOccupy,
}) => {
  if (!seat) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <h2>Место {seat.rowNumber} ряда</h2>
        <h2>Парта: {seat.deskNumber}</h2>
        <h2 style={{ marginBottom: "10px" }}>Вариант: № {seat.variant}</h2>
        <div className={styles.status_info}>
          <p>Статус:</p>
          <p
            style={
              seat.status === "dueled" && seat.occupiedBy
                ? { color: "var(--color-error)" }
                : { color: "var(--color-success)" }
            }
          >
            {seat.status == "dueled" && seat.occupiedBy
              ? "Дуэль завершена"
              : "Доступно для дуэли"}
          </p>
        </div>
        <p className={styles.occupied_info}>
          Занято:{" "}
          {seat.occupiedBy
            ? occupiedByUser?.name ?? <InlineSkeletonLoader />
            : "Нет"}
        </p>
        {seat.status !== "dueled" &&
          user.telegramId !== seat.occupiedBy &&
          (seat.occupiedBy ? (
            <button className={styles.modal_button} onClick={onChallenge}>
              Предложить дуэль
            </button>
          ) : (
            <button className={styles.modal_button} onClick={onOccupy}>
              Занять место
            </button>
          ))}
      </div>
    </Modal>
  );
};

export default SeatModal;
