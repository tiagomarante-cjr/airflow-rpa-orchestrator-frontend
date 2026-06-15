import { Workflow } from "lucide-react";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 shadow-xl shadow-indigo-500/40">
            <Workflow className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">RPA Orchestrator</h1>
            <p className="mt-0.5 text-sm text-slate-400">Sign in to your workspace</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
          <Suspense
            fallback={<div className="h-48 animate-pulse rounded-xl bg-white/10" />}
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Demo:{" "}
          <span className="font-mono text-slate-400">admin@company.com</span> or{" "}
          <span className="font-mono text-slate-400">user@company.com</span>
          {" — "}password{" "}
          <span className="font-mono text-slate-400">password123</span>
        </p>
      </div>
    </div>
  );
}
