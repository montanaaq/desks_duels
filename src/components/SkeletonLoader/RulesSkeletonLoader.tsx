import { type FC } from "react";
import DesignCircles from "../DesignCircles/DesignCircles";
import Footer from "../Footer";
import styles from "./SkeletonLoader.module.css";

const RulesSkeletonLoader: FC = () => {
  return (
    <DesignCircles>
      <div className={styles.rules_skeleton}>
        <div className={styles.rules_logo} />
        <div className={styles.rules_container}>
          <div className={styles.rules_title} />
          {[...Array(4)].map((_, index) => (
            <div key={index} className={styles.rules_item}>
              <div className={styles.rules_bullet} />
              <div className={styles.rules_text} />
            </div>
          ))}
          <div className={styles.rules_checkbox} />
          <div className={styles.rules_button} />
        </div>
        <Footer styles={{ marginTop: "auto" }} />
      </div>
    </DesignCircles>
  );
};

export default RulesSkeletonLoader;
