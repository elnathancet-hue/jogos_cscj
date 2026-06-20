// src/components/play/PlayStage.tsx
//
// Palco "arcade" da página pública de jogar: fundo vibrante com a cor da
// organização, formas decorativas, header divertido e o player como children.

import { SoundToggle } from "@/components/play/SoundToggle";

type PlayStageProps = {
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  orgName?: string | null;
  primaryColor?: string | null;
  logoUrl?: string | null;
  wide?: boolean;
  children: React.ReactNode;
};

export function PlayStage({
  title,
  description,
  coverImageUrl,
  orgName,
  primaryColor,
  logoUrl,
  wide,
  children,
}: PlayStageProps) {
  const accent = primaryColor || "#7c3aed";

  return (
    <main
      className="relative flex min-h-screen items-start justify-center overflow-hidden px-4 py-10"
      style={{ background: `linear-gradient(160deg, ${accent} 0%, #0f172a 100%)` }}
    >
      {/* formas decorativas */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

      <div className={`relative ${wide ? "w-full max-w-2xl" : "w-full max-w-md"}`}>
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white shadow-xl">
          <div
            className="relative px-6 py-7 text-white"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
          >
            <div className="absolute right-4 top-4">
              <SoundToggle />
            </div>

            {(orgName || logoUrl) && (
              <div className="mb-3 flex items-center gap-2">
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-7 w-7 rounded-full bg-white/20 object-cover"
                  />
                )}
                {orgName && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/90">
                    {orgName}
                  </span>
                )}
              </div>
            )}
            <h1 className="font-display text-3xl font-bold leading-tight drop-shadow-sm">
              {title}
            </h1>
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
