import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface Stage3ShellProps {
  scope: "lifecycle-management" | "portfolio-management";
  title: string;
  subtitle: string;
  children: ReactNode;
}

const SCOPES = [
  { id: "dashboard", label: "Stage 3 Dashboard", route: "/stage3/dashboard" },
  { id: "lifecycle-management", label: "Lifecycle Management", route: "/stage3/lifecycle-management/overview" },
  { id: "portfolio-management", label: "Portfolio Management", route: "/stage3/portfolio-management/overview" },
  { id: "solution-specs", label: "Solution Specs", route: "/stage3/solution-specs/overview" },
  { id: "document-studio", label: "Document Studio", route: "/stage3/document-studio/overview" },
] as const;

export default function Stage3Shell({ scope, title, subtitle, children }: Stage3ShellProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">TO Governance Workspace</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">{title}</h1>
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            </div>
            <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
              TO Office
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {SCOPES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.route)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  item.id === scope
                    ? "border-orange-200 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:text-gray-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
    </div>
  );
}
