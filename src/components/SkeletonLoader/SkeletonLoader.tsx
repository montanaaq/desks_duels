import { type FC } from "react";
import styles from "./SkeletonLoader.module.css";

const SkeletonLoader: FC = () => {
  return (
    <div className={styles.skeleton_container}>
      <div className={styles.skeleton_header}>
        <div className={styles.skeleton_title} />
        <div className={styles.skeleton_subtitle} />
        <div className={styles.timerSkeleton} />
      </div>
      <div className={styles.skeleton_desks_container}>
        <div className={styles.skeleton_desks}>
          {[...Array(18)].map((_, deskIndex) => (
            <div className={styles.skeleton_desk} key={deskIndex}>
              {[...Array(2)].map((_, seatIndex) => (
                <div
                  key={`seat-${deskIndex}-${seatIndex}`}
                  className={styles.skeleton_seat}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
