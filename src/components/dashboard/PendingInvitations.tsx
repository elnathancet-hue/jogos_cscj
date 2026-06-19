"use client";

import { useState } from "react";

import { revokeInvitationAction } from "@/app/dashboard/team/actions";
import { ROLE_LABELS, type MemberRole } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export type PendingInvite = {
  id: string;
  email: string;
  role: MemberRole;
  token: string;
};

export function PendingInvitations({ invites }: { invites: PendingInvite[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  if (invites.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum convite pendente.</p>;
  }

  function linkFor(token: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/auth/accept-invite?token=${token}`;
  }

  async function copy(token: string) {
    await navigator.clipboard.writeText(linkFor(token));
    setCopied(token);
    setTimeout(() => setCopied((c) => (c === token ? null : c)), 2000);
  }

  return (
    <ul className="divide-y divide-slate-100">
      {invites.map((inv) => (
        <li key={inv.id} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{inv.email}</p>
            <p className="text-xs text-slate-500">Convite pendente</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="neutral">{ROLE_LABELS[inv.role]}</Badge>
            <Button type="button" variant="secondary" size="sm" onClick={() => copy(inv.token)}>
              {copied === inv.token ? "Copiado!" : "Copiar link"}
            </Button>
            <form action={revokeInvitationAction}>
              <input type="hidden" name="invitationId" value={inv.id} />
              <Button type="submit" variant="ghost" size="sm">
                Revogar
              </Button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
