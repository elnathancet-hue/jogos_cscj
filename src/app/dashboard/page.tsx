import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveOrganization } from "@/lib/auth/org";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/schema/auth.schema";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const active = await getActiveOrganization();
  const nome = profile?.full_name ?? "—";

  return (
    <>
      <PageHeader
        title={`Olá, ${nome.split(" ")[0]}`}
        description="Painel da sua organização."
      />

      {active ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <h3 className="text-base font-semibold text-slate-950">Organização</h3>
            <p className="mt-2 text-sm text-slate-900">{active.org.name}</p>
            <p className="text-xs text-slate-500">
              {ORGANIZATION_TYPE_LABELS[active.org.organization_type]}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant={active.role === "org_admin" ? "primary" : "neutral"}>
                {ROLE_LABELS[active.role]}
              </Badge>
              <Link
                href="/dashboard/organization"
                className="text-sm text-blue-700 hover:underline"
              >
                Configurar
              </Link>
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-slate-950">Equipe</h3>
            <p className="mt-2 text-sm text-slate-600">
              Convide pessoas e gerencie papéis da organização.
            </p>
            <div className="mt-4">
              <Link href="/dashboard/team" className="text-sm text-blue-700 hover:underline">
                Gerenciar equipe →
              </Link>
            </div>
          </Card>
        </div>
      ) : (
        <EmptyState
          title="Você ainda não tem uma organização"
          description="Sua organização deveria ter sido criada no cadastro. Se acabou de aplicar o SQL, saia e entre novamente."
        />
      )}

      {active && (
        <div className="mt-6">
          <Card>
            <h3 className="text-base font-semibold text-slate-950">Jogos</h3>
            <p className="mt-2 text-sm text-slate-600">
              Crie e gerencie os jogos da organização.
            </p>
            <div className="mt-4">
              <Link href="/dashboard/games" className="text-sm text-blue-700 hover:underline">
                Ir para jogos →
              </Link>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
