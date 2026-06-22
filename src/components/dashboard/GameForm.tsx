"use client";

import { useActionState } from "react";

import { createGameAction, updateGameAction } from "@/app/dashboard/games/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { GAME_TYPES, GAME_TYPE_LABELS } from "@/lib/games/types";

type GameFormProps = {
  mode: "create" | "edit";
  defaults?: {
    gameId: string;
    title: string;
    description: string;
    coverImageUrl?: string;
  };
};

export function GameForm({ mode, defaults }: GameFormProps) {
  const isEdit = mode === "edit";
  const [state, action, pending] = useActionState(
    isEdit ? updateGameAction : createGameAction,
    EMPTY_FORM_STATE,
  );

  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {isEdit && defaults && (
        <input type="hidden" name="gameId" value={defaults.gameId} />
      )}

      <Field label="Título" htmlFor="title">
        <Input id="title" name="title" defaultValue={defaults?.title ?? ""} required />
      </Field>

      {!isEdit && (
        <Field label="Tipo de jogo" htmlFor="gameType" hint="Define o conteúdo que você vai montar.">
          <Select id="gameType" name="gameType" defaultValue="quiz">
            {GAME_TYPES.map((t) => (
              <option key={t} value={t}>
                {GAME_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Descrição" htmlFor="description" hint="Opcional.">
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={defaults?.description ?? ""}
        />
      </Field>

      <Field label="Capa do jogo" hint="Opcional — imagem exibida no card.">
        <ImageUpload
          name="coverImageUrl"
          defaultUrl={defaults?.coverImageUrl ?? ""}
          pathPrefix="game-covers"
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar jogo"}
      </Button>
    </form>
  );
}
