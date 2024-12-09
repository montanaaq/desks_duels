import type { FC } from "react";
import { useEffect, useState } from "react";
import DesignCircles from "./components/DesignCircles/DesignCircles.tsx";
import Footer from "./components/Footer.tsx";
import Logo from "./components/Logo.tsx";
import { useTelegram } from "./hooks/useTelegram.ts";
import Home from "./pages/Home/Home.tsx";
import Rules from "./pages/Rules/Rules.tsx";
import { findUserById } from "./services/userService.ts";
import type { userType } from "./types/user.types.ts";

const App: FC = () => {
  const [user, setUser] = useState<userType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { tg } = useTelegram();
  const telegramId = tg?.initDataUnsafe?.user?.id;

  const getUserByTelegramId = async (telegramId: string) => {
    try {
      const userData = await findUserById(telegramId);
      console.log("Fetched user data:", userData);
      return userData.user || null;
    } catch (error) {
      console.error("Error getting user by Telegram ID:", error);
      return null;
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (!tg) {
          console.error("Telegram WebApp is not initialized");
          setLoading(false);
          return;
        }

        if (!telegramId) {
          console.error("Telegram ID is undefined");
          setLoading(false);
          return;
        }

        const user = await getUserByTelegramId(telegramId);
        if (user) {
          setUser(user);
        }
      } catch (error) {
        console.error("Error in checkUser:", error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [telegramId, tg]);

  if (loading) return <div>Loading...</div>;

  if (!tg || !telegramId || !user) {
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
        </div>
      </DesignCircles>
    );
  }

  return user && user.rules_seen ? <Home user={user} /> : <Rules />;
};

export default App;
