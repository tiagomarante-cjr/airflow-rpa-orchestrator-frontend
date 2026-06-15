import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { airflowRequest } from "@/lib/airflow";
import { getPermissions } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dagId: string; runId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dagId, runId } = await params;
  const email = session.user.email;
  const role = (session.user as typeof session.user & { role: string }).role;

  if (role !== "admin") {
    const permitted = getPermissions(email);
    if (!permitted.includes(dagId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const run = await airflowRequest(
      "get",
      `/api/v2/dags/${dagId}/dagRuns/${encodeURIComponent(runId)}`,
    );
    return NextResponse.json(run);
  } catch (err) {
    console.error("Airflow single run error:", err);
    return NextResponse.json({ error: "Failed to fetch run" }, { status: 502 });
  }
}
