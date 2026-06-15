import { Workflow } from "lucide-react";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-8 rounded-xl bg-white p-8 shadow-md">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Workflow className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              RPA Orchestrator
            </span>
          </div>
          <p className="text-sm text-gray-500">Sign in to your account</p>
        </div>

        <Suspense
          fallback={
            <div className="h-48 animate-pulse rounded-md bg-gray-100" />
          }
        >
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-gray-400">
          Use <strong>admin@company.com</strong> or{" "}
          <strong>user@company.com</strong> with password{" "}
          <strong>password123</strong>
        </p>
      </div>
    </div>
  );
}
