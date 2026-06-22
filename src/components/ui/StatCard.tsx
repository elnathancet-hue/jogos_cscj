// src/components/ui/StatCard.tsx

import Link from "next/link";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  icon: string;
  href?: string;
  accent?: string;
};

export function StatCard({
  label,
  value,
  icon,
  href,
  accent = "bg-blue-50 text-blue-700",
}: StatCardProps) {
  const inner = (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors",
        href && "hover:border-blue-300",
      )}
    >
      <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-2xl", accent)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight text-slate-950">{value}</p>
        <p className="truncate text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
