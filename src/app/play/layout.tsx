import { Fredoka } from "next/font/google";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  // Identidade "arcade" só na experiência pública de jogar.
  return <div className={`${fredoka.variable} font-display`}>{children}</div>;
}
