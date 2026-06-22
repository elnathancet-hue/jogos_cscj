import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { resolveTheme } from "@/lib/play/theme";

export const metadata: Metadata = { title: "Jogos · Jogos CSCJ" };
export const dynamic = "force-dynamic";

type PublicGame = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  org_name: string | null;
  primary_color: string | null;
  logo_url: string | null;
  theme: unknown;
};

// Gradientes de fallback para capas sem imagem (variando por jogo).
const FALLBACKS = [
  "from-violet-500 to-indigo-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-sky-600",
];

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_org_public_games", { p_org_id: orgId });
  const games = (Array.isArray(data) ? data : []) as PublicGame[];
  if (games.length === 0) notFound();

  const first = games[0];
  const theme = resolveTheme(first.theme, first.primary_color);

  return (
    <main className="min-h-screen bg-slate-50">
      <header
        className="px-6 py-10 text-white"
        style={{ background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})` }}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          {first.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={first.logo_url} alt="" className="h-12 w-12 rounded-full bg-white/20 object-cover" />
          )}
          <div>
            <p className="text-sm uppercase tracking-widest text-white/80">{first.org_name}</p>
            <h1 className="text-2xl font-bold sm:text-3xl">Escolha um jogo</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g, i) => (
            <Link
              key={g.id}
              href={`/play/${g.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                {g.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.cover_image_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${FALLBACKS[i % FALLBACKS.length]} p-4 text-center`}
                  >
                    <span className="text-lg font-bold text-white drop-shadow">{g.title}</span>
                  </div>
                )}
                <span className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-lg text-slate-900 shadow-lg transition-transform group-hover:scale-110">
                  ▶
                </span>
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-slate-950">{g.title}</h2>
                {g.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{g.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="pb-10 text-center text-xs text-slate-400">▶ Jogos CSCJ</footer>
    </main>
  );
}
