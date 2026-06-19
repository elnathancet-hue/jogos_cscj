"use client";

import { changeRoleAction, removeMemberAction } from "@/app/dashboard/team/actions";
import { ASSIGNABLE_ROLES } from "@/lib/schema/team.schema";
import { ROLE_LABELS, type MemberRole } from "@/lib/auth/permissions";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export type TeamMember = {
  id: string;
  userId: string;
  role: MemberRole;
  fullName: string;
  email: string;
};

type TeamMembersProps = {
  members: TeamMember[];
  isAdmin: boolean;
  currentUserId: string;
};

export function TeamMembers({ members, isAdmin, currentUserId }: TeamMembersProps) {
  return (
    <ul className="divide-y divide-slate-100">
      {members.map((m) => {
        const isSelf = m.userId === currentUserId;
        const manageable = isAdmin && !isSelf;

        return (
          <li key={m.id} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {m.fullName || m.email}
                {isSelf && <span className="ml-2 text-xs text-slate-400">(você)</span>}
              </p>
              <p className="truncate text-xs text-slate-500">{m.email}</p>
            </div>

            <div className="flex items-center gap-2">
              {manageable ? (
                <>
                  <form action={changeRoleAction}>
                    <input type="hidden" name="memberId" value={m.id} />
                    <Select
                      name="role"
                      defaultValue={m.role}
                      className="h-8 w-40 text-xs"
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </Select>
                  </form>

                  <form action={removeMemberAction}>
                    <input type="hidden" name="memberId" value={m.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Remover
                    </Button>
                  </form>
                </>
              ) : (
                <Badge variant={m.role === "org_admin" ? "primary" : "neutral"}>
                  {ROLE_LABELS[m.role]}
                </Badge>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
