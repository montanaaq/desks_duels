import { FC, useState, useEffect } from "react";
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
  const { tg } = useTelegram();
  const telegramId = tg.initDataUnsafe?.user.id;

  const getUserByTelegramId = async (telegramId: number) => {
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

  // Polling Effect to Keep Backend and Bot Active
  useEffect(() => {
    const interval = setInterval(() => {
      // Ping the Backend
      fetch("https://desks-duels-backend.onrender.com/health-check")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Backend health check failed");
          }
          console.log("Backend is active");
        })
        .catch((error) => {
          console.error("Error pinging backend:", error);
        });

      // Ping the Telegram Bot
      fetch("https://desks-duels-bot.onrender.com/health-check")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Bot health check failed");
          }
          console.log("Bot is active");
        })
        .catch((error) => {
          console.error("Error pinging bot:", error);
        });
    }, 240000); // 240,000 ms = 4 minutes

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

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
            <b>/start</b> в нашем телеграм боте <b>@desks_duels</b>
          </p>
          <Footer />
        </div>
        {/* Uncomment the following block if you want to manually enter Telegram ID for testing */}
        {/* <div>
          <input
            type="number"
            value={telegramId}
            onChange={(e) => setTelegramId(Number(e.target.value))}
            placeholder="Enter Telegram ID"
          />
        </div> */}
      </DesignCircles>
    );
  }

  return user && user.rules_seen ? <Home user={user} /> : <Rules />;
};

export default App;
