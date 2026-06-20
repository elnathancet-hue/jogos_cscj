import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { hasPermission, type MemberRole } from "@/lib/auth/permissions";
import {
  GAME_STATUS_LABELS,
  type GameStatus,
} from "@/lib/schema/game.schema";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GameForm } from "@/components/dashboard/GameForm";
import { GameStatusActions } from "@/components/dashboard/GameStatusActions";
import { GameShare } from "@/components/dashboard/GameShare";
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

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: game } = await supabase
    .from("games")
    .select("id, organization_id, created_by, title, description, status, cover_image_url, settings")
    .eq("id", id)
    .maybeSingle();

  if (!game) notFound();

  // Papel do usuário NA organização do jogo (não na ativa).
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

  const canEdit =
    role === "org_admin" ||
    role === "collaborator" ||
    (isOwner && hasPermission(role, "games.update"));
  const canPublish = canEdit && hasPermission(role, "games.publish");
  const canDelete =
    role === "org_admin" || (isOwner && hasPermission(role, "games.delete"));
  const canViewResults = hasPermission(role, "results.view");

  return (
    <>
      <PageHeader
        title={game.title}
        description="Detalhes e configurações do jogo."
        action={<Badge variant={STATUS_VARIANT[status]}>{GAME_STATUS_LABELS[status]}</Badge>}
      />

      <div className="mb-4">
        <Link href="/dashboard/games" className="text-sm text-blue-700 hover:underline">
          ← Voltar para jogos
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
              <h3 className="text-base font-semibold text-slate-950">{game.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                {game.description || "Sem descrição."}
              </p>
              <p className="mt-4 text-xs text-slate-400">
                Você não tem permissão para editar este jogo.
              </p>
            </>
          )}
        </Card>

        <div className="space-y-6">
          {(canPublish || canDelete) && (
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <GameStatusActions
                gameId={game.id}
                status={status}
                canPublish={canPublish}
                canDelete={canDelete}
              />
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Sessões e resultados</CardTitle>
            </CardHeader>
            <div className="space-y-2 text-sm">
              {canViewResults && (
                <Link
                  href={`/dashboard/games/${game.id}/results`}
                  className="block text-blue-700 hover:underline"
                >
                  Ver resultados →
                </Link>
              )}
              {status === "published" ? (
                <Link
                  href={`/play/${game.id}`}
                  className="block text-blue-700 hover:underline"
                  target="_blank"
                >
                  Abrir página pública de jogar ↗
                </Link>
              ) : (
                <p className="text-slate-500">Publique o jogo para gerar o link público.</p>
              )}
            </div>
          </Card>

          {status === "published" && (
            <Card>
              <CardHeader>
                <CardTitle>Expor o jogo (Modo TV)</CardTitle>
              </CardHeader>
              <GameShare gameId={game.id} />
            </Card>
          )}
        </div>
      </div>

      {canEdit && (() => {
        const gameType = getGameType(game.settings) ?? "quiz";
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Conteúdo do jogo — {GAME_TYPE_LABELS[gameType]}</CardTitle>
            </CardHeader>
            {gameType === "quiz" && (
              <QuizEditor
                gameId={game.id}
                initialQuestions={readQuizQuestions(game.settings)}
                initialTimed={(game.settings as { timed?: boolean })?.timed}
              />
            )}
            {gameType === "truefalse" && (
              <TrueFalseEditor gameId={game.id} initial={readTrueFalse(game.settings)} />
            )}
            {gameType === "memory" && (
              <MemoryEditor gameId={game.id} initialPairs={readMemoryPairs(game.settings)} />
            )}
            {gameType === "ordering" && (() => {
              const o = readOrdering(game.settings);
              return (
                <OrderingEditor
                  gameId={game.id}
                  initialPrompt={o?.prompt ?? ""}
                  initialItems={o?.items ?? []}
                />
              );
            })()}
            {gameType === "wordsearch" && (
              <WordsearchEditor gameId={game.id} initialWords={readWordsearchWords(game.settings)} />
            )}
            {gameType === "crossword" && (
              <CrosswordEditor
                gameId={game.id}
                initialEntries={readCrosswordEntries(game.settings)}
              />
            )}
            {gameType === "hotspot" && (() => {
              const hs = readHotspot(game.settings);
              return (
                <HotspotEditor
                  gameId={game.id}
                  initialImageUrl={hs?.imageUrl ?? ""}
                  initialTargets={hs?.targets ?? []}
                />
              );
            })()}
          </Card>
        );
      })()}
    </>
  );
}
