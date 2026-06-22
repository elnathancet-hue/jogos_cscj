import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, type MemberRole } from "@/lib/auth/permissions";
import { setGameStatusAction, deleteGameAction } from "@/app/dashboard/games/actions";
import { GAME_STATUS_LABELS, type GameStatus } from "@/lib/schema/game.schema";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { DangerZone } from "@/components/ui/DangerZone";
import { PublicLinkBox } from "@/components/ui/PublicLinkBox";
import { GameForm } from "@/components/dashboard/GameForm";
import { GameStatusActions } from "@/components/dashboard/GameStatusActions";
import { QuizEditor } from "@/components/dashboard/QuizEditor";
import { MemoryEditor } from "@/components/dashboard/MemoryEditor";
import { CrosswordEditor } from "@/components/dashboard/CrosswordEditor";
import { TrueFalseEditor } from "@/components/dashboard/TrueFalseEditor";
import { OrderingEditor } from "@/components/dashboard/OrderingEditor";
import { WordsearchEditor } from "@/components/dashboard/WordsearchEditor";
import { HotspotEditor } from "@/components/dashboard/HotspotEditor";
import { readQuizQuestions } from "@/lib/games/quiz";
import { readMemoryPairs } from "@/lib/games/memory";
import { readCrosswordEntries } from "@/lib/games/crossword";
import { readTrueFalse } from "@/lib/games/truefalse";
import { readOrdering } from "@/lib/games/ordering";
import { readWordsearchWords } from "@/lib/games/wordsearch";
import { readHotspot } from "@/lib/games/hotspot";
import { getGameType, GAME_TYPE_LABELS } from "@/lib/games/types";
import type { BadgeVariant } from "@/design-system/variants";

export const metadata: Metadata = { title: "Jogo · Jogos CSCJ" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<GameStatus, BadgeVariant> = {
  draft: "neutral",
  published: "success",
  archived: "warning",
};

type GameRow = {
  id: string;
  organization_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  status: GameStatus;
  cover_image_url: string | null;
  settings: unknown;
};

function renderEditor(game: GameRow) {
  const gameType = getGameType(game.settings) ?? "quiz";
  if (gameType === "quiz")
    return <QuizEditor gameId={game.id} initialQuestions={readQuizQuestions(game.settings)} initialTimed={(game.settings as { timed?: boolean })?.timed} />;
  if (gameType === "truefalse")
    return <TrueFalseEditor gameId={game.id} initial={readTrueFalse(game.settings)} />;
  if (gameType === "memory")
    return <MemoryEditor gameId={game.id} initialPairs={readMemoryPairs(game.settings)} />;
  if (gameType === "ordering") {
    const o = readOrdering(game.settings);
    return <OrderingEditor gameId={game.id} initialPrompt={o?.prompt ?? ""} initialItems={o?.items ?? []} />;
  }
  if (gameType === "wordsearch")
    return <WordsearchEditor gameId={game.id} initialWords={readWordsearchWords(game.settings)} />;
  if (gameType === "crossword")
    return <CrosswordEditor gameId={game.id} initialEntries={readCrosswordEntries(game.settings)} />;
  const hs = readHotspot(game.settings);
  return <HotspotEditor gameId={game.id} initialImageUrl={hs?.imageUrl ?? ""} initialTargets={hs?.targets ?? []} />;
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: game } = await supabase
    .from("games")
    .select("id, organization_id, created_by, title, description, status, cover_image_url, settings")
    .eq("id", id)
    .maybeSingle();
  if (!game) notFound();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", game.organization_id)
    .eq("user_id", user?.id ?? "")
    .eq("status", "active")
    .maybeSingle();

  const role = membership?.role as MemberRole | undefined;
  const status = game.status as GameStatus;
  const isOwner = game.created_by === user?.id;
  const type = getGameType(game.settings) ?? "quiz";

  const canEdit =
    role === "org_admin" || role === "collaborator" || (isOwner && hasPermission(role, "games.update"));
  const canPublish = canEdit && hasPermission(role, "games.publish");
  const canDelete = role === "org_admin" || (isOwner && hasPermission(role, "games.delete"));
  const canViewResults = hasPermission(role, "results.view");
  const showDanger = (canEdit && status !== "archived") || canDelete;

  return (
    <>
      <PageHeader
        title={game.title}
        description="Detalhes e configurações do jogo."
        action={<Badge variant={STATUS_VARIANT[status]}>{GAME_STATUS_LABELS[status]}</Badge>}
      />

      <div className="mb-4">
        <LinkButton href="/dashboard/games" variant="ghost" size="sm">
          ← Voltar para jogos
        </LinkButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna esquerda */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações básicas</CardTitle>
            </CardHeader>
            {canEdit ? (
              <GameForm
                mode="edit"
                defaults={{
                  gameId: game.id,
                  title: game.title,
                  description: game.description ?? "",
                  coverImageUrl: game.cover_image_url ?? "",
                }}
              />
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm text-slate-600">
                  {game.description || "Sem descrição."}
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Você não tem permissão para editar este jogo.
                </p>
              </>
            )}
          </Card>

          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo do jogo — {GAME_TYPE_LABELS[type]}</CardTitle>
              </CardHeader>
              {renderEditor(game as GameRow)}
            </Card>
          )}
        </div>

        {/* Coluna direita */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status e publicação</CardTitle>
            </CardHeader>
            <div className="mb-3">
              <Badge variant={STATUS_VARIANT[status]}>{GAME_STATUS_LABELS[status]}</Badge>
            </div>
            {canPublish || status === "published" || status === "archived" ? (
              <GameStatusActions gameId={game.id} status={status} canPublish={canPublish} />
            ) : (
              <p className="text-sm text-slate-500">Sem ações de publicação disponíveis.</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessões e resultados</CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              {canViewResults && (
                <LinkButton href={`/dashboard/games/${game.id}/results`} variant="secondary" size="sm">
                  Ver resultados
                </LinkButton>
              )}
              {status === "published" ? (
                <LinkButton href={`/play/${game.id}`} target="_blank" rel="noreferrer" variant="ghost" size="sm">
                  Abrir página pública
                </LinkButton>
              ) : (
                <p className="text-sm text-slate-500">Publique o jogo para gerar o link público.</p>
              )}
            </div>
          </Card>

          {status === "published" && (
            <Card>
              <CardHeader>
                <CardTitle>Expor o jogo (Modo TV)</CardTitle>
              </CardHeader>
              <PublicLinkBox gameId={game.id} />
            </Card>
          )}

          {showDanger && (
            <DangerZone description="Arquivar tira o jogo do ar. Excluir é permanente.">
              {canEdit && status !== "archived" && (
                <form action={setGameStatusAction}>
                  <input type="hidden" name="gameId" value={game.id} />
                  <input type="hidden" name="status" value="archived" />
                  <Button type="submit" variant="ghost" size="sm">
                    Arquivar
                  </Button>
                </form>
              )}
              {canDelete && (
                <form action={deleteGameAction}>
                  <input type="hidden" name="gameId" value={game.id} />
                  <Button type="submit" variant="danger" size="sm">
                    Excluir jogo
                  </Button>
                </form>
              )}
            </DangerZone>
          )}
        </div>
      </div>
    </>
  );
}
