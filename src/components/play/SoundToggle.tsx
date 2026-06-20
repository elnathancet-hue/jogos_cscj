"use client";

import { useEffect, useState } from "react";

import { isMuted, setMuted } from "@/lib/play/sound";

export function SoundToggle() {
  const [muted, setM] = useState(false);

  useEffect(() => {
    setM(isMuted());
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !muted;
        setMuted(next);
        setM(next);
      }}
      aria-label={muted ? "Ativar som" : "Desativar som"}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
