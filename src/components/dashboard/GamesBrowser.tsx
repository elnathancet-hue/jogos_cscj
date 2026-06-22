"use client";

import { useMemo, useState } from "react";

import { GAME_STATUS_LABELS, GAME_STATUSES, type GameStatus } from "@/lib/schema/game.schema";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameCard, type GameCardData } from "@/components/dashboard/GameCard";

export function GamesBrowser({ games }: { games: GameCardData[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | GameStatus>("all");
  const [type, setType] = useState<"all" | string>("all");

  const types = useMemo(
    () => Array.from(new Set(games.map((g) => g.typeLabel))).sort(),
    [games],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games.filter(
      (g) =>
        (status === "all" || g.status === status) &&
        (type === "all" || g.typeLabel === type) &&
        (q === "" || g.title.toLowerCase().includes(q)),
    );
  }, [games, query, status, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Buscar" htmlFor="game-search" className="flex-1">
          <Input
            id="game-search"
            placeholder="Buscar por nome…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <Field label="Status" htmlFor="game-status" className="sm:w-44">
          <Select id="game-status" value={status} onChange={(e) => setStatus(e.target.value as "all" | GameStatus)}>
            <option value="all">Todos</option>
            {GAME_STATUSES.map((s) => (
              <option key={s} value={s}>
                {GAME_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tipo" htmlFor="game-type" className="sm:w-48">
          <Select id="game-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Todos</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum jogo encontrado"
          description="Ajuste a busca ou os filtros."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}
