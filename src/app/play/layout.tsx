import { fredoka } from "@/lib/fonts";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  // Identidade "arcade" só na experiência pública de jogar.
  return <div className={`${fredoka.variable} font-display`}>{children}</div>;
}
