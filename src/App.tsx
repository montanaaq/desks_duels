import { FC, useEffect, useState } from "react";
import DesignCircles from "./components/DesignCircles/DesignCircles.tsx";
import Footer from "./components/Footer.tsx";
import Logo from "./components/Logo.tsx";
import { useTelegram } from "./hooks/useTelegram.ts";
import Home from "./pages/Home/Home.tsx";
import Rules from "./pages/Rules/Rules.tsx";
import { findUserById } from "./services/userService.ts";
import { userType } from "./types/user.types.ts";

const App: FC = () => {
  const [user, setUser] = useState<userType | null>(null);
  const [loading, setLoading] = useState(true);
  // const [telegramId, setTelegramId] = useState<string | null>(null);
  const { tg } = useTelegram();
  const telegramId = tg.initDataUnsafe?.user.id;
  // const telegramId = 1;

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
      if (!telegramId) {
        console.error("Telegram ID is undefined");
        setLoading(false);
        return;
      }

      const user = await getUserByTelegramId(telegramId);
      if (user) {
        setUser(user);
      }
      setLoading(false);
    };
    checkUser();
  }, [telegramId]);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return (
      <DesignCircles>
        <div className="App_if_user_not_found">
          <Logo
            style={{ marginTop: "10px", width: "135px", height: "90px" }}
            textStyles={{ fontSize: "20px", marginTop: "10px" }}
          />
          <p>
            Пользователь не найден! Попробуйте зарегистрироваться с помощью{" "}
            <b>/start</b> в нашем телеграм боте{" "}
            <b>@</b>
            <a
              style={{
                color: "var(--color-text)",
                textUnderlineOffset: "3px",
                textDecorationThickness: "0.07rem",
                fontWeight: "bold",
              }}
              target="_blank"
              href="https://t.me/desksduels_bot"
            >desksduels_bot
            </a>
          </p>
          <Footer />
        </div>
        {/* Uncomment the following block if you want to manually enter Telegram ID for testing */}
        {/* <div>
          <input
            type="number"
            value={telegramId ?? ""}
            onChange={(e) => setTelegramId(e.target.value)}
            placeholder="Enter Telegram ID"
          />
        </div> */}
      </DesignCircles>
    );
  }

  return user && user.rules_seen ? <Home user={user} /> : <Rules />;
};

export default App;
