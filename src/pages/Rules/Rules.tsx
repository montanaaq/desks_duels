// pages/Rules/Rules.tsx
import type {FC} from "react";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {toast, Toaster} from "sonner";
import DesignCircles from "@/components/DesignCircles/DesignCircles";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import RulesSkeletonLoader from "@/components/SkeletonLoader/RulesSkeletonLoader";
import {isLocal} from "@/config.ts";
import {useTelegram} from "@/hooks/useTelegram.ts";
import {handleAcceptRules} from "@/services/rulesService.ts";
import styles from "./Rules.module.css";

const Rules: FC = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const {tg} = useTelegram();

  useEffect(() => {
    // Имитация загрузки данных
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  const handleNextClick = () => {
    // Получаем ID пользователя из Telegram или localStorage в зависимости от режима
    const telegramId = isLocal
      ? localStorage.getItem("telegramId")
      : tg.initDataUnsafe?.user.id;

    if (isChecked && telegramId) {
      setIsLoading(true);
      handleAcceptRules(telegramId, navigate).then((r) => r);
      toast.promise(handleAcceptRules(telegramId, navigate), {
        loading: "Загрузка...",
        success: "Успешно",
        error: "Ошибка! Попробуйте позже.",
      });
      navigate("/");
      // ждать 0.5 секунды перед перезагрузкой страницы для корректной response
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  if (isLoading) {
    return <RulesSkeletonLoader/>;
  }

  return (
    <DesignCircles>
      <Toaster
        position="top-center"
        expand={true}
        richColors
        closeButton={false}
      />
      <div className={styles.rules_wrapper}>
        <Logo
          style={{marginTop: "10px", width: "135px", height: "90px"}}
          textStyles={{fontSize: "20px", marginTop: "10px"}}
        />
        <div className={styles.container}>
          <h1>Правила игры</h1>
          <ol>
            <li>
              <b>Начало игры:</b> "Битва за места" включается автоматически
              каждую перемену до 14:00, ваша задача только не забыть.
            </li>
            <li>
              <b>Выбор места:</b> За 1 минуту до урока откроется выбор мест.
              Если место занято, игрок может вызвать владельца на дуэль.
            </li>
            <li>
              <b>Мини-игры:</b> Для получения места оба игрока соревнуются в
              быстрой мини-игре. Побеждает тот, кому повезет!
            </li>
            <li>
              <b>Результаты:</b> Победитель закрепляет за место до конца урока,
              а проигравший его теряет. Новая битва начинается на следующую
              перемену.
            </li>
          </ol>
          <div className={styles.checkbox_container}>
            <div className={styles.checkbox_wrapper_13}>
              <input
                checked={isChecked}
                onChange={handleCheckboxChange}
                type="checkbox"
              />
            </div>
            <p>Я прочитал и ознакомился со всеми правилами игры</p>
          </div>
          <button
            onClick={handleNextClick}
            className={isChecked ? styles.button : styles.button_disabled}
            disabled={!isChecked}
          >
            Далее
          </button>
        </div>
        <Footer styles={{marginTop: "auto"}}/>
      </div>
    </DesignCircles>
  );
};

export default Rules;
