"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Workflow,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const ADMIN_ITEMS = [
  { label: "User Permissions", href: "/admin", icon: ShieldCheck },
];

export function Sidebar({
  role,
  userName,
}: {
  role: string;
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col bg-gray-900 text-gray-100">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-700 px-5 py-4">
        <Workflow className="h-6 w-6 text-blue-400" />
        <span className="text-sm font-semibold leading-tight">
          RPA<br />
          <span className="text-gray-400 text-xs font-normal">Orchestrator</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <NavItem key={href} label={label} href={href} icon={<Icon className="h-4 w-4" />} active={pathname === href || pathname.startsWith(href + "/")} />
        ))}

        {role === "admin" && (
          <>
            <div className="mt-4 mb-1 px-2 text-xs uppercase tracking-wider text-gray-500">
              Admin
            </div>
            {ADMIN_ITEMS.map(({ label, href, icon: Icon }) => (
              <NavItem key={href} label={label} href={href} icon={<Icon className="h-4 w-4" />} active={pathname.startsWith(href)} />
            ))}
          </>
        )}
      </nav>

      {/* User info + sign out */}
      <div className="border-t border-gray-700 px-4 py-3">
        <p className="truncate text-xs text-gray-300">{userName}</p>
        <p className="text-xs text-gray-500 capitalize">{role}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-2 flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  label,
  href,
  icon,
  active,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
