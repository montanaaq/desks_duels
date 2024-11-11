// src/components/Home/Timer/Timer.tsx

import { FC } from "react";
import styles from "./Timer.module.css";

interface TimerProps {
  minutes: number;
  seconds: number;
  isActive: boolean;
}

const Timer: FC<TimerProps> = ({ minutes, seconds, isActive }) => {
  return (
    <div className={`${styles.timer} ${isActive ? styles.active : ""}`}>
      {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
    </div>
  );
};

export default Timer;
