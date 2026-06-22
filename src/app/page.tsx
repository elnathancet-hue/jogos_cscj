import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jogos CSCJ — jogos educativos e culturais",
  description:
    "Crie quizzes, memória, palavra-cruzada e mais. Publique por link ou Modo TV para escolas, museus, empresas e projetos culturais.",
};

const GAME_TYPES = [
  { label: "Quiz", emoji: "❓" },
  { label: "Verdadeiro ou Falso", emoji: "⚖️" },
  { label: "Memória", emoji: "🧠" },
  { label: "Ordenar", emoji: "↕️" },
  { label: "Caça-palavras", emoji: "🔤" },
  { label: "Palavra-cruzada", emoji: "🧩" },
  { label: "Hotspot na imagem", emoji: "🎯" },
];

const AUDIENCES = [
  { title: "Escolas", desc: "Engaje turmas com jogos por matéria e acompanhe resultados por turma." },
  { title: "Museus", desc: "Experiências em totem/TV para visitantes jogarem na hora, sem login." },
  { title: "Empresas", desc: "Treinamentos e dinâmicas gamificadas para equipes." },
  { title: "Projetos culturais", desc: "Atividades interativas em eventos e exposições." },
];

const TAGS: { label: string; pos: string }[] = [
  { label: "Quiz", pos: "left-0 top-4" },
  { label: "Memória", pos: "right-0 top-1" },
  { label: "Modo TV", pos: "right-2 top-1/3" },
  { label: "Ranking ao vivo", pos: "left-2 bottom-12" },
  { label: "Turmas", pos: "right-4 bottom-2" },
  { label: "Palavra-cruzada", pos: "left-6 top-1/2" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-slate-950">
            Jogos <span className="text-violet-600">CSCJ</span>
          </span>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-950">
              Entrar
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex h-10 items-center justify-center rounded-full bg-violet-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Aprender brincando é o novo{" "}
            <span className="text-violet-600">jeito de engajar</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-slate-600">
            Crie jogos educativos e culturais — quiz, memória, palavra-cruzada e mais — e publique
            por link ou Modo TV. Para escolas, museus, empresas e projetos culturais.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/register"
              className="inline-flex h-12 items-center justify-center rounded-full bg-violet-600 px-7 text-base font-semibold text-white transition-colors hover:bg-violet-700"
            >
              Começar agora →
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 px-7 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        {/* Visual com tags flutuantes */}
        <div className="relative">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 shadow-xl">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <div className="mx-auto mb-3 w-fit rounded-full bg-white/25 px-3 py-1 text-xs font-semibold text-white">
                Pergunta 4 / 10
              </div>
              <div className="rounded-xl border border-white/30 p-4 text-center text-base font-bold text-white">
                Qual país sediará a Copa de 2026?
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["Brasil", "EUA, México e Canadá", "Catar", "Espanha"].map((o, i) => (
                  <div
                    key={o}
                    className={`rounded-xl px-3 py-2 text-sm font-medium ${
                      i === 1 ? "bg-emerald-400 text-emerald-950" : "bg-white/20 text-white"
                    }`}
                  >
                    {o}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {TAGS.map((t) => (
            <span
              key={t.label}
              className={`absolute ${t.pos} rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-md ring-1 ring-violet-100`}
            >
              {t.label}
            </span>
          ))}
        </div>
      </section>

      {/* Tipos de jogo */}
      <section className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto w-full max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold text-slate-950">Vários tipos de jogo</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
            Monte o conteúdo, publique e pronto — funciona no celular e na TV.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {GAME_TYPES.map((g) => (
              <div
                key={g.label}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <span className="text-2xl">{g.emoji}</span>
                <span className="text-sm font-medium text-slate-800">{g.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Públicos */}
      <section className="py-16">
        <div className="mx-auto w-full max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold text-slate-950">Para todo tipo de organização</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-slate-950">{a.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modo TV / Ranking */}
      <section className="bg-gradient-to-br from-violet-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto w-full max-w-4xl px-6 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Modo TV com ranking ao vivo</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/90">
            Coloque os jogos numa tela de evento ou museu. Quem passa toca ou escaneia o QR e joga.
            O ranking da turma atualiza na hora.
          </p>
          <Link
            href="/auth/register"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-base font-semibold text-violet-700 transition-colors hover:bg-white/90"
          >
            Quero transformar minha organização →
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        Jogos CSCJ · jogos educativos e culturais
      </footer>
    </main>
  );
}
