"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/auth/actions";
import { setActiveOrganizationAction } from "@/app/dashboard/organizations/actions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

const LINKS = [
  { href: "/dashboard", label: "Visão geral", icon: "🏠" },
  { href: "/dashboard/games", label: "Jogos", icon: "🎮" },
  { href: "/dashboard/classes", label: "Turmas", icon: "🎒" },
  { href: "/dashboard/team", label: "Equipe", icon: "👥" },
  { href: "/dashboard/organization", label: "Organização", icon: "🏛️" },
  { href: "/dashboard/profile", label: "Perfil", icon: "👤" },
];

type NavOrg = { id: string; name: string };

export function DashboardNav({
  orgs,
  activeOrgId,
}: {
  orgs: NavOrg[];
  activeOrgId: string | null;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-950">Jogos CSCJ</span>

          {orgs.length > 0 && (
            <div className="flex items-center gap-2">
              <form action={setActiveOrganizationAction}>
                <Select
                  name="orgId"
                  defaultValue={activeOrgId ?? orgs[0]?.id}
                  className="h-8 w-48 text-xs"
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  aria-label="Organização ativa"
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </form>
              <Link
                href="/dashboard/organizations"
                className="text-xs text-blue-700 hover:underline"
              >
                Gerenciar
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active =
                link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  <span className="text-xs">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
