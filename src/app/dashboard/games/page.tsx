import Link from "next/link";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getActiveOrganization } from "@/lib/auth/org";
import { hasPermission } from "@/lib/auth/permissions";
import {
  GAME_STATUS_LABELS,
  type GameStatus,
} from "@/lib/schema/game.schema";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { BadgeVariant } from "@/design-system/variants";

export const metadata: Metadata = { title: "Jogos · Jogos CSCJ" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<GameStatus, BadgeVariant> = {
  draft: "neutral",
  published: "success",
  archived: "warning",
};

export default async function GamesPage() {
  const active = await getActiveOrganization();
  if (!active) {
    return (
      <>
        <PageHeader title="Jogos" />
        <EmptyState
          title="Nenhuma organização"
          description="Selecione ou crie uma organização para gerenciar jogos."
        />
      </>
    );
  }

  const canCreate = hasPermission(active.role, "games.create");
  const supabase = await createClient();
  const { data: games } = await supabase
    .from("games")
    .select("id, title, description, status")
    .eq("organization_id", active.org.id)
    .order("created_at", { ascending: false });

  const list = (games ?? []) as {
    id: string;
    title: string;
    description: string | null;
    status: GameStatus;
  }[];

  return (
    <>
      <PageHeader
        title="Jogos"
        description={`Jogos de ${active.org.name}.`}
        action={
          canCreate ? (
            <Link
              href="/dashboard/games/new"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Novo jogo
            </Link>
          ) : undefined
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum jogo ainda"
          description={
            canCreate
              ? "Crie o primeiro jogo da organização."
              : "Quando houver jogos, eles aparecem aqui."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((game) => (
            <Link key={game.id} href={`/dashboard/games/${game.id}`} className="block">
              <Card className="h-full transition-colors hover:border-blue-300">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-950">{game.title}</h3>
                  <Badge variant={STATUS_VARIANT[game.status]}>
                    {GAME_STATUS_LABELS[game.status]}
                  </Badge>
                </div>
                {game.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {game.description}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
