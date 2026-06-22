import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveOrganization } from "@/lib/auth/org";
import { ROLE_LABELS, hasPermission } from "@/lib/auth/permissions";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/schema/auth.schema";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

async function count(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  orgId: string,
) {
  const { count: n } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);
  return n ?? 0;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const [{ data: profile }, active] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    getActiveOrganization(),
  ]);

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "👋";

  if (!active) {
    return (
      <EmptyState
        title="Você ainda não tem uma organização"
        description="Crie uma organização para começar a montar seus jogos."
        action={
          <Link
            href="/dashboard/organizations"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            Criar organização
          </Link>
        }
      />
    );
  }

  const orgId = active.org.id;
  const [games, members, classes, results] = await Promise.all([
    count(supabase, "games", orgId),
    count(supabase, "organization_members", orgId),
    count(supabase, "classes", orgId),
    count(supabase, "game_results", orgId),
  ]);

  const canCreate = hasPermission(active.role, "games.create");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-sm">
        <p className="text-sm text-white/80">Olá, {firstName} 👋</p>
        <h1 className="mt-1 text-2xl font-bold">{active.org.name}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-white/90">
          <span className="rounded-full bg-white/20 px-2 py-0.5">{ROLE_LABELS[active.role]}</span>
          <span>{ORGANIZATION_TYPE_LABELS[active.org.organization_type]}</span>
        </div>
      </div>

      {/* Números */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Jogos" value={games} icon="🎮" href="/dashboard/games" accent="bg-blue-50 text-blue-700" />
        <StatCard label="Membros" value={members} icon="👥" href="/dashboard/team" accent="bg-emerald-50 text-emerald-700" />
        <StatCard label="Turmas" value={classes} icon="🎒" href="/dashboard/classes" accent="bg-amber-50 text-amber-700" />
        <StatCard label="Sessões jogadas" value={results} icon="📊" accent="bg-violet-50 text-violet-700" />
      </div>

      {/* Ações rápidas */}
      <div className="grid gap-4 sm:grid-cols-3">
        {canCreate && (
          <Card className="flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">Criar um jogo</h3>
              <p className="mt-1 text-sm text-slate-600">Quiz, memória, palavra-cruzada e mais.</p>
            </div>
            <Link href="/dashboard/games/new" className="mt-4 text-sm font-medium text-blue-700 hover:underline">
              Novo jogo →
            </Link>
          </Card>
        )}
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-950">Modo TV</h3>
            <p className="mt-1 text-sm text-slate-600">Exponha os jogos numa tela de evento/museu.</p>
          </div>
          <Link href={`/kiosk/org/${orgId}`} target="_blank" className="mt-4 text-sm font-medium text-blue-700 hover:underline">
            Abrir Modo TV ↗
          </Link>
        </Card>
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-950">Identidade</h3>
            <p className="mt-1 text-sm text-slate-600">Cor, logo e tema da experiência de jogar.</p>
          </div>
          <Link href="/dashboard/organization" className="mt-4 text-sm font-medium text-blue-700 hover:underline">
            Personalizar →
          </Link>
        </Card>
      </div>
    </div>
  );
}
