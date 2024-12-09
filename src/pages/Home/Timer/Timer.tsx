// src/components/Home/Timer/Timer.tsx

import type { FC } from "react";
import styles from "./Timer.module.css";

interface TimerProps {
  time: string;
  isActive: boolean;
}

const Timer: FC<TimerProps> = ({ time, isActive }) => {
  return (
    <div className={`${styles.timer} ${isActive ? styles.active : ""}`}>
      {time}
    </div>
  );
};

export default Timer;
