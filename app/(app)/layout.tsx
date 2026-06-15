import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getAppSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-full">
      <Sidebar
        role={session.user.role}
        userName={session.user.name ?? session.user.email ?? ""}
      />
      <main className="flex-1 overflow-y-auto bg-slate-50 px-8 py-8">{children}</main>
    </div>
  );
}
