import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      <div className="mx-auto w-full max-w-7xl px-6 py-6">{children}</div>
    </div>
  );
}
