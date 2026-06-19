import type { Metadata } from "next";

import {
  getMyOrganizations,
  getActiveOrganization,
} from "@/lib/auth/org";
import { setActiveOrganizationAction } from "@/app/dashboard/organizations/actions";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/schema/auth.schema";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CreateOrgForm } from "@/components/dashboard/CreateOrgForm";

export const metadata: Metadata = { title: "Minhas organizações · Jogos CSCJ" };
export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const [orgs, active] = await Promise.all([
    getMyOrganizations(),
    getActiveOrganization(),
  ]);
  const activeId = active?.org.id;

  return (
    <>
      <PageHeader
        title="Minhas organizações"
        description="Alterne entre organizações ou crie uma nova."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organizações ({orgs.length})</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-slate-100">
            {orgs.map((m) => {
              const isActive = m.org.id === activeId;
              return (
                <li key={m.org.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {m.org.name}
                      {isActive && (
                        <span className="ml-2 align-middle">
                          <Badge variant="success">Ativa</Badge>
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ORGANIZATION_TYPE_LABELS[m.org.organization_type]} ·{" "}
                      {ROLE_LABELS[m.role]}
                    </p>
                  </div>

                  {!isActive && (
                    <form action={setActiveOrganizationAction}>
                      <input type="hidden" name="orgId" value={m.org.id} />
                      <Button type="submit" variant="secondary" size="sm">
                        Tornar ativa
                      </Button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nova organização</CardTitle>
            <CardDescription>
              Você entra como administrador da organização criada.
            </CardDescription>
          </CardHeader>
          <CreateOrgForm />
        </Card>
      </div>
    </>
  );
}
