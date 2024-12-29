import { type FC } from "react";
import DesignCircles from "../DesignCircles/DesignCircles";
import Footer from "../Footer";
import styles from "./SkeletonLoader.module.css";

const CoinFlipSkeletonLoader: FC = () => {
  return (
    <DesignCircles>
      <div className={styles.coinFlip_skeleton}>
        <div className={styles.coinFlip_logo} />
        <div className={styles.coinFlip_players}>
          <div className={styles.coinFlip_player} />
          <div className={styles.coinFlip_vs}>VS</div>
          <div className={styles.coinFlip_player} />
        </div>
        <div className={styles.coinFlip_text} />
        <div className={styles.coinFlip_coin} />
        <div className={styles.coinFlip_winner} />
        <Footer styles={{ marginTop: "auto" }} />
      </div>
    </DesignCircles>
  );
};

export default CoinFlipSkeletonLoader;
