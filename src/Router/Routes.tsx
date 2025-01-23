import Info from "@/pages/Info/Info";
import type { ReactElement } from "react";
import App from "../App";
import CoinFlip from "../components/CoinFlip/CoinFlip";

interface IRoute {
  path: string;
  element: ReactElement;
}

export const routes: IRoute[] = [
  { path: "/", element: <App /> },
  {
    path: "/coinflip/:duelId/:challengerId/:challengedId",
    element: <CoinFlip />,
  },
  { path: "/info", element: <Info /> },
];
