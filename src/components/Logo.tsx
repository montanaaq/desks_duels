import type { FC } from "react";
import logo from "/logo.png";

interface LogoProps {
  style?: object;
  textStyles?: object;
}

const Logo: FC<LogoProps> = ({ style, textStyles }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <h2 style={{ ...textStyles, color: "var(--color-text)" }}>Desks Duels</h2>
      <img
        style={{ ...style, mixBlendMode: "multiply", zIndex: 10 }}
        src={logo}
        alt="icon"
      />
    </div>
  );
};

export default Logo;
