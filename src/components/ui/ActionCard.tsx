// src/components/ui/ActionCard.tsx

type ActionCardProps = {
  title: string;
  description: string;
  action: React.ReactNode; // <Button> ou <LinkButton>
};

export function ActionCard({ title, description, action }: ActionCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <div className="mt-4">{action}</div>
    </div>
  );
}
