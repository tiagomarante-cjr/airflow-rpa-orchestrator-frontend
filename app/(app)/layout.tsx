import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getAppSession } from "@/lib/session";
import { getUser } from "@/lib/users";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();
  if (!session) redirect("/login");

  const userRecord = getUser(session.user.email!);

  return (
    <div className="flex h-full">
      <Sidebar
        role={session.user.role}
        userName={userRecord?.name ?? session.user.name ?? session.user.email ?? ""}
        userImage={userRecord?.image}
      />
      <main className="flex-1 overflow-y-auto bg-slate-50 px-8 py-8">{children}</main>
    </div>
  );
}
