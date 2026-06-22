"use client";

import { useState } from "react";

import {
  THEME_PRESETS,
  FONT_LABELS,
  type OrgTheme,
  type ThemeFont,
  type ThemePreset,
} from "@/lib/play/theme";
import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";

const PRESET_KEYS = Object.keys(THEME_PRESETS) as (keyof typeof THEME_PRESETS)[];

export function ThemePicker({
  initial,
  canEdit,
}: {
  initial?: OrgTheme | null;
  canEdit: boolean;
}) {
  const [preset, setPreset] = useState<ThemePreset>(initial?.preset ?? "arcade");
  const [accent, setAccent] = useState(initial?.accent ?? "#7c3aed");
  const [bgFrom, setBgFrom] = useState(initial?.bgFrom ?? "#7c3aed");
  const [bgTo, setBgTo] = useState(initial?.bgTo ?? "#0f172a");
  const [font, setFont] = useState<ThemeFont>(initial?.font ?? "playful");

  const value: OrgTheme =
    preset === "custom" ? { preset, accent, bgFrom, bgTo, font } : { preset };

  return (
    <div className="space-y-3">
      <input type="hidden" name="theme" value={JSON.stringify(value)} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRESET_KEYS.map((key) => {
          const p = THEME_PRESETS[key];
          const active = preset === key;
          return (
            <button
              key={key}
              type="button"
              disabled={!canEdit}
              onClick={() => setPreset(key)}
              className={cn(
                "overflow-hidden rounded-lg border-2 text-left transition-colors",
                active ? "border-blue-500" : "border-slate-200",
              )}
            >
              <div
                className="flex h-12 items-center justify-end px-2"
                style={{ background: `linear-gradient(135deg, ${p.bgFrom}, ${p.bgTo})` }}
              >
                <span className="h-4 w-4 rounded-full border border-white/60" style={{ background: p.accent }} />
              </div>
              <span className="block px-2 py-1 text-xs font-medium text-slate-700">
                {p.emoji} {p.label}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          disabled={!canEdit}
          onClick={() => setPreset("custom")}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 p-2 text-center transition-colors",
            preset === "custom" ? "border-blue-500" : "border-slate-200",
          )}
        >
          <span className="text-lg">🎨</span>
          <span className="text-xs font-medium text-slate-700">Personalizado</span>
        </button>
      </div>

      {preset === "custom" && (
        <div className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
          <Field label="Cor de destaque">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} disabled={!canEdit} className="h-9 w-full rounded" />
          </Field>
          <Field label="Fonte">
            <Select value={font} onChange={(e) => setFont(e.target.value as ThemeFont)} disabled={!canEdit}>
              {(Object.keys(FONT_LABELS) as ThemeFont[]).map((f) => (
                <option key={f} value={f}>{FONT_LABELS[f]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fundo (de)">
            <input type="color" value={bgFrom} onChange={(e) => setBgFrom(e.target.value)} disabled={!canEdit} className="h-9 w-full rounded" />
          </Field>
          <Field label="Fundo (para)">
            <input type="color" value={bgTo} onChange={(e) => setBgTo(e.target.value)} disabled={!canEdit} className="h-9 w-full rounded" />
          </Field>
        </div>
      )}
    </div>
  );
}
