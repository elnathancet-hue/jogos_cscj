"use client";

import { setGameStatusAction, deleteGameAction } from "@/app/dashboard/games/actions";
import type { GameStatus } from "@/lib/schema/game.schema";
import { Button } from "@/components/ui/Button";

type GameStatusActionsProps = {
  gameId: string;
  status: GameStatus;
  canPublish: boolean;
  canDelete: boolean;
};

function StatusButton({
  gameId,
  status,
  label,
  variant = "secondary",
}: {
  gameId: string;
  status: GameStatus;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <form action={setGameStatusAction}>
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant={variant} size="sm">
        {label}
      </Button>
    </form>
  );
}

export function GameStatusActions({
  gameId,
  status,
  canPublish,
  canDelete,
}: GameStatusActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "published" && canPublish && (
        <StatusButton gameId={gameId} status="published" label="Publicar" variant="primary" />
      )}
      {status === "published" && canPublish && (
        <StatusButton gameId={gameId} status="draft" label="Despublicar" />
      )}
      {status !== "archived" && (
        <StatusButton gameId={gameId} status="archived" label="Arquivar" variant="ghost" />
      )}
      {status === "archived" && (
        <StatusButton gameId={gameId} status="draft" label="Reativar" />
      )}

      {canDelete && (
        <form action={deleteGameAction}>
          <input type="hidden" name="gameId" value={gameId} />
          <Button type="submit" variant="danger" size="sm">
            Excluir
          </Button>
        </form>
      )}
    </div>
  );
}
