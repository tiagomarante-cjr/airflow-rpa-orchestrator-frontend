import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/session";
import { getDagsForUser } from "@/lib/dag-service";
import { DAGCard } from "@/components/DAGCard";

export default async function DashboardPage() {
  const session = await getAppSession();
  if (!session) redirect("/login");

  const dags = await getDagsForUser(session.user.email!, session.user.role);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">DAG Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {session.user.name ?? session.user.email}
        </p>
      </div>

      {dags.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-gray-500">No DAGs available for your account.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {dags.map((dag) => (
            <DAGCard key={dag.dag_id} dag={dag} />
          ))}
        </div>
      )}
    </div>
  );
}
