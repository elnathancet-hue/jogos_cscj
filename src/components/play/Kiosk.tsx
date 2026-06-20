"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

import { getGameType } from "@/lib/games/types";
import { readQuizQuestions } from "@/lib/games/quiz";
import { readMemoryPairs } from "@/lib/games/memory";
import { readCrosswordEntries } from "@/lib/games/crossword";
import { initSound, playClick } from "@/lib/play/sound";
import { QuizPlay } from "@/components/play/QuizPlay";
import { MemoryPlay } from "@/components/play/MemoryPlay";
import { CrosswordPlay } from "@/components/play/CrosswordPlay";
import { SoundToggle } from "@/components/play/SoundToggle";

export type KioskGame = {
  id: string;
  title: string;
  description: string | null;
  settings: unknown;
  coverImageUrl: string | null;
  orgName: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
};

const RETURN_SECONDS = 12;

export function Kiosk({ game, playUrl }: { game: KioskGame; playUrl: string }) {
  const accent = game.primaryColor || "#7c3aed";
  const type = getGameType(game.settings);
  const wide = type === "crossword";

  const [phase, setPhase] = useState<"attract" | "playing">("attract");
  const [round, setRound] = useState(0);
  const [returning, setReturning] = useState(false);
  const [secs, setSecs] = useState(RETURN_SECONDS);

  // countdown para voltar à atração depois do resultado
  useEffect(() => {
    if (!returning) return;
    if (secs <= 0) {
      setReturning(false);
      setPhase("attract");
      setRound((r) => r + 1);
      return;
    }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [returning, secs]);

  function start() {
    initSound();
    playClick();
    setPhase("playing");
  }

  // estável: senão o efeito de onFinish no player redispara a cada tick.
  const handleFinish = useCallback(() => {
    setSecs(RETURN_SECONDS);
    setReturning(true);
  }, []);

  function goFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) void el.requestFullscreen().catch(() => {});
  }

  function renderPlayer() {
    const common = { autoStart: true, playerName: "Visitante", onFinish: handleFinish };
    if (type === "quiz") {
      const q = readQuizQuestions(game.settings);
      if (q.length) return <QuizPlay gameId={game.id} questions={q} {...common} />;
    }
    if (type === "memory") {
      const p = readMemoryPairs(game.settings);
      if (p.length) return <MemoryPlay gameId={game.id} pairs={p} {...common} />;
    }
    if (type === "crossword") {
      const e = readCrosswordEntries(game.settings);
      if (e.length) return <CrosswordPlay gameId={game.id} entries={e} {...common} />;
    }
    return (
      <p className="py-8 text-center text-slate-500">Este jogo ainda não tem conteúdo.</p>
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${accent} 0%, #0f172a 100%)` }}
    >
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <SoundToggle />
        <button
          type="button"
          onClick={goFullscreen}
          aria-label="Tela cheia"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
        >
          ⛶
        </button>
      </div>

      {phase === "attract" ? (
        <button
          type="button"
          onClick={start}
          className="relative flex min-h-screen w-full cursor-pointer flex-col items-center justify-center gap-8 px-6 text-center text-white"
        >
          {(game.orgName || game.logoUrl) && (
            <div className="flex items-center gap-2">
              {game.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={game.logoUrl} alt="" className="h-9 w-9 rounded-full bg-white/20 object-cover" />
              )}
              {game.orgName && (
                <span className="text-sm font-semibold uppercase tracking-widest text-white/90">
                  {game.orgName}
                </span>
              )}
            </div>
          )}

          {game.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={game.coverImageUrl}
              alt=""
              className="max-h-56 w-auto rounded-2xl border-4 border-white/20 object-cover shadow-2xl"
            />
          )}

          <div className="space-y-2">
            <h1 className="font-display text-5xl font-bold drop-shadow sm:text-6xl">{game.title}</h1>
            {game.description && (
              <p className="mx-auto max-w-xl text-lg text-white/90">{game.description}</p>
            )}
          </div>

          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="rounded-full bg-white px-10 py-4 font-display text-2xl font-bold text-slate-900 shadow-xl"
            style={{ color: accent }}
          >
            ▶ Toque para jogar
          </motion.div>

          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl bg-white p-3 shadow-lg">
              <QRCodeSVG value={playUrl} size={120} />
            </div>
            <p className="text-sm text-white/80">ou aponte a câmera do celular</p>
          </div>
        </button>
      ) : (
        <div className="relative flex min-h-screen items-start justify-center px-4 py-10">
          <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>
            <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div
                className="flex items-center gap-2 px-6 py-4 text-white"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
              >
                {game.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={game.logoUrl} alt="" className="h-7 w-7 rounded-full bg-white/20 object-cover" />
                )}
                <span className="font-display text-lg font-bold">{game.title}</span>
              </div>
              <div className="p-6">
                <div key={round}>{renderPlayer()}</div>
              </div>
            </div>
          </div>

          {returning && (
            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center gap-4 bg-slate-900/90 px-4 py-3 text-white">
              <span className="text-sm">Próximo jogador em {secs}s…</span>
              <button
                type="button"
                onClick={() => {
                  setReturning(false);
                  setPhase("attract");
                  setRound((r) => r + 1);
                }}
                className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-slate-900"
              >
                Jogar de novo
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
