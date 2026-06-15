import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { airflowRequest } from "@/lib/airflow";
import { authOptions } from "@/lib/auth";
import { getPermissions } from "@/lib/permissions";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ dagId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dagId } = await params;
  const email = session.user.email;
  const role = (session.user as typeof session.user & { role: string }).role;

  if (role !== "admin") {
    const permitted = getPermissions(email);
    if (!permitted.includes(dagId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const data = await airflowRequest("post", `/api/v2/dags/${dagId}/dagRuns`, {
      logical_date: new Date().toISOString(),
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Airflow trigger error:", err);
    return NextResponse.json(
      { error: "Failed to trigger DAG" },
      { status: 502 },
    );
  }
}
