import DesignCircles from "@/components/DesignCircles/DesignCircles.tsx";
import Footer from "@/components/Footer.tsx";
import Logo from "@/components/Logo.tsx";
import { isLocal } from "@/config.ts";
import { useTelegram } from "@/hooks/useTelegram.ts";
import Home from "@/pages/Home/Home.tsx";
import Rules from "@/pages/Rules/Rules.tsx";
import { findUserById } from "@/services/userService.ts";
import type { userType } from "@/types/user.types.ts";
import { useEffect, useState, type FC } from "react";
import SkeletonLoader from "./components/SkeletonLoader/SkeletonLoader";

const App: FC = () => {
  const [user, setUser] = useState<userType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { tg } = useTelegram();
  const webAppId = tg?.initDataUnsafe?.user?.id;

  // Инициализируем telegramId в зависимости от режима
  const [telegramId, setTelegramId] = useState<number | null>(() => {
    if (isLocal) {
      const savedId = localStorage.getItem("telegramId");
      console.log("Local testing mode, telegramId from localStorage:", savedId);
      return savedId ? Number(savedId) : null;
    } else {
      console.log("Production mode, telegramId from WebApp:", webAppId);
      return webAppId || null;
    }
  });

  // Обработчик изменения ID только для локального тестирования
  const handleTelegramIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLocal) return;
    const newId = Number(e.target.value);
    console.log("Setting new telegramId:", newId);
    setTelegramId(newId);
    if (newId) {
      localStorage.setItem("telegramId", newId.toString());
    } else {
      localStorage.removeItem("telegramId");
    }
  };

  const getUserByTelegramId = async (telegramId: string) => {
    try {
      const userData = await findUserById(telegramId);
      console.log("Fetched user data for ID", telegramId, ":", userData);
      return userData.user || null;
    } catch (error) {
      console.error("Error getting user by Telegram ID:", error);
      return null;
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (!telegramId) {
          console.log("No telegramId available");
          setLoading(false);
          return;
        }

        console.log("Checking user for telegramId:", telegramId);
        const user = await getUserByTelegramId(String(telegramId));
        if (user) {
          console.log("Found user:", user);
          setUser(user);
        } else {
          console.log("No user found for telegramId:", telegramId);
        }
      } catch (error) {
        console.error("Error in checkUser:", error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [telegramId]);

  if (loading) return <SkeletonLoader />;

  if (!telegramId || !user) {
    return (
      <DesignCircles>
        <div className="App_if_user_not_found">
          <Logo
            style={{ marginTop: "10px", width: "160px", height: "115px" }}
            textStyles={{ fontSize: "23px", marginTop: "10px" }}
          />
          <p>
            <span>
              Пользователь не найден! Попробуйте зарегистрироваться с помощью{" "}
              <b>/start</b> в нашем телеграм боте <b>@</b>
              <a
                style={{
                  color: "var(--color-text)",
                  textUnderlineOffset: "3px",
                  textDecorationThickness: "0.07rem",
                  fontWeight: "bold",
                }}
                target="_blank"
                href="https://t.me/desksduels_bot"
              >
                desksduels_bot
              </a>
            </span>
          </p>
          <Footer styles={{ marginTop: "auto" }} />

          {/* Input for testing with different Telegram IDs - only shown in local mode */}
          {isLocal && (
            <div style={{ marginTop: "20px" }}>
              <input
                type="number"
                value={telegramId ?? ""}
                onChange={handleTelegramIdChange}
                placeholder="Enter Telegram ID"
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  fontSize: "16px",
                  width: "200px",
                }}
              />
            </div>
          )}
        </div>
      </DesignCircles>
    );
  }

  return user && user.rules_seen ? <Home user={user} /> : <Rules />;
};

export default App;
