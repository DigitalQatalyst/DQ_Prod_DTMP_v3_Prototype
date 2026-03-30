import {
  Activity,
  BarChart2,
  Briefcase,
  ChevronRight,
  Lock,
  User,
  X,
} from "lucide-react";
import {
  setLifecycleRole,
  getDemoAccount,
  LIFECYCLE_ROLE_LABELS,
  LIFECYCLE_ROLE_DESCRIPTIONS,
  type LifecycleInsightsRole,
} from "@/data/shared/lifecycleRole";
import { setUserAuthenticated } from "@/data/sessionAuth";

const ROLES: {
  id: LifecycleInsightsRole;
  icon: React.FC<{ className?: string }>;
  depth: string;
  accent: string;
  border: string;
}[] = [
  {
    id: "general-staff",
    icon: User,
    depth: "Basic",
    accent: "bg-slate-50 hover:bg-slate-100",
    border: "border-slate-200 hover:border-slate-400",
  },
  {
    id: "initiative-owner",
    icon: BarChart2,
    depth: "Full",
    accent: "bg-teal-50 hover:bg-teal-100",
    border: "border-teal-200 hover:border-teal-400",
  },
  {
    id: "senior-stakeholder",
    icon: Briefcase,
    depth: "Executive",
    accent: "bg-blue-50 hover:bg-blue-100",
    border: "border-blue-200 hover:border-blue-400",
  },
];

interface Props {
  onSuccess: (role: LifecycleInsightsRole) => void;
  onClose: () => void;
}

export function LCInsightsLoginModal({ onSuccess, onClose }: Props) {
  const handleSelect = (role: LifecycleInsightsRole) => {
    setUserAuthenticated(true);
    setLifecycleRole(role);
    onSuccess(role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Insights Access</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Sign in to view operational programme data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Select your access level. The depth of insights visible to you is
            determined by your role.
          </p>

          <div className="space-y-3">
            {ROLES.map(({ id, icon: Icon, depth, accent, border }) => {
              const account = getDemoAccount(id);
              return (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${accent} ${border} group`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Icon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-slate-900">
                          {LIFECYCLE_ROLE_LABELS[id]}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          depth === "Full" ? "bg-teal-100 text-teal-700" :
                          depth === "Executive" ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {depth}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                        {LIFECYCLE_ROLE_DESCRIPTIONS[id]}
                      </p>
                      <p className="text-xs text-slate-400 mt-1.5">
                        Demo: {account.name} · {account.title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 text-center pt-1">
            Demo environment — no real credentials required
          </p>
        </div>
      </div>
    </div>
  );
}
