"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { Input } from "@/components/ui/Input";

// Caixa de compartilhamento: QR + link público + link do Modo TV.
export function PublicLinkBox({ gameId }: { gameId: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const playUrl = `${origin}/play/${gameId}`;
  const kioskUrl = `${origin}/kiosk/${gameId}`;

  async function copy(url: string, tag: string) {
    await navigator.clipboard.writeText(url);
    setCopied(tag);
    setTimeout(() => setCopied((c) => (c === tag ? null : c)), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-2">
          {origin ? <QRCodeSVG value={playUrl} size={96} /> : <div className="h-24 w-24" />}
        </div>
        <div className="space-y-2">
          <LinkButton href={kioskUrl} target="_blank" rel="noreferrer" variant="primary" size="sm">
            Abrir Modo TV ↗
          </LinkButton>
          <p className="text-xs text-slate-500">O QR leva direto pra jogar no celular.</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input readOnly value={playUrl} className="flex-1 text-xs text-slate-600" />
          <Button type="button" variant="secondary" size="sm" onClick={() => copy(playUrl, "play")}>
            {copied === "play" ? "Copiado!" : "Copiar link"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input readOnly value={kioskUrl} className="flex-1 text-xs text-slate-600" />
          <Button type="button" variant="secondary" size="sm" onClick={() => copy(kioskUrl, "kiosk")}>
            {copied === "kiosk" ? "Copiado!" : "Copiar Modo TV"}
          </Button>
        </div>
      </div>
    </div>
  );
}
