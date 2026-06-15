import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { airflowRequest } from "@/lib/airflow";
import { getPermissions } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;
  const role = (session.user as typeof session.user & { role: string }).role;

  try {
    const data = await airflowRequest("get", "/api/v2/dags?limit=100");
    const allDags = data.dags ?? [];

    if (role === "admin") {
      return NextResponse.json(allDags);
    }

    const permitted = getPermissions(email);
    const filtered = allDags.filter((dag: { dag_id: string }) =>
      permitted.includes(dag.dag_id),
    );
    return NextResponse.json(filtered);
  } catch (err) {
    console.error("Airflow DAGs error:", err);
    return NextResponse.json({ error: "Failed to fetch DAGs" }, { status: 502 });
  }
}
