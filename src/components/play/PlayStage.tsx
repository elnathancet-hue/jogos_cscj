// src/components/play/PlayStage.tsx
//
// Palco da página pública de jogar, com o TEMA da organização (cores + fonte).

import { SoundToggle } from "@/components/play/SoundToggle";
import type { ResolvedTheme } from "@/lib/play/theme";

type PlayStageProps = {
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  orgName?: string | null;
  logoUrl?: string | null;
  theme: ResolvedTheme;
  wide?: boolean;
  children: React.ReactNode;
};

export function PlayStage({
  title,
  description,
  coverImageUrl,
  orgName,
  logoUrl,
  theme,
  wide,
  children,
}: PlayStageProps) {
  return (
    <main
      className={`relative flex min-h-screen items-start justify-center overflow-hidden px-4 py-10 ${theme.fontClass}`}
      style={{ background: `linear-gradient(160deg, ${theme.bgFrom} 0%, ${theme.bgTo} 100%)` }}
    >
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

      <div className={`relative ${wide ? "w-full max-w-2xl" : "w-full max-w-md"}`}>
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white shadow-xl">
          <div
            className="relative px-6 py-7 text-white"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)` }}
          >
            <div className="absolute right-4 top-4">
              <SoundToggle />
            </div>

            {(orgName || logoUrl) && (
              <div className="mb-3 flex items-center gap-2">
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-7 w-7 rounded-full bg-white/20 object-cover" />
                )}
                {orgName && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/90">
                    {orgName}
                  </span>
                )}
              </div>
            )}
            <h1 className="text-3xl font-bold leading-tight drop-shadow-sm">{title}</h1>
            {description && <p className="mt-1 text-sm text-white/90">{description}</p>}
          </div>

          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt="" className="h-40 w-full object-cover" />
          )}

          <div className="p-6">{children}</div>
        </div>
        <p className="mt-3 text-center text-xs text-white/70">▶ Jogos CSCJ</p>
      </div>
    </main>
  );
}
