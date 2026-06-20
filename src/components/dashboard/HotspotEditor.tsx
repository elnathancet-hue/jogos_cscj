"use client";

import { useActionState, useState } from "react";

import { updateGameContentAction } from "@/app/dashboard/games/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import type { HotspotTarget } from "@/lib/games/hotspot";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";

export function HotspotEditor({
  gameId,
  initialImageUrl,
  initialTargets,
}: {
  gameId: string;
  initialImageUrl: string;
  initialTargets: HotspotTarget[];
}) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [targets, setTargets] = useState<HotspotTarget[]>(initialTargets);
  const [state, action, pending] = useActionState(updateGameContentAction, EMPTY_FORM_STATE);

  function addTarget(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    setTargets((t) => [...t, { id: crypto.randomUUID(), x, y, label: "" }]);
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="settings" value={JSON.stringify({ type: "hotspot", imageUrl, targets })} />

      {state.message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</p>
      )}
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Field label="Imagem do jogo">
        <ImageUpload name="__hotspot_img" defaultUrl={imageUrl} pathPrefix="hotspot" onChange={setImageUrl} />
      </Field>

      {imageUrl ? (
        <div>
          <p className="mb-1 text-sm text-slate-600">Clique na imagem para marcar um alvo. Depois escreva a dica.</p>
          <div className="relative inline-block cursor-crosshair select-none" onClick={addTarget}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="max-h-80 w-auto rounded-lg border border-slate-200" />
            {targets.map((t, i) => (
              <span
                key={t.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 px-1.5 text-xs font-bold text-white shadow"
                style={{ left: `${t.x}%`, top: `${t.y}%` }}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Envie uma imagem para começar a marcar os alvos.</p>
      )}

      {targets.length > 0 && (
        <ul className="space-y-2">
          {targets.map((t, i) => (
            <li key={t.id} className="flex items-center gap-2">
              <span className="w-5 text-center text-sm font-semibold text-slate-400">{i + 1}</span>
              <Field label={`Dica do alvo ${i + 1}`} className="flex-1">
                <Input
                  value={t.label}
                  placeholder="Ex.: Onde fica o sol?"
                  onChange={(e) => setTargets((ts) => ts.map((x) => (x.id === t.id ? { ...x, label: e.target.value } : x)))}
                />
              </Field>
              <Button type="button" variant="ghost" size="sm" className="mt-6" onClick={() => setTargets((ts) => ts.filter((x) => x.id !== t.id))}>✕</Button>
            </li>
          ))}
        </ul>
      )}

      <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar conteúdo"}</Button>
    </form>
  );
}
