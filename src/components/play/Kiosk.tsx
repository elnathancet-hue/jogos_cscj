"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

import { initSound, playClick } from "@/lib/play/sound";
import { renderGamePlayer, isWideType } from "@/components/play/render-player";
import { SoundToggle } from "@/components/play/SoundToggle";
import { LiveRanking } from "@/components/play/LiveRanking";

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
const IDLE_ADVANCE_MS = 22000;

export function Kiosk({ games, origin }: { games: KioskGame[]; origin: string }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"attract" | "playing">("attract");
  const [round, setRound] = useState(0);
  const [returning, setReturning] = useState(false);
  const [secs, setSecs] = useState(RETURN_SECONDS);

  const game = games[index];
  const accent = game.primaryColor || "#7c3aed";
  const wide = isWideType(game.settings);
  const isPlaylist = games.length > 1;
  const playUrl = `${origin}/play/${game.id}`;

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % games.length);
    setRound((r) => r + 1);
  }, [games.length]);

  // countdown para voltar à atração (e avançar pro próximo jogo) após o resultado
  useEffect(() => {
    if (!returning) return;
    if (secs <= 0) {
      setReturning(false);
      setPhase("attract");
      advance();
      return;
    }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [returning, secs, advance]);

  // troca automática de jogo quando ninguém joga (carrossel)
  useEffect(() => {
    if (phase !== "attract" || !isPlaylist) return;
    const t = setTimeout(advance, IDLE_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [phase, index, isPlaylist, advance]);

  const handleFinish = useCallback(() => {
    setSecs(RETURN_SECONDS);
    setReturning(true);
  }, []);

  function start() {
    initSound();
    playClick();
    setPhase("playing");
  }

  function goFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) void el.requestFullscreen().catch(() => {});
  }

  function renderPlayer() {
    return renderGamePlayer(
      { id: game.id, settings: game.settings },
      { autoStart: true, playerName: "Visitante", onFinish: handleFinish },
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
          className="relative flex min-h-screen w-full cursor-pointer flex-col items-center justify-center gap-8 px-6 py-16 text-center text-white"
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

          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12">
            <div className="flex flex-col items-center gap-5">
              {game.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={game.coverImageUrl}
                  alt=""
                  className="max-h-48 w-auto rounded-2xl border-4 border-white/20 object-cover shadow-2xl"
                />
              )}
              <div className="space-y-2">
                <h1 className="font-display text-5xl font-bold drop-shadow sm:text-6xl">
                  {game.title}
                </h1>
                {game.description && (
                  <p className="mx-auto max-w-xl text-lg text-white/90">{game.description}</p>
                )}
              </div>

              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="rounded-full bg-white px-10 py-4 font-display text-2xl font-bold shadow-xl"
                style={{ color: accent }}
              >
                ▶ Toque para jogar
              </motion.div>

              <div className="flex flex-col items-center gap-2">
                <div className="rounded-2xl bg-white p-3 shadow-lg">
                  <QRCodeSVG value={playUrl} size={104} />
                </div>
                <p className="text-sm text-white/80">ou aponte a câmera do celular</p>
              </div>
            </div>

            <LiveRanking gameId={game.id} />
          </div>

          {isPlaylist && (
            <div className="flex items-center gap-2">
              {games.map((g, i) => (
                <span
                  key={g.id}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-6 bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
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
              <span className="text-sm">
                {isPlaylist ? "Próximo jogo" : "Próximo jogador"} em {secs}s…
              </span>
              <button
                type="button"
                onClick={() => {
                  setReturning(false);
                  setPhase("attract");
                  advance();
                }}
                className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-slate-900"
              >
                {isPlaylist ? "Pular" : "Jogar de novo"}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
