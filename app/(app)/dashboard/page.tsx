import { redirect } from "next/navigation";
import { DAGCard } from "@/components/DAGCard";
import { getDagsForUser } from "@/lib/dag-service";
import { getPermissions } from "@/lib/permissions";
import { getAppSession } from "@/lib/session";
import { LayoutDashboard } from "lucide-react";

export default async function DashboardPage() {
  const session = await getAppSession();
  if (!session) redirect("/login");

  const { email, role } = session.user as { email: string; role: string; name?: string };
  const dags = await getDagsForUser(email, role);

  const isAdmin = role === "admin";
  const perms = isAdmin ? null : getPermissions(email);

  function canTrigger(dagId: string): boolean {
    if (isAdmin) return true;
    if (!perms) return false;
    if (perms["*"]) return perms["*"].includes("trigger");
    return (perms[dagId] ?? []).includes("trigger");
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <LayoutDashboard className="h-4 w-4 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">DAG Dashboard</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back,{" "}
            <span className="font-medium text-slate-700">
              {session.user.name ?? email}
            </span>
            {" — "}
            {dags.length} DAG{dags.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      {dags.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <p className="text-sm text-slate-400">No DAGs available for your account.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {dags.map((dag) => (
            <DAGCard key={dag.dag_id} dag={dag} canTrigger={canTrigger(dag.dag_id)} />
          ))}
        </div>
      )}
    </div>
  );
}
