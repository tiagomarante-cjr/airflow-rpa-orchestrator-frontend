import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { airflowRequest } from "@/lib/airflow";
import { hasAction } from "@/lib/permissions";

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

  if (role !== "admin" && !hasAction(email, dagId, "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // FastAPI does not decode %2B in path segments — keep + literal
  const airflowRunId = encodeURIComponent(runId).replace(/%2B/gi, "+");

  try {
    const run = await airflowRequest("get", `/api/v2/dags/${dagId}/dagRuns/${airflowRunId}`);
    return NextResponse.json(run);
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    console.error(`[runs/${dagId}] state fetch failed — HTTP ${status ?? "network error"}`);
    return NextResponse.json({ error: "Failed to fetch run" }, { status: 502 });
  }
}
