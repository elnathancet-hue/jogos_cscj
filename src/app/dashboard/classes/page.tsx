import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getActiveOrganization } from "@/lib/auth/org";
import { deleteClassAction } from "@/app/dashboard/classes/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreateClassForm } from "@/components/dashboard/CreateClassForm";

export const metadata: Metadata = { title: "Turmas · Jogos CSCJ" };
export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const active = await getActiveOrganization();
  if (!active) {
    return (
      <>
        <PageHeader title="Turmas e públicos" />
        <EmptyState
          title="Nenhuma organização"
          description="Selecione ou crie uma organização para gerenciar turmas."
        />
      </>
    );
  }

  const canManage = active.role === "org_admin" || active.role === "creator";
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, description, code")
    .eq("organization_id", active.org.id)
    .order("created_at", { ascending: false });

  const list = (classes ?? []) as {
    id: string;
    name: string;
    description: string | null;
    code: string;
  }[];

  return (
    <>
      <PageHeader
        title="Turmas e públicos"
        description="Grupos de jogadores. O código é usado na entrada identificada."
      />

      <div className="space-y-6">
        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle>Nova turma / público</CardTitle>
              <CardDescription>Geramos um código de entrada automaticamente.</CardDescription>
            </CardHeader>
            <CreateClassForm />
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Turmas ({list.length})</CardTitle>
          </CardHeader>
          {list.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma turma cadastrada.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {list.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
                    {c.description && (
                      <p className="truncate text-xs text-slate-500">{c.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">Código: {c.code}</Badge>
                    {canManage && (
                      <form action={deleteClassAction}>
                        <input type="hidden" name="classId" value={c.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Excluir
                        </Button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
