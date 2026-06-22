import { setGameStatusAction } from "@/app/dashboard/games/actions";
import type { GameStatus } from "@/lib/schema/game.schema";
import { Button } from "@/components/ui/Button";

// Só transições NÃO destrutivas (publicar/despublicar/reativar).
// Arquivar e excluir ficam na DangerZone.
export function GameStatusActions({
  gameId,
  status,
  canPublish,
}: {
  gameId: string;
  status: GameStatus;
  canPublish: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "published" && canPublish && (
        <form action={setGameStatusAction}>
          <input type="hidden" name="gameId" value={gameId} />
          <input type="hidden" name="status" value="published" />
          <Button type="submit" variant="primary" size="sm">
            Publicar
          </Button>
        </form>
      )}
      {status === "published" && (
        <form action={setGameStatusAction}>
          <input type="hidden" name="gameId" value={gameId} />
          <input type="hidden" name="status" value="draft" />
          <Button type="submit" variant="secondary" size="sm">
            Despublicar
          </Button>
        </form>
      )}
      {status === "archived" && (
        <form action={setGameStatusAction}>
          <input type="hidden" name="gameId" value={gameId} />
          <input type="hidden" name="status" value="draft" />
          <Button type="submit" variant="secondary" size="sm">
            Reativar
          </Button>
        </form>
      )}
    </div>
  );
}
