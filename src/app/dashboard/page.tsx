import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";
import { ROLE_LABELS, type MemberRole } from "@/lib/auth/permissions";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/schema/auth.schema";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

type Membership = {
  role: MemberRole;
  organizations: {
    name: string;
    organization_type: keyof typeof ORGANIZATION_TYPE_LABELS;
  } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Salvaguarda (o middleware já protege a rota).
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("role, organizations(name, organization_type)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const list = (memberships ?? []) as unknown as Membership[];
  const nome = profile?.full_name ?? "—";

  return (
    <PageShell>
      <PageHeader
        title={`Olá, ${nome.split(" ")[0]}`}
        description="Painel da sua organização."
        action={
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              Sair
            </Button>
          </form>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-950">Seu perfil</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Nome</dt>
              <dd className="text-slate-900">{nome}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">E-mail</dt>
              <dd className="text-slate-900">{profile?.email ?? user.email}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-950">Suas organizações</h3>
          {list.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              Você ainda não pertence a nenhuma organização.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {list.map((m, i) => (
                <li key={i} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {m.organizations?.name ?? "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {m.organizations
                        ? ORGANIZATION_TYPE_LABELS[m.organizations.organization_type]
                        : ""}
                    </p>
                  </div>
                  <Badge variant={m.role === "org_admin" ? "primary" : "neutral"}>
                    {ROLE_LABELS[m.role]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <EmptyState
          title="Em breve: jogos"
          description="O módulo de jogos, turmas e resultados entra na próxima fase. Cada jogo já nascerá vinculado a esta organização."
        />
      </div>
    </PageShell>
  );
}
