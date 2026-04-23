import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  PenTool,
  Rocket,
  TrendingUp,
  Building2,
  Crown,
  Users,
  Bot,
  Shield,
  Briefcase,
  CheckCircle,
} from "lucide-react";
import { isUserAuthenticated } from "@/data/sessionAuth";
import { getSessionRole, isTOStage3Role } from "@/data/sessionRole";
import { landingGradients, landingColors } from "@/components/landing/theme";

type OnboardingRoleId =
  | "ea-office"
  | "divisional-lead"
  | "project-manager"
  | "to-delivery"
  | "executive"
  | "general-staff";

type OnboardingDivision =
  | "Generation"
  | "Transmission"
  | "Distribution"
  | "Water & Civil"
  | "Billing Services"
  | "Innovation & The Future"
  | "Power & Water Planning"
  | "Business Support & HR"
  | "Corporate & Strategy"
  | "DEWA Group Subsidiaries"
  | "Transformation Office";

const roles: {
  id: OnboardingRoleId;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "ea-office", label: "Enterprise Architect / EA Office", icon: Building2 },
  { id: "divisional-lead", label: "Divisional Transformation Lead", icon: Users },
  { id: "project-manager", label: "Project Manager / Programme Lead", icon: Briefcase },
  { id: "to-delivery", label: "Transformation Office - Delivery & Admin", icon: Shield },
  { id: "executive", label: "Senior Leadership / Executive", icon: Crown },
  { id: "general-staff", label: "General Staff", icon: Bot },
];

const divisions: OnboardingDivision[] = [
  "Generation",
  "Transmission",
  "Distribution",
  "Water & Civil",
  "Billing Services",
  "Innovation & The Future",
  "Power & Water Planning",
  "Business Support & HR",
  "Corporate & Strategy",
  "DEWA Group Subsidiaries",
  "Transformation Office",
];

const divisionSlugMap: Record<OnboardingDivision, string> = {
  Generation: "generation",
  Transmission: "transmission",
  Distribution: "distribution",
  "Water & Civil": "water-civil",
  "Billing Services": "billing-services",
  "Innovation & The Future": "innovation-future",
  "Power & Water Planning": "power-water-planning",
  "Business Support & HR": "business-support-hr",
  "Corporate & Strategy": "corporate",
  "DEWA Group Subsidiaries": "subsidiaries",
  "Transformation Office": "transformation-office",
};

const lifecycleDivisionMap: Partial<Record<OnboardingDivision, string>> = {
  Generation: "Generation",
  Transmission: "Transmission",
  Distribution: "Distribution",
  "Water & Civil": "Water",
  "Billing Services": "Customer Services",
  "Innovation & The Future": "Innovation & AI",
  "Power & Water Planning": "Corporate & Strategy",
  "Business Support & HR": "Business Support & HR",
  "Corporate & Strategy": "Corporate & Strategy",
  "DEWA Group Subsidiaries": "DEWA Group Subsidiaries",
};

const fourDPhases = [
  {
    id: "discern",
    name: "Discern",
    color: "#6d28d9",
    bg: "#f5f3ff",
    icon: Search,
    desc: "Understand your division's current state - capabilities, assets, and maturity gaps.",
  },
  {
    id: "design",
    name: "Design",
    color: "#0369A1",
    bg: "#f0f9ff",
    icon: PenTool,
    desc: "Define target architecture, produce governed artefacts, and specify solutions.",
  },
  {
    id: "deploy",
    name: "Deploy",
    color: "#16A34A",
    bg: "#f0fdf4",
    icon: Rocket,
    desc: "Build and activate solutions through governed delivery and stage-gate oversight.",
  },
  {
    id: "drive",
    name: "Drive",
    color: "#D97706",
    bg: "#fffbeb",
    icon: TrendingUp,
    desc: "Govern programme performance, maintain the data layer, and surface intelligence.",
  },
];

const rolePhasePrimer: Record<OnboardingRoleId, string> = {
  "ea-office":
    "Your primary home is the enterprise governance layer - asset and capability visibility, architecture oversight, and cross-division decision support.",
  "divisional-lead":
    "You'll work across all phases - from Discern maturity assessments to Drive programme governance within your division context.",
  "project-manager":
    "Deploy and Drive are your primary phases - tracking initiatives, routing delivery through stage gates, and monitoring programme progress.",
  "to-delivery":
    "Drive is your anchor - fulfilling requests, publishing outputs, monitoring operational flow, and coordinating with the Transformation Office.",
  executive:
    "Drive gives you the leadership view - programme health, maturity progression, and strategic investment visibility.",
  "general-staff":
    "Start with Discern - browse learning content, complete orientation, and understand how DTMP supports your division's transformation journey.",
};

function buildCompletionTarget(
  role: OnboardingRoleId | null,
  division: OnboardingDivision | null
): string | { pathname: string; search?: string; state?: Record<string, unknown> } {
  const sessionRole = getSessionRole();
  const hasStage3Access = isTOStage3Role(sessionRole);

  switch (role) {
    case "ea-office":
      return {
        pathname: "/marketplaces/asset-capability",
        state: { tab: "it-asset-portfolio" },
      };
    case "divisional-lead":
      if (division && division !== "Transformation Office") {
        return `/divisions/${divisionSlugMap[division]}`;
      }
      return "/transformation-office";
    case "project-manager": {
      const params = new URLSearchParams();
      if (division) {
        const mappedDivision = lifecycleDivisionMap[division];
        if (mappedDivision) params.set("division", mappedDivision);
      }
      const search = params.toString();
      return {
        pathname: "/marketplaces/initiative-portfolio",
        search: search ? `?${search}` : "",
      };
    }
    case "general-staff":
      return {
        pathname: "/marketplaces/learning",
        search: "?tab=courses",
      };
    case "to-delivery":
      return hasStage3Access ? "/stage3/dashboard" : "/transformation-office";
    case "executive":
      return "/marketplaces/intelligence";
    default:
      return "/marketplaces";
  }
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<OnboardingRoleId | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<OnboardingDivision | null>(null);

  useEffect(() => {
    if (!isUserAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  if (!isUserAuthenticated()) {
    return null;
  }

  const handleComplete = () => {
    localStorage.setItem("dtmp.onboarding.complete", "true");
    if (selectedRole) localStorage.setItem("dtmp.onboarding.role", selectedRole);
    if (selectedDivision) localStorage.setItem("dtmp.onboarding.division", selectedDivision);

    const target = buildCompletionTarget(selectedRole, selectedDivision);
    navigate(target as never);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: landingGradients.hero }}
    >
      <div className="mb-8 text-center">
        <img src="/dewa-logo-v2.png" alt="DEWA" className="w-12 h-12 object-contain mx-auto mb-3" />
        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">DEWA DTMP</p>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-1 bg-slate-100">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(step / 3) * 100}%`,
              background: landingGradients.secondary,
            }}
          />
        </div>

        <div className="px-8 pt-8 pb-10">
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={
                    s < step
                      ? { background: landingColors.primary, color: "#fff" }
                      : s === step
                        ? { background: landingColors.teal, color: "#fff" }
                        : { background: "#f1f5f9", color: "#94a3b8" }
                  }
                >
                  {s < step ? <CheckCircle size={14} /> : s}
                </div>
                {s < 3 && <div className="w-8 h-px bg-slate-200" />}
              </div>
            ))}
            <span className="ml-2 text-xs text-slate-400 font-medium">Step {step} of 3</span>
          </div>

          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                What best describes your role?
              </h1>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                This helps us route you to the right starting point in the platform.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const selected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all"
                      style={
                        selected
                          ? { borderColor: landingColors.primary, background: "#f0fdf4" }
                          : { borderColor: "#e2e8f0", background: "#fff" }
                      }
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: selected ? landingColors.primary : "#f1f5f9" }}
                      >
                        <Icon size={17} className={selected ? "text-white" : "text-slate-400"} />
                      </div>
                      <span
                        className="text-sm font-semibold leading-tight"
                        style={{ color: selected ? landingColors.primary : "#334155" }}
                      >
                        {role.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => selectedRole && setStep(2)}
                  disabled={!selectedRole}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: landingGradients.secondary }}
                >
                  Next <ArrowRight size={15} />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Which division do you belong to?
              </h1>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Your division context helps surface the most relevant content and initiatives.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {divisions.map((division) => {
                  const selected = selectedDivision === division;
                  return (
                    <button
                      key={division}
                      onClick={() => setSelectedDivision(division)}
                      className="px-4 py-3 rounded-xl border-2 text-left text-sm font-semibold transition-all"
                      style={
                        selected
                          ? { borderColor: "#0369A1", background: "#f0f9ff", color: "#0369A1" }
                          : { borderColor: "#e2e8f0", background: "#fff", color: "#334155" }
                      }
                    >
                      {division}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  onClick={() => selectedDivision && setStep(3)}
                  disabled={!selectedDivision}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: landingGradients.secondary }}
                >
                  Next <ArrowRight size={15} />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Here&apos;s how the platform is organised
              </h1>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Every marketplace and workspace in DTMP is organised under one of four governance
                phases.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {fourDPhases.map((phase) => {
                  const Icon = phase.icon;
                  return (
                    <div
                      key={phase.id}
                      className="rounded-xl p-4 border"
                      style={{ background: phase.bg, borderColor: `${phase.color}30` }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                        style={{ background: phase.color }}
                      >
                        <Icon size={16} className="text-white" />
                      </div>
                      <p className="font-bold text-sm mb-1" style={{ color: phase.color }}>
                        {phase.name}
                      </p>
                      <p className="text-slate-600 text-xs leading-relaxed">{phase.desc}</p>
                    </div>
                  );
                })}
              </div>

              {selectedRole && (
                <div
                  className="rounded-xl px-4 py-3 mb-6 border"
                  style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: landingColors.teal }}>
                    Your Starting Point
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {rolePhasePrimer[selectedRole]}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleComplete}
                    className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors px-3 py-2"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleComplete}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
                    style={{ background: landingGradients.secondary }}
                  >
                    Take me to my workspace <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-white/30 text-xs text-center">
        DEWA Digital Transformation Management Platform - DigitalQatalyst
      </p>
    </div>
  );
}
