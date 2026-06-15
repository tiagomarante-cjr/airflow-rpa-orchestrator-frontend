import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getDagsForUser } from "@/lib/dag-service";
import { getAllPermissions } from "@/lib/permissions";
import { getAppSession } from "@/lib/session";
import { AdminPermissionsTable } from "./AdminPermissionsTable";

export default async function AdminPage() {
  const session = await getAppSession();
  if (session?.user.role !== "admin") redirect("/dashboard");

  const permissions = getAllPermissions();
  const allDags = await getDagsForUser(session!.user.email!, "admin");
  const allDagIds = allDags.map((d) => d.dag_id);

  const users = Object.entries(permissions).map(([email, dag_ids]) => ({
    email,
    dag_ids,
  }));

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">User Permissions</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Manage which DAGs each user can access.{" "}
          <span className="font-medium text-slate-700">{users.length} user{users.length !== 1 ? "s" : ""}</span>,{" "}
          <span className="font-medium text-slate-700">{allDagIds.length} DAG{allDagIds.length !== 1 ? "s" : ""}</span> available.
        </p>
      </div>

      <AdminPermissionsTable users={users} allDagIds={allDagIds} />
    </div>
  );
}
