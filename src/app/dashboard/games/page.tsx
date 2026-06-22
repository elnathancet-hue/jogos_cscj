import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getActiveOrganization } from "@/lib/auth/org";
import { hasPermission } from "@/lib/auth/permissions";
import { getGameType, GAME_TYPE_LABELS } from "@/lib/games/types";
import type { GameStatus } from "@/lib/schema/game.schema";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { GamesBrowser } from "@/components/dashboard/GamesBrowser";
import type { GameCardData } from "@/components/dashboard/GameCard";

export const metadata: Metadata = { title: "Jogos · Jogos CSCJ" };
export const dynamic = "force-dynamic";

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

  const [{ data: games }, { data: rs }] = await Promise.all([
    supabase
      .from("games")
      .select("id, title, description, status, settings, updated_at")
      .eq("organization_id", active.org.id)
      .order("created_at", { ascending: false }),
    supabase.from("game_results").select("game_id").eq("organization_id", active.org.id),
  ]);

  const sessionsByGame = new Map<string, number>();
  (rs ?? []).forEach((r) =>
    sessionsByGame.set(r.game_id, (sessionsByGame.get(r.game_id) ?? 0) + 1),
  );

  const list: GameCardData[] = (games ?? []).map((g) => {
    const type = getGameType(g.settings);
    const status = g.status as GameStatus;
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      status,
      typeLabel: type ? GAME_TYPE_LABELS[type] : "—",
      sessions: sessionsByGame.get(g.id) ?? 0,
      updatedAt: g.updated_at,
      published: status === "published",
    };
  });

  const hasPublished = list.some((g) => g.published);

  return (
    <>
      <PageHeader
        title="Jogos"
        description="Crie, edite e publique os jogos da organização."
        action={
          <div className="flex items-center gap-2">
            {hasPublished && (
              <LinkButton href={`/o/${active.org.id}`} target="_blank" rel="noreferrer" variant="ghost">
                Catálogo
              </LinkButton>
            )}
            {hasPublished && (
              <LinkButton
                href={`/kiosk/org/${active.org.id}`}
                target="_blank"
                rel="noreferrer"
                variant="secondary"
              >
                Modo TV
              </LinkButton>
            )}
            {canCreate && (
              <LinkButton href="/dashboard/games/new" variant="primary">
                Novo jogo
              </LinkButton>
            )}
          </div>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum jogo ainda"
          description={canCreate ? "Crie o primeiro jogo da organização." : "Quando houver jogos, eles aparecem aqui."}
          action={canCreate ? <LinkButton href="/dashboard/games/new" variant="primary">Novo jogo</LinkButton> : undefined}
        />
      ) : (
        <GamesBrowser games={list} />
      )}
    </>
  );
}
