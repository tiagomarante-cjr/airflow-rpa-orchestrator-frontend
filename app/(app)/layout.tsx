import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-full">
      <Sidebar
        role={session.user.role}
        userName={session.user.name ?? session.user.email ?? ""}
      />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
    </div>
  );
}
