"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  name: string; // nome do campo escondido que carrega a URL final
  defaultUrl?: string;
  pathPrefix?: string; // pasta lógica dentro do bucket
  onChange?: (url: string) => void;
};

const BUCKET = "media";

export function ImageUpload({ name, defaultUrl = "", pathPrefix = "uploads", onChange }: ImageUploadProps) {
  const [url, setUrl] = useState(defaultUrl);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "bin";
    const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type });

    if (error) {
      setStatus("error");
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setUrl(data.publicUrl);
    onChange?.(data.publicUrl);
    setStatus("idle");
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />

      <div className="flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Pré-visualização"
            className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
            sem img
          </div>
        )}

        <label
          className={cn(
            "cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50",
            status === "uploading" && "pointer-events-none opacity-50",
          )}
        >
          {status === "uploading" ? "Enviando..." : "Escolher imagem"}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      </div>

      {status === "error" && (
        <p className="text-xs text-red-600">
          Falha no upload. Verifique se o bucket de Storage já foi criado.
        </p>
      )}
    </div>
  );
}
