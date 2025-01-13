import { Swords } from "lucide-react";
import type { FC, CSSProperties } from "react";

interface FooterProps {
  styles?: CSSProperties;
}

const Footer: FC<FooterProps> = ({ styles }) => {
  return (
    <span
      style={{
        textAlign: "center",
        color: "var(--color-text)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "12px",
        opacity: "50%",
        ...styles,
      }}
    >
      <Swords size={18} />
      &nbsp; Made by&nbsp;{" "}
      <a
        style={{
          color: "var(--color-text)",
          textUnderlineOffset: "1px",
          textDecorationThickness: "0.03rem",
          fontWeight: "bold",
        }}
        target="_blank"
        href="https://montaanaq.netlify.app/"
      >
        Montana.
      </a>
    </span>
  );
};

export default Footer;
