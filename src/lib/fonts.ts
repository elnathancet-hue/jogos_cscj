import { Fredoka } from "next/font/google";

// Fonte arredondada/divertida usada nas experiências de jogo (/play e /kiosk).
export const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
