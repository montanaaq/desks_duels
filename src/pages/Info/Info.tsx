import DesignCircles from "@/components/DesignCircles/DesignCircles";
import Footer from "@/components/Footer";
import { Award, Target, Undo2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./Info.module.css";

const Info = () => {
  return (
    <DesignCircles>
      <div className={styles.container}>
        <Link to={"/"} className={styles.backButton}>
          <Undo2 size={32} />
        </Link>
        <div className={styles.content}>
          <h1 className={styles.title}>Desks Duels</h1>
          <div className={styles.description}>
            <p>
              Desks Duels - это игра, превращающая выбор места в классе в
              увлекательное соревнование. Бросайте вызов, участвуйте в дуэлях и
              займите своё место!
            </p>
          </div>

          <ul className={styles.features}>
            <li className={styles.feature}>
              <div className={styles.featureIcon}>
                <Target />
              </div>
              <h3 className={styles.featureTitle}>Вызовы</h3>
              <p>Бросайте вызов за любое место в классе</p>
            </li>
            <li className={styles.feature}>
              <div className={styles.featureIcon}>
                <Award />
              </div>
              <h3 className={styles.featureTitle}>Дуэли</h3>
              <p>Честные дуэли с системой Coin Flip</p>
            </li>
            <li className={styles.feature}>
              <div className={styles.featureIcon}>
                <Users />
              </div>
              <h3 className={styles.featureTitle}>Взаимодействие</h3>
              <p>Отслеживайте дуэли за места в реальном времени</p>
            </li>
          </ul>

          <div className={styles.linksContainer}>
            <a
              href="https://t.me/montaanaq"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Связаться с разработчиком
            </a>

            <a
              href="https://t.me/desksduels_bot"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Перейти в чат бота
            </a>
          </div>
        </div>
        <Footer />
      </div>
    </DesignCircles>
  );
};

export default Info;
