import type { Metadata } from "next";

import { getActiveOrganization } from "@/lib/auth/org";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameForm } from "@/components/dashboard/GameForm";

export const metadata: Metadata = { title: "Novo jogo · Jogos CSCJ" };
export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const active = await getActiveOrganization();

  if (!active || !hasPermission(active.role, "games.create")) {
    return (
      <>
        <PageHeader title="Novo jogo" />
        <EmptyState
          title="Sem permissão"
          description="Você não tem permissão para criar jogos nesta organização."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Novo jogo"
        description={`Será criado em ${active.org.name}.`}
      />
      <Card className="max-w-xl">
        <GameForm mode="create" />
      </Card>
    </>
  );
}
