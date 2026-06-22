import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { GAME_STATUS_LABELS, type GameStatus } from "@/lib/schema/game.schema";
import type { BadgeVariant } from "@/design-system/variants";

export type GameCardData = {
  id: string;
  title: string;
  description: string | null;
  status: GameStatus;
  typeLabel: string;
  sessions: number;
  updatedAt: string;
  published: boolean;
};

const STATUS_VARIANT: Record<GameStatus, BadgeVariant> = {
  draft: "neutral",
  published: "success",
  archived: "warning",
};

export function GameCard({ game }: { game: GameCardData }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-950">{game.title}</h3>
        <Badge variant={STATUS_VARIANT[game.status]}>{GAME_STATUS_LABELS[game.status]}</Badge>
      </div>

      {game.description && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{game.description}</p>
      )}

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>{game.typeLabel}</span>
        <span>·</span>
        <span>{game.sessions} sessões</span>
        <span>·</span>
        <span>atualizado em {new Date(game.updatedAt).toLocaleDateString("pt-BR")}</span>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <LinkButton href={`/dashboard/games/${game.id}`} variant="secondary" size="sm">
          Editar
        </LinkButton>
        <LinkButton href={`/dashboard/games/${game.id}/results`} variant="ghost" size="sm">
          Resultados
        </LinkButton>
        {game.published && (
          <>
            <LinkButton href={`/play/${game.id}`} target="_blank" rel="noreferrer" variant="ghost" size="sm">
              Página pública
            </LinkButton>
            <LinkButton href={`/kiosk/${game.id}`} target="_blank" rel="noreferrer" variant="ghost" size="sm">
              Modo TV
            </LinkButton>
          </>
        )}
      </div>
    </Card>
  );
}
