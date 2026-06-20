// src/components/play/render-player.tsx
//
// Escolhe o player certo pelo tipo do jogo. Client-safe (só players + readers
// puros) — usado tanto pela página /play quanto pelo Kiosk.

import { getGameType } from "@/lib/games/types";
import { readQuizQuestions } from "@/lib/games/quiz";
import { readMemoryPairs } from "@/lib/games/memory";
import { readCrosswordEntries } from "@/lib/games/crossword";
import { readTrueFalse } from "@/lib/games/truefalse";
import { readOrdering } from "@/lib/games/ordering";
import { readWordsearchWords } from "@/lib/games/wordsearch";
import { readHotspot } from "@/lib/games/hotspot";
import { PlayForm } from "@/components/play/PlayForm";
import { QuizPlay } from "@/components/play/QuizPlay";
import { MemoryPlay } from "@/components/play/MemoryPlay";
import { CrosswordPlay } from "@/components/play/CrosswordPlay";
import { TrueFalsePlay } from "@/components/play/TrueFalsePlay";
import { OrderingPlay } from "@/components/play/OrderingPlay";
import { WordsearchPlay } from "@/components/play/WordsearchPlay";
import { HotspotPlay } from "@/components/play/HotspotPlay";

export type PlayerExtra = {
  autoStart?: boolean;
  playerName?: string;
  onFinish?: () => void;
};

/** Tipos que ficam melhores num card mais largo. */
export function isWideType(settings: unknown): boolean {
  const t = getGameType(settings);
  return t === "crossword" || t === "wordsearch" || t === "hotspot";
}

export function renderGamePlayer(
  game: { id: string; settings: unknown },
  extra?: PlayerExtra,
) {
  const type = getGameType(game.settings);
  const e = extra ?? {};

  if (type === "quiz") {
    const questions = readQuizQuestions(game.settings);
    const timed = (game.settings as { timed?: boolean })?.timed;
    if (questions.length) return <QuizPlay gameId={game.id} questions={questions} timed={timed} {...e} />;
  }
  if (type === "truefalse") {
    const statements = readTrueFalse(game.settings);
    if (statements.length) return <TrueFalsePlay gameId={game.id} statements={statements} {...e} />;
  }
  if (type === "memory") {
    const pairs = readMemoryPairs(game.settings);
    if (pairs.length) return <MemoryPlay gameId={game.id} pairs={pairs} {...e} />;
  }
  if (type === "ordering") {
    const o = readOrdering(game.settings);
    if (o && o.items.length) return <OrderingPlay gameId={game.id} prompt={o.prompt ?? ""} items={o.items} {...e} />;
  }
  if (type === "wordsearch") {
    const words = readWordsearchWords(game.settings);
    if (words.length) return <WordsearchPlay gameId={game.id} words={words} {...e} />;
  }
  if (type === "crossword") {
    const entries = readCrosswordEntries(game.settings);
    if (entries.length) return <CrosswordPlay gameId={game.id} entries={entries} {...e} />;
  }
  if (type === "hotspot") {
    const hs = readHotspot(game.settings);
    if (hs && hs.targets.length) {
      return <HotspotPlay gameId={game.id} imageUrl={hs.imageUrl} targets={hs.targets} tolerance={hs.tolerance} {...e} />;
    }
  }
  return <PlayForm gameId={game.id} />;
}
