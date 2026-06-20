import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getGameType } from "@/lib/games/types";
import { readQuizQuestions } from "@/lib/games/quiz";
import { readMemoryPairs } from "@/lib/games/memory";
import { readCrosswordEntries } from "@/lib/games/crossword";
import { PlayStage } from "@/components/play/PlayStage";
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
  cover_image_url: string | null;
  org_name: string | null;
  primary_color: string | null;
  logo_url: string | null;
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
    <PlayStage
      title={game.title}
      description={game.description}
      coverImageUrl={game.cover_image_url}
      orgName={game.org_name}
      primaryColor={game.primary_color}
      logoUrl={game.logo_url}
      wide={isCrossword}
    >
      {renderPlayer(game)}
    </PlayStage>
  );
}
