// src/lib/play/theme.ts
//
// Tema visual da experiência de jogar/TV. Fica em organizations.theme (jsonb).
// Presets prontos + opção "custom" (cores + fonte).

export type ThemeFont = "playful" | "elegant" | "clean";
export type ThemePreset = "arcade" | "museum" | "school" | "night" | "custom";

export type OrgTheme = {
  preset: ThemePreset;
  accent?: string;
  bgFrom?: string;
  bgTo?: string;
  font?: ThemeFont;
};

export type ResolvedTheme = {
  bgFrom: string;
  bgTo: string;
  accent: string;
  fontClass: string;
};

export const THEME_PRESETS: Record<
  Exclude<ThemePreset, "custom">,
  { label: string; emoji: string; accent: string; bgFrom: string; bgTo: string; font: ThemeFont }
> = {
  arcade: { label: "Arcade", emoji: "🎮", accent: "#7c3aed", bgFrom: "#7c3aed", bgTo: "#0f172a", font: "playful" },
  museum: { label: "Museu / Histórico", emoji: "🏛️", accent: "#b45309", bgFrom: "#78350f", bgTo: "#1c1917", font: "elegant" },
  school: { label: "Escola", emoji: "🎒", accent: "#f59e0b", bgFrom: "#0ea5e9", bgTo: "#1e3a8a", font: "playful" },
  night: { label: "Noturno", emoji: "🌙", accent: "#818cf8", bgFrom: "#312e81", bgTo: "#020617", font: "clean" },
};

export const FONT_LABELS: Record<ThemeFont, string> = {
  playful: "Divertida (arredondada)",
  elegant: "Elegante (serifada)",
  clean: "Limpa (sem serifa)",
};

const FONT_CLASS: Record<ThemeFont, string> = {
  playful: "font-display",
  elegant: "font-elegant",
  clean: "font-sans",
};

/** Converte o theme salvo (+ primary_color legado) num tema pronto pra render. */
export function resolveTheme(theme: unknown, primaryColor?: string | null): ResolvedTheme {
  const t = (theme ?? null) as OrgTheme | null;

  if (t?.preset && t.preset !== "custom" && THEME_PRESETS[t.preset]) {
    const p = THEME_PRESETS[t.preset];
    return { bgFrom: p.bgFrom, bgTo: p.bgTo, accent: p.accent, fontClass: FONT_CLASS[p.font] };
  }

  if (t?.preset === "custom") {
    const accent = t.accent || primaryColor || "#7c3aed";
    return {
      bgFrom: t.bgFrom || accent,
      bgTo: t.bgTo || "#0f172a",
      accent,
      fontClass: FONT_CLASS[t.font ?? "playful"],
    };
  }

  // Sem tema definido: compatível com o comportamento antigo (cor primária).
  const accent = primaryColor || "#7c3aed";
  return { bgFrom: accent, bgTo: "#0f172a", accent, fontClass: "font-display" };
}
