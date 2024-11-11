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
  // const [telegramId, setTelegramId] = useState<number>(); // Initial sample Telegram ID
  const { tg } = useTelegram();
  // const telegramId = tg.initDataUnsafe?.user.id;
  const telegramId = 1


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
