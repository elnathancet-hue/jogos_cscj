import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SchemaState = "ready" | "missing" | "unconfigured" | "error";

async function checkSchema(): Promise<{ state: SchemaState; detail: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { state: "unconfigured", detail: "NEXT_PUBLIC_SUPABASE_URL não definida." };
  }

  try {
    const supabase = await createClient();
    // `roles` is reference data; if the query errors with a missing-relation
    // code, the migrations haven't been applied yet.
    const { error } = await supabase.from("roles").select("key").limit(1);

    if (!error) return { state: "ready", detail: "Tabelas encontradas." };
    if (error.code === "PGRST205" || /does not exist/i.test(error.message)) {
      return { state: "missing", detail: "Conectado, mas as tabelas ainda não foram criadas." };
    }
    return { state: "error", detail: error.message };
  } catch (e) {
    return { state: "error", detail: e instanceof Error ? e.message : String(e) };
  }
}

const BADGE: Record<SchemaState, { label: string; cls: string }> = {
  ready: { label: "✅ Banco conectado e migrado", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  missing: { label: "🟡 Conectado — falta rodar as migrations", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  unconfigured: { label: "⚪ Supabase não configurado", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  error: { label: "🔴 Erro ao conectar", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
};

export default async function Home() {
  const { state, detail } = await checkSchema();
  const badge = BADGE[state];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-brand">Jogos CSCJ</p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Plataforma de jogos <span className="text-brand">educativos e culturais</span>
        </h1>
        <p className="text-slate-400">
          Base SaaS multi-tenant — escolas, museus, empresas e projetos culturais.
        </p>
      </header>

      <div className={`rounded-xl border p-4 ${badge.cls}`}>
        <p className="font-semibold">{badge.label}</p>
        <p className="mt-1 text-sm opacity-80">{detail}</p>
      </div>

      <ol className="space-y-2 text-sm text-slate-400">
        <li>1. Rodar <code className="text-brand">supabase/aplicar_tudo.sql</code> no SQL Editor.</li>
        <li>2. Construir auth + telas (perfil, organização, equipe).</li>
        <li>3. Módulo de jogos, turmas e resultados.</li>
      </ol>
    </main>
  );
}
