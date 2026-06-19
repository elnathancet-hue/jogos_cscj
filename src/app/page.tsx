import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/design-system/variants";

export const dynamic = "force-dynamic";

type SchemaState = "ready" | "missing" | "unconfigured" | "error";

async function checkSchema(): Promise<{ state: SchemaState; detail: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { state: "unconfigured", detail: "NEXT_PUBLIC_SUPABASE_URL não definida." };
  }

  try {
    const supabase = await createClient();
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

const STATUS: Record<SchemaState, { label: string; variant: BadgeVariant }> = {
  ready: { label: "Banco conectado e migrado", variant: "success" },
  missing: { label: "Conectado — falta rodar as migrations", variant: "warning" },
  unconfigured: { label: "Supabase não configurado", variant: "neutral" },
  error: { label: "Erro ao conectar", variant: "danger" },
};

export default async function Home() {
  const { state, detail } = await checkSchema();
  const status = STATUS[state];

  return (
    <PageShell>
      <PageHeader
        title="Jogos CSCJ"
        description="Plataforma SaaS de jogos educativos e culturais — escolas, museus, empresas e projetos culturais."
        action={
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-blue-700 hover:underline">
              Entrar
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Criar conta
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-950">Status do banco</h3>
          <p className="mt-1 text-sm text-slate-600">{detail}</p>
          <div className="mt-4">
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-950">Próximos passos</h3>
          <ol className="mt-2 space-y-2 text-sm text-slate-600">
            <li>1. Rodar <code className="text-blue-700">supabase/aplicar_tudo.sql</code> no SQL Editor.</li>
            <li>2. Autenticação + telas (perfil, organização, equipe).</li>
            <li>3. Módulo de jogos, turmas e resultados.</li>
          </ol>
        </Card>
      </div>
    </PageShell>
  );
}
