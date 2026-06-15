import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/session";
import { getAllPermissions } from "@/lib/permissions";
import { getDagsForUser } from "@/lib/dag-service";
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Permissions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage which DAGs each user can access.
        </p>
      </div>

      <AdminPermissionsTable users={users} allDagIds={allDagIds} />
    </div>
  );
}
