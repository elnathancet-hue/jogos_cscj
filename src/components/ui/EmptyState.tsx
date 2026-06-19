// src/components/ui/EmptyState.tsx

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      {icon && <div className="mb-4 text-slate-400">{icon}</div>}

      <h3 className="text-base font-semibold text-slate-950">{title}</h3>

      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>
      )}

      {action && <div className="mt-6 flex items-center gap-3">{action}</div>}
    </div>
  );
}
