"use client";

import { LayoutDashboard, LogOut, ShieldCheck, Workflow } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const ADMIN_ITEMS = [
  { label: "Permissions", href: "/admin", icon: ShieldCheck },
];

export function Sidebar({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-white/5 bg-slate-950">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/30">
          <Workflow className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white tracking-tight">
            RPA Orchestrator
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            Airflow
          </p>
        </div>
      </div>

      <div className="mx-3 h-px bg-white/5" />

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Navigation
        </p>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}

        {role === "admin" && (
          <>
            <p className="mb-2 mt-5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Admin
            </p>
            {ADMIN_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-indigo-500/15 text-indigo-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="mx-3 h-px bg-white/5" />
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-300">
              {userName}
            </p>
            <p className="text-[10px] capitalize text-slate-600">{role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="text-slate-600 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
