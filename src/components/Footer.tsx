import { Swords } from "lucide-react";
import { FC } from "react";

const Footer: FC = () => {
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
        marginTop: "auto",
      }}
    >
      <Swords size={18} />
      &nbsp; Made by&nbsp;{" "}
      <a
        style={{
          color: "var(--color-text)",
          textUnderlineOffset: "1px",
          textDecorationThickness: "0.03rem",
		  fontWeight: "bold"
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
