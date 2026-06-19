import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PlayForm } from "@/components/play/PlayForm";

export const metadata: Metadata = { title: "Jogar · Jogos CSCJ" };
export const dynamic = "force-dynamic";

type PublicGame = {
  id: string;
  title: string;
  description: string | null;
};

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RPC pública: só retorna jogos publicados (anon pode chamar).
  const { data } = await supabase.rpc("get_public_game", { p_game_id: id });
  const game = (Array.isArray(data) ? data[0] : data) as PublicGame | undefined;

  if (!game) notFound();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-950">{game.title}</h1>
          {game.description && (
            <p className="mt-2 text-sm text-slate-600">{game.description}</p>
          )}
        </div>
        <Card>
          <PlayForm gameId={game.id} />
        </Card>
        <p className="mt-4 text-center text-xs text-slate-400">
          Sessão de demonstração — o motor do jogo entra numa próxima fase.
        </p>
      </div>
    </main>
  );
}
