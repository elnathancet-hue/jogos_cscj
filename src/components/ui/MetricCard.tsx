// src/components/ui/MetricCard.tsx

import Link from "next/link";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: React.ReactNode;
  href?: string;
};

export function MetricCard({ label, value, href }: MetricCardProps) {
  const inner = (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors",
        href && "hover:border-blue-300",
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-950">{value}</p>
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
