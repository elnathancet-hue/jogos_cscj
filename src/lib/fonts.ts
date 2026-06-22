import { Fredoka, Playfair_Display } from "next/font/google";

// Fonte arredondada/divertida (padrão arcade/escola).
export const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Fonte serifada/elegante (museu / histórico).
export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["500", "600", "700"],
  display: "swap",
});

/** Classe a aplicar no container do palco para carregar as variáveis de fonte. */
export const playFontVars = `${fredoka.variable} ${playfair.variable}`;
