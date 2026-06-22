import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveOrganization } from "@/lib/auth/org";
import { ROLE_LABELS, hasPermission } from "@/lib/auth/permissions";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/schema/auth.schema";
import { MetricCard } from "@/components/ui/MetricCard";
import { ActionCard } from "@/components/ui/ActionCard";
import { LinkButton } from "@/components/ui/LinkButton";
import { Badge } from "@/components/ui/Badge";
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
          <LinkButton href="/dashboard/organizations" variant="primary">
            Criar organização
          </LinkButton>
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
      {/* Header da organização */}
      <section className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-sm">
        <p className="text-sm text-white/80">Olá, {firstName} 👋</p>
        <h1 className="mt-1 text-2xl font-bold">{active.org.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="neutral">{ROLE_LABELS[active.role]}</Badge>
          <span className="text-white/85">{ORGANIZATION_TYPE_LABELS[active.org.organization_type]}</span>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-white/90">
          Gerencie jogos, turmas, equipe e resultados em um só lugar.
        </p>
      </section>

      {/* Métricas principais */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Métricas
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Jogos" value={games} href="/dashboard/games" />
          <MetricCard label="Membros" value={members} href="/dashboard/team" />
          <MetricCard label="Turmas" value={classes} href="/dashboard/classes" />
          <MetricCard label="Sessões jogadas" value={results} />
        </div>
      </section>

      {/* Ações rápidas */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Ações rápidas
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {canCreate && (
            <ActionCard
              title="Criar um jogo"
              description="Quiz, memória, palavra-cruzada, hotspot e mais."
              action={
                <LinkButton href="/dashboard/games/new" variant="primary" size="sm">
                  Novo jogo
                </LinkButton>
              }
            />
          )}
          <ActionCard
            title="Abrir Modo TV"
            description="Exponha os jogos numa tela de evento ou museu."
            action={
              <LinkButton href={`/kiosk/org/${orgId}`} target="_blank" rel="noreferrer" variant="secondary" size="sm">
                Abrir Modo TV ↗
              </LinkButton>
            }
          />
          <ActionCard
            title="Personalizar identidade"
            description="Cor, logo e tema da experiência de jogar."
            action={
              <LinkButton href="/dashboard/organization" variant="secondary" size="sm">
                Personalizar
              </LinkButton>
            }
          />
        </div>
      </section>
    </div>
  );
}
