import type { Metadata } from "next";

import { getActiveOrganization } from "@/lib/auth/org";
import type { OrgTheme } from "@/lib/play/theme";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrganizationForm } from "@/components/dashboard/OrganizationForm";

export const metadata: Metadata = { title: "Organização · Jogos CSCJ" };
export const dynamic = "force-dynamic";

export default async function OrganizationPage() {
  const active = await getActiveOrganization();

  if (!active) {
    return (
      <>
        <PageHeader title="Organização" />
        <EmptyState
          title="Nenhuma organização"
          description="Você ainda não pertence a uma organização."
        />
      </>
    );
  }

  const { org, role } = active;

  return (
    <>
      <PageHeader
        title="Organização"
        description="Identidade e configurações da sua instituição."
      />
      <Card className="max-w-xl">
        <OrganizationForm
          canEdit={role === "org_admin"}
          defaults={{
            id: org.id,
            name: org.name,
            slug: org.slug,
            organizationType: org.organization_type,
            primaryColor: org.primary_color ?? "",
            logoUrl: org.logo_url ?? "",
            theme: (org.theme as OrgTheme | null) ?? null,
          }}
        />
      </Card>
    </>
  );
}
