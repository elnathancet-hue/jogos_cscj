import { getMyOrganizations, getActiveOrganization } from "@/lib/auth/org";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [orgs, active] = await Promise.all([
    getMyOrganizations(),
    getActiveOrganization(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav
        orgs={orgs.map((m) => ({ id: m.org.id, name: m.org.name }))}
        activeOrgId={active?.org.id ?? null}
      />
      <div className="mx-auto w-full max-w-7xl px-6 py-6">{children}</div>
    </div>
  );
}
