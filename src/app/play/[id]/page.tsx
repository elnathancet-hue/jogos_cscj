import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getGameType } from "@/lib/games/types";
import { readQuizQuestions } from "@/lib/games/quiz";
import { readMemoryPairs } from "@/lib/games/memory";
import { readCrosswordEntries } from "@/lib/games/crossword";
import { Card } from "@/components/ui/Card";
import { PlayForm } from "@/components/play/PlayForm";
import { QuizPlay } from "@/components/play/QuizPlay";
import { MemoryPlay } from "@/components/play/MemoryPlay";
import { CrosswordPlay } from "@/components/play/CrosswordPlay";

export const metadata: Metadata = { title: "Jogar · Jogos CSCJ" };
export const dynamic = "force-dynamic";

type PublicGame = {
  id: string;
  title: string;
  description: string | null;
  settings: unknown;
};

function renderPlayer(game: PublicGame) {
  const type = getGameType(game.settings);

  if (type === "quiz") {
    const questions = readQuizQuestions(game.settings);
    if (questions.length) return <QuizPlay gameId={game.id} questions={questions} />;
  }
  if (type === "memory") {
    const pairs = readMemoryPairs(game.settings);
    if (pairs.length) return <MemoryPlay gameId={game.id} pairs={pairs} />;
  }
  if (type === "crossword") {
    const entries = readCrosswordEntries(game.settings);
    if (entries.length) return <CrosswordPlay gameId={game.id} entries={entries} />;
  }
  // sem conteúdo válido ainda → formulário de demonstração
  return <PlayForm gameId={game.id} />;
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_public_game", { p_game_id: id });
  const game = (Array.isArray(data) ? data[0] : data) as PublicGame | undefined;
  if (!game) notFound();

  const isCrossword = getGameType(game.settings) === "crossword";

  return (
    <main className="flex min-h-screen items-start justify-center bg-slate-50 px-4 py-12">
      <div className={isCrossword ? "w-full max-w-2xl" : "w-full max-w-md"}>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-950">{game.title}</h1>
          {game.description && (
            <p className="mt-2 text-sm text-slate-600">{game.description}</p>
          )}
        </div>
        <Card>{renderPlayer(game)}</Card>
      </div>
    </main>
  );
}
