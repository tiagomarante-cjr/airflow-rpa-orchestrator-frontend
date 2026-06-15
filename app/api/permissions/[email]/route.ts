import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPermissions, setPermissions } from "@/lib/permissions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ email: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await params;
  const role = (session.user as typeof session.user & { role: string }).role;

  // Users may only read their own permissions; admins may read any
  if (role !== "admin" && session.user.email !== decodeURIComponent(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dagIds = getPermissions(decodeURIComponent(email));
  return NextResponse.json({
    email: decodeURIComponent(email),
    dag_ids: dagIds,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as typeof session.user & { role: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await params;
  const body = await request.json();
  const dagIds: string[] = body.dag_ids ?? [];

  setPermissions(decodeURIComponent(email), dagIds);
  return NextResponse.json({
    email: decodeURIComponent(email),
    dag_ids: dagIds,
  });
}
