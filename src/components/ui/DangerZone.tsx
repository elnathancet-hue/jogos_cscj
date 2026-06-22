// src/components/ui/DangerZone.tsx
//
// Área isolada para ações destrutivas. O conteúdo (botões) vem por children.

type DangerZoneProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export function DangerZone({
  title = "Zona de perigo",
  description = "Estas ações alteram a disponibilidade do jogo. Use com cuidado.",
  children,
}: DangerZoneProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/40 p-5">
      <h3 className="text-sm font-semibold text-red-700">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
