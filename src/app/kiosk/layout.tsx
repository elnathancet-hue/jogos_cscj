import { fredoka } from "@/lib/fonts";

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${fredoka.variable} font-display`}>{children}</div>;
}
