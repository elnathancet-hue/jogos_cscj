"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";

const LINKS = [
  { href: "/dashboard", label: "Visão geral" },
  { href: "/dashboard/profile", label: "Perfil" },
  { href: "/dashboard/organization", label: "Organização" },
  { href: "/dashboard/team", label: "Equipe" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-slate-950">Jogos CSCJ</span>
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
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
