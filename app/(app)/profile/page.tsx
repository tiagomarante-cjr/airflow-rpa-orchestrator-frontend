import { redirect } from "next/navigation";
import { User } from "lucide-react";
import { getAppSession } from "@/lib/session";
import { getUser } from "@/lib/users";
import { getPermissions } from "@/lib/permissions";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getAppSession();
  if (!session) redirect("/login");

  const userRecord = getUser(session.user.email!);
  const permissions = getPermissions(session.user.email!);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
            <User className="h-4 w-4 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Profile</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Manage your display name, photo, and view your access permissions.
        </p>
      </div>

      <ProfileClient
        email={session.user.email!}
        initialName={userRecord?.name ?? session.user.name ?? ""}
        initialImage={userRecord?.image ?? null}
        role={session.user.role}
        permissions={permissions}
      />
    </div>
  );
}
