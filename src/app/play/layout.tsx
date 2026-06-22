import { playFontVars } from "@/lib/fonts";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <div className={playFontVars}>{children}</div>;
}
