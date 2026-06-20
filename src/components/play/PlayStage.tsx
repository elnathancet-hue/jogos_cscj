// src/components/play/PlayStage.tsx
//
// Palco branded da página pública de jogar: header com a cor da organização,
// logo + nome, capa do jogo (se houver) e o player como children.

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
  const accent = primaryColor || "#2563eb";

  return (
    <main className="flex min-h-screen items-start justify-center bg-slate-50 px-4 py-10">
      <div className={wide ? "w-full max-w-2xl" : "w-full max-w-md"}>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className="px-6 py-6 text-white"
            style={{ background: `linear-gradient(135deg, ${accent}f2, ${accent}b3)` }}
          >
            {(orgName || logoUrl) && (
              <div className="mb-3 flex items-center gap-2">
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-6 w-6 rounded-full bg-white/20 object-cover"
                  />
                )}
                {orgName && (
                  <span className="text-xs font-medium uppercase tracking-wide text-white/90">
                    {orgName}
                  </span>
                )}
              </div>
            )}
            <h1 className="text-2xl font-bold leading-tight">{title}</h1>
            {description && <p className="mt-1 text-sm text-white/90">{description}</p>}
          </div>

          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt="" className="h-40 w-full object-cover" />
          )}

          <div className="p-6">{children}</div>
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">Feito com Jogos CSCJ</p>
      </div>
    </main>
  );
}
