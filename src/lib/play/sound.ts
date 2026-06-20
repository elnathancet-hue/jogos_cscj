// src/lib/play/sound.ts
//
// Efeitos sonoros gerados em tempo real (WebAudio) — sem arquivos de áudio.
// Tudo client-side; chamado a partir de gestos do usuário.

let ctx: AudioContext | null = null;
let muted = false;
let loaded = false;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Deve ser chamado num gesto do usuário (ex.: botão "Começar"). */
export function initSound() {
  if (typeof window === "undefined") return;
  if (!loaded) {
    muted = window.localStorage.getItem("play_muted") === "1";
    loaded = true;
  }
  ensureCtx();
}

export function isMuted() {
  if (typeof window !== "undefined" && !loaded) {
    muted = window.localStorage.getItem("play_muted") === "1";
    loaded = true;
  }
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem("play_muted", value ? "1" : "0");
  }
  if (!value) ensureCtx();
}

function beep(
  freqs: number[],
  step = 0.09,
  type: OscillatorType = "sine",
  vol = 0.18,
) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime;
  freqs.forEach((f, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = f;
    const s = t0 + i * step;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.linearRampToValueAtTime(vol, s + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, s + step * 0.95);
    osc.connect(g).connect(c.destination);
    osc.start(s);
    osc.stop(s + step);
  });
}

export const playClick = () => beep([320], 0.05, "square", 0.07);
export const playFlip = () => beep([420], 0.06, "sine", 0.1);
export const playCorrect = () => beep([660, 880], 0.08, "sine", 0.2);
export const playWrong = () => beep([200, 120], 0.13, "square", 0.14);
export const playCombo = (n: number) =>
  beep([660 + n * 80, 880 + n * 80], 0.07, "triangle", 0.18);
export const playWin = () => beep([523, 659, 784, 1047], 0.12, "triangle", 0.2);
