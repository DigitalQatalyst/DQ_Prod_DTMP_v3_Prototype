import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, ArrowLeft, BarChart2, Calendar,
  CheckCircle2, ChevronDown, ChevronUp, DollarSign, FileText,
  Flag, Shield, TrendingUp, Users, Zap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LCInsightsLoginModal } from "@/components/lifecycle/LCInsightsLoginModal";
import { isUserAuthenticated } from "@/data/sessionAuth";
import {
  INITIATIVE_LEVEL_SERVICES, LC_SERVICE_SLA, addLCRequest, type LCServiceType,
} from "@/data/lifecycle/serviceRequestState";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  getInitiatives, getProjects, updateMilestoneStatus, updateProjectRAG,
  type Initiative, type Project, type RAGStatus, type MilestoneStatus,
} from "@/data/shared/lifecyclePortfolioStore";
import {
  getLifecycleRole, getDemoAccount, type LifecycleInsightsRole, LIFECYCLE_ROLE_LABELS,
} from "@/data/shared/lifecycleRole";

// ── Helpers ────────────────────────────────────────────────────────────────────

const RAG_COLORS: Record<RAGStatus, string> = {
  Green: "bg-green-500/20 text-green-300 border-green-500/30",
  Amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Red:   "bg-red-500/20 text-red-300 border-red-500/30",
};
const RAG_DOT: Record<RAGStatus, string> = {
  Green: "bg-green-400", Amber: "bg-amber-400", Red: "bg-red-400",
};
const MS_COLORS: Record<MilestoneStatus, string> = {
  Complete:      "text-green-400 bg-green-500/10",
  "In Progress": "text-blue-400 bg-blue-500/10",
  "Not Started": "text-slate-400 bg-slate-500/10",
  Delayed:       "text-red-400 bg-red-500/10",
};
const SEV_COLORS: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-300",
  High:     "bg-orange-500/20 text-orange-300",
  Medium:   "bg-amber-500/20 text-amber-300",
  Low:      "bg-slate-500/20 text-slate-300",
};
const ESC_COLORS: Record<string, string> = {
  "Not Escalated":              "bg-slate-500/20 text-slate-400",
  "Escalated to TO":            "bg-amber-500/20 text-amber-400",
  "Escalated to Division Head": "bg-red-500/20 text-red-400",
};

const fmt = (n: number | null): string => {
  if (n === null) return "TBC";
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}K`;
  return `AED ${n}`;
};
const daysUntil = (d: string) =>
  Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);

// ── Section config ─────────────────────────────────────────────────────────────

type InsightSection =
  | "health" | "projects" | "budget" | "milestones"
  | "risks"  | "blockers" | "team"   | "activity";

const SECTIONS: { id: InsightSection; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "health",     label: "Health",     icon: Activity    },
  { id: "projects",   label: "Projects",   icon: BarChart2   },
  { id: "budget",     label: "Budget",     icon: DollarSign  },
  { id: "milestones", label: "Milestones", icon: CheckCircle2},
  { id: "risks",      label: "Risks",      icon: Shield      },
  { id: "blockers",   label: "Blockers",   icon: Flag        },
  { id: "team",       label: "Team",       icon: Users       },
  { id: "activity",   label: "Activity",   icon: Zap         },
];

const SECTION_DESC: Record<InsightSection, Record<LifecycleInsightsRole, string>> = {
  health:     { "initiative-owner": "Full programme health — RAG, all metrics, budget utilisation and project summary", "senior-stakeholder": "Executive health dashboard — key numbers at a glance", "general-staff": "Initiative status and overall progress" },
  projects:   { "initiative-owner": "All linked projects with RAG, milestones, blockers and update controls", "senior-stakeholder": "Project health overview — RAG distribution and progress bars", "general-staff": "Projects linked to this initiative" },
  budget:     { "initiative-owner": "Full budget breakdown — allocation, spend, forecast and per-project health", "senior-stakeholder": "Budget headline — total, spend and variance", "general-staff": "Budget utilisation summary" },
  milestones: { "initiative-owner": "Full milestone tracker across all projects with status controls", "senior-stakeholder": "Milestone completion dashboard — counts and overdue alerts", "general-staff": "Upcoming milestones across the programme" },
  risks:      { "initiative-owner": "Full risk register — severity, impact, mitigation plans and owners", "senior-stakeholder": "Risk severity breakdown — critical and high items surfaced", "general-staff": "Risks identified on this programme" },
  blockers:   { "initiative-owner": "Open blockers with escalation status and resolution details", "senior-stakeholder": "Blocker escalation dashboard", "general-staff": "Open blockers across the programme" },
  team:       { "initiative-owner": "Full programme team — owner, project managers and EA contact", "senior-stakeholder": "Programme team and EA contact", "general-staff": "Initiative owner" },
  activity:   { "initiative-owner": "Recent activity log — updates, changes and events", "senior-stakeholder": "Recent programme activity", "general-staff": "Recent activity" },
};

// ── Shared atoms ───────────────────────────────────────────────────────────────

/** Large stat card — Senior Stakeholder dashboard style */
function DashStat({ label, value, sub, accent = "bg-white/5 border-white/10", icon: Icon }: {
  label: string; value: string; sub?: string; accent?: string;
  icon?: React.FC<{ className?: string }>;
}) {
  return (
    <div className={`rounded-xl border p-5 ${accent}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

/** Smaller stat card — Owner detail style */
function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className={`rounded-xl border border-white/10 p-4 ${accent ?? "bg-white/5"}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── HEALTH ────────────────────────────────────────────────────────────────────

function HealthSection({ initiative, projects, role }: {
  initiative: Initiative; projects: Project[]; role: LifecycleInsightsRole | null;
}) {
  const days      = daysUntil(initiative.targetDate);
  const spentPct  = initiative.budget ? Math.round((initiative.budgetSpent / initiative.budget) * 100) : 0;
  const redCount  = projects.filter(p => p.rag === "Red").length;
  const amberCount= projects.filter(p => p.rag === "Amber").length;
  const overallRAG: RAGStatus =
    initiative.status === "At Risk" ? "Red" : redCount > 0 ? "Red" : amberCount > 0 ? "Amber" : "Green";

  /* ── Senior: full dashboard ── */
  if (role === "senior-stakeholder") {
    const onTrack = projects.filter(p => p.rag === "Green").length;
    return (
      <div className="space-y-6">
        <div className={`rounded-xl border p-5 flex items-center gap-4 ${RAG_COLORS[overallRAG]}`}>
          <span className={`w-4 h-4 rounded-full flex-shrink-0 ${RAG_DOT[overallRAG]}`} />
          <div>
            <p className="text-lg font-bold">{overallRAG} — Overall Programme Health</p>
            <p className="text-sm opacity-70">{initiative.status} · {initiative.division}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashStat label="Progress"        value={`${initiative.progress}%`} sub="delivery complete"
            accent="bg-teal-500/10 border-teal-500/20" icon={TrendingUp} />
          <DashStat label="EA Alignment"    value={initiative.eaAlignmentScore !== null ? `${initiative.eaAlignmentScore}%` : "TBD"} sub="architecture score" />
          <DashStat label="Days to Target"  value={days < 0 ? `${Math.abs(days)}d` : `${days}d`}
            sub={days < 0 ? "overdue" : "remaining"}
            accent={days < 0 ? "bg-red-500/10 border-red-500/20" : days < 90 ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5"}
            icon={Calendar} />
          <DashStat label="Projects On Track" value={`${onTrack}/${projects.length}`}
            sub={`${redCount} red · ${amberCount} amber`}
            accent={redCount > 0 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"} />
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Overall Progress</span>
            <span className="text-white font-bold">{initiative.progress}%</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-teal-400 rounded-full" style={{ width: `${initiative.progress}%` }} />
          </div>
          <p className="text-xs text-slate-400 pt-1">{initiative.description}</p>
        </div>
      </div>
    );
  }

  /* ── General: simplified ── */
  if (role === "general-staff") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${RAG_COLORS[overallRAG]}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${RAG_DOT[overallRAG]}`} />
            {initiative.status}
          </span>
          <span className="text-slate-400 text-sm">{initiative.division}</span>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
          <p className="text-6xl font-bold text-white mb-1">{initiative.progress}%</p>
          <p className="text-sm text-slate-400">delivery complete</p>
          <div className="mt-5 h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-teal-400 rounded-full" style={{ width: `${initiative.progress}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <p className="text-xs text-slate-400 mb-1">Target Date</p>
            <p className="text-sm font-semibold text-white">{initiative.targetDate}</p>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <p className="text-xs text-slate-400 mb-1">Days Remaining</p>
            <p className={`text-sm font-semibold ${days < 0 ? "text-red-400" : "text-white"}`}>
              {days < 0 ? `${Math.abs(days)} overdue` : `${days} days`}
            </p>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-xs text-slate-400 mb-2">About this initiative</p>
          <p className="text-sm text-slate-300 leading-relaxed">{initiative.description}</p>
        </div>
      </div>
    );
  }

  /* ── Owner: full detail ── */
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${RAG_COLORS[overallRAG]}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${RAG_DOT[overallRAG]}`} />
          {overallRAG} — Overall Health
        </span>
        <span className="text-slate-400 text-sm">{initiative.status}</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Progress"      value={`${initiative.progress}%`} sub="of delivery complete" accent="bg-teal-500/10 border-teal-500/20" />
        <StatCard label="EA Alignment"  value={initiative.eaAlignmentScore !== null ? `${initiative.eaAlignmentScore}%` : "TBD"} />
        <StatCard label="Days to Target" value={days < 0 ? `${Math.abs(days)}d` : `${days}d`} sub={days < 0 ? "overdue" : "remaining"}
          accent={days < 0 ? "bg-red-500/10 border-red-500/20" : days < 90 ? "bg-amber-500/10 border-amber-500/20" : undefined} />
        <StatCard label="Budget Spent"  value={`${spentPct}%`} sub={`${fmt(initiative.budgetSpent)} of ${fmt(initiative.budget)}`} />
      </div>
      <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Progress</p>
        <Progress value={initiative.progress} className="h-3" />
        <div className="flex justify-between text-xs text-slate-400">
          <span>0%</span><span className="text-white font-semibold">{initiative.progress}%</span><span>100%</span>
        </div>
      </div>
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Summary</p>
        <p className="text-sm text-slate-300 leading-relaxed">{initiative.description}</p>
      </div>
      {projects.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{projects.length} Projects — RAG</p>
          <div className="flex items-center gap-3 flex-wrap">
            {(["Green","Amber","Red"] as RAGStatus[]).map(rag => {
              const n = projects.filter(p => p.rag === rag).length;
              if (!n) return null;
              return (
                <span key={rag} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${RAG_COLORS[rag]}`}>
                  <span className={`w-2 h-2 rounded-full ${RAG_DOT[rag]}`} />{n} {rag}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PROJECTS ──────────────────────────────────────────────────────────────────

function ProjectsSection({ projects, isOwner, role, onRefresh }: {
  projects: Project[]; isOwner: boolean;
  role: LifecycleInsightsRole | null; onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!projects.length)
    return <p className="text-slate-400 text-sm text-center py-10">No projects linked to this initiative.</p>;

  /* ── Senior: dashboard ── */
  if (role === "senior-stakeholder") {
    const green = projects.filter(p => p.rag === "Green").length;
    const amber = projects.filter(p => p.rag === "Amber").length;
    const red   = projects.filter(p => p.rag === "Red").length;
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <DashStat label="On Track" value={String(green)} sub="Green RAG" accent="bg-green-500/10 border-green-500/20" />
          <DashStat label="At Risk"  value={String(amber)} sub="Amber RAG" accent={amber > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5"} />
          <DashStat label="Critical" value={String(red)}   sub="Red RAG"   accent={red   > 0 ? "bg-red-500/10 border-red-500/20"   : "bg-white/5"} />
        </div>
        <div className="space-y-2">
          {projects.map(p => (
            <div key={p.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${RAG_DOT[p.rag]}`} />
                <span className="text-sm font-semibold text-white flex-1">{p.name}</span>
                <span className="text-xs text-slate-400">{p.progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${p.rag === "Green" ? "bg-green-400" : p.rag === "Amber" ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ width: `${p.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── General: simple list ── */
  if (role === "general-staff") {
    return (
      <div className="space-y-2">
        {projects.map(p => (
          <div key={p.id} className="bg-white/5 rounded-xl border border-white/10 p-4 flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${RAG_DOT[p.rag]}`} />
            <span className="text-sm text-white flex-1">{p.name}</span>
            <span className="text-xs text-slate-400">{p.progress}% complete</span>
          </div>
        ))}
      </div>
    );
  }

  /* ── Owner: full expandable ── */
  return (
    <div className="space-y-3">
      {projects.map(p => (
        <div key={p.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <button className="w-full text-left flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
            onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${RAG_DOT[p.rag]}`} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{p.name}</p>
              <p className="text-xs text-slate-400">PM: {p.pmName} · {p.progress}% complete</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${RAG_COLORS[p.rag]}`}>{p.rag}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                p.budgetHealth === "On Track" ? "bg-green-500/10 text-green-400" :
                p.budgetHealth === "At Risk"  ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
              }`}>{p.budgetHealth}</span>
              {expanded === p.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>
          {expanded === p.id && (
            <div className="border-t border-white/10 p-4 space-y-3">
              <Progress value={p.progress} className="h-1.5" />
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">Milestones</p>
                {p.milestones.slice(0, 3).map(ms => (
                  <div key={ms.id} className="flex items-center gap-2 py-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${MS_COLORS[ms.status]}`}>{ms.status}</span>
                    <span className="text-xs text-slate-300 truncate flex-1">{ms.name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">{ms.dueDate}</span>
                  </div>
                ))}
              </div>
              {p.blockers.filter(b => !b.resolved).length > 0 && (
                <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium">{p.blockers.filter(b => !b.resolved).length} open blocker(s)</span>
                </div>
              )}
              {isOwner && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Update RAG:</span>
                  {(["Green","Amber","Red"] as RAGStatus[]).map(rag => (
                    <button key={rag}
                      onClick={() => { updateProjectRAG(p.id, rag); onRefresh(); }}
                      className={`px-2 py-0.5 rounded text-xs font-medium border transition-opacity ${p.rag === rag ? "opacity-100" : "opacity-40 hover:opacity-70"} ${RAG_COLORS[rag]}`}>
                      {rag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── BUDGET ────────────────────────────────────────────────────────────────────

function BudgetSection({ initiative, projects, role }: {
  initiative: Initiative; projects: Project[]; role: LifecycleInsightsRole | null;
}) {
  const total     = initiative.budget ?? 0;
  const spent     = initiative.budgetSpent;
  const committed = projects.reduce((s, p) => s + Math.max(0, p.budget - p.budgetSpent), 0);
  const variance  = total - spent - committed;
  const pctSpent  = total > 0 ? (spent / total) * 100 : 0;
  const pctCommit = total > 0 ? (committed / total) * 100 : 0;

  /* ── Senior: stat cards only ── */
  if (role === "senior-stakeholder") {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashStat label="Total Allocated"       value={fmt(total)}         sub="programme budget" />
          <DashStat label="Spent to Date"         value={fmt(spent)}         sub={`${Math.round(pctSpent)}% utilised`} accent="bg-blue-500/10 border-blue-500/20" />
          <DashStat label="Forecast to Complete"  value={fmt(total - spent)} />
          <DashStat label="Variance"              value={fmt(variance)}      sub={variance < 0 ? "over budget" : "under budget"}
            accent={variance < 0 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"} />
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Budget Utilisation</span>
            <span className="text-white font-bold">{Math.round(pctSpent)}%</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, pctSpent)}%` }} />
          </div>
        </div>
      </div>
    );
  }

  /* ── General: no figures ── */
  if (role === "general-staff") {
    return (
      <div className="space-y-5">
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <p className="text-6xl font-bold text-white mb-1">{Math.round(pctSpent)}%</p>
          <p className="text-sm text-slate-400">of programme budget committed</p>
          <div className="mt-5 h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, pctSpent)}%` }} />
          </div>
        </div>
        <p className="text-xs text-slate-500 text-center">
          Detailed financial breakdown is available to programme stakeholders.
        </p>
      </div>
    );
  }

  /* ── Owner: full ── */
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Allocated"      value={fmt(total)} />
        <StatCard label="Spent"                value={fmt(spent)}           accent="bg-blue-500/10 border-blue-500/20" />
        <StatCard label="Forecast to Complete" value={fmt(total - spent)} />
        <StatCard label="Variance"             value={fmt(variance)}
          accent={variance < 0 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"} />
      </div>
      <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Waterfall</p>
        {[
          { label: `Spent (${Math.round(pctSpent)}%)`,  value: fmt(spent),     pct: pctSpent,  color: "bg-blue-500" },
          { label: `Committed (${Math.round(pctCommit)}%)`, value: fmt(committed), pct: pctCommit, color: "bg-teal-400" },
        ].map(bar => (
          <div key={bar.label}>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5"><span>{bar.label}</span><span>{bar.value}</span></div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${Math.min(100, bar.pct)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">By Project</p>
        <div className="space-y-2">
          {projects.map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-xs text-slate-300 flex-1 truncate">{p.name}</span>
              <span className={`text-xs font-medium flex-shrink-0 ${
                p.budgetHealth === "On Track" ? "text-green-400" :
                p.budgetHealth === "At Risk"  ? "text-amber-400" : "text-red-400"
              }`}>{p.budgetHealth}</span>
              <span className="text-xs text-slate-500 w-24 text-right flex-shrink-0">{fmt(p.budget)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MILESTONES ────────────────────────────────────────────────────────────────

function MilestonesSection({ projects, isOwner, role, onRefresh }: {
  projects: Project[]; isOwner: boolean;
  role: LifecycleInsightsRole | null; onRefresh: () => void;
}) {
  const allMs = projects.flatMap(p =>
    p.milestones.map(m => ({ ...m, projectName: p.name, projectId: p.id }))
  );

  /* ── Senior: dashboard counts ── */
  if (role === "senior-stakeholder") {
    const counts: Record<MilestoneStatus, number> = { Complete: 0, "In Progress": 0, "Not Started": 0, Delayed: 0 };
    allMs.forEach(m => counts[m.status]++);
    const total       = allMs.length;
    const completePct = total > 0 ? Math.round((counts.Complete / total) * 100) : 0;
    const delayed     = allMs.filter(m => m.status === "Delayed");
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashStat label="Complete"    value={String(counts.Complete)}       sub={`${completePct}% of total`} accent="bg-green-500/10 border-green-500/20" />
          <DashStat label="In Progress" value={String(counts["In Progress"])} accent="bg-blue-500/10 border-blue-500/20" />
          <DashStat label="Not Started" value={String(counts["Not Started"])} />
          <DashStat label="Delayed"     value={String(counts.Delayed)}        accent={counts.Delayed > 0 ? "bg-red-500/10 border-red-500/20" : "bg-white/5"} />
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Programme Completion</span>
            <span className="text-white font-bold">{completePct}%</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full" style={{ width: `${completePct}%` }} />
          </div>
        </div>
        {delayed.length > 0 && (
          <div className="bg-red-500/5 rounded-xl border border-red-500/20 p-5">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Delayed Milestones</p>
            {delayed.map(m => (
              <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                <span className="text-xs text-red-300 font-medium flex-1">{m.name}</span>
                <span className="text-xs text-slate-400">{m.projectName}</span>
                <span className="text-xs text-red-400">{m.dueDate}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── General: upcoming only ── */
  if (role === "general-staff") {
    const upcoming = allMs
      .filter(m => m.status !== "Complete")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);
    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Next {upcoming.length} upcoming milestones</p>
        {!upcoming.length && <p className="text-slate-400 text-sm text-center py-10">All milestones complete.</p>}
        {upcoming.map(m => (
          <div key={m.id} className="bg-white/5 rounded-xl border border-white/10 p-4 flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${MS_COLORS[m.status]}`}>{m.status}</span>
            <span className="text-sm text-white flex-1">{m.name}</span>
            <span className="text-xs text-slate-400 flex-shrink-0">{m.dueDate}</span>
          </div>
        ))}
      </div>
    );
  }

  /* ── Owner: full list with controls ── */
  return (
    <div className="space-y-3">
      {!allMs.length && <p className="text-slate-400 text-sm text-center py-10">No milestones found.</p>}
      {allMs.map(ms => (
        <div key={ms.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="flex items-start gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${MS_COLORS[ms.status]}`}>{ms.status}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{ms.name}</p>
              <p className="text-xs text-slate-400">{ms.projectName} · Due {ms.dueDate}</p>
              {ms.owner && <p className="text-xs text-slate-500">Owner: {ms.owner}</p>}
            </div>
            {isOwner && ms.status !== "Complete" && (
              <button onClick={() => { updateMilestoneStatus(ms.projectId, ms.id, "Complete"); onRefresh(); }}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium flex-shrink-0 px-2 py-1 rounded hover:bg-teal-500/10 transition-colors">
                Mark Complete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── RISKS ─────────────────────────────────────────────────────────────────────

function RisksSection({ projects, role }: {
  projects: Project[]; role: LifecycleInsightsRole | null;
}) {
  const SEV_ORDER = ["Critical","High","Medium","Low"];
  const allRisks  = projects
    .flatMap(p => p.risks.map(r => ({ ...r, projectName: p.name })))
    .sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity));

  if (!allRisks.length)
    return (
      <div className="text-center py-16">
        <Shield className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" />
        <p className="text-slate-400 text-sm">No risks logged at programme level.</p>
      </div>
    );

  /* ── Senior: severity dashboard ── */
  if (role === "senior-stakeholder") {
    const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    allRisks.forEach(r => counts[r.severity]++);
    const topRisks = allRisks.filter(r => r.severity === "Critical" || r.severity === "High").slice(0, 3);
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashStat label="Critical" value={String(counts.Critical)} accent={counts.Critical > 0 ? "bg-red-500/10 border-red-500/20"    : "bg-white/5"} />
          <DashStat label="High"     value={String(counts.High)}     accent={counts.High     > 0 ? "bg-orange-500/10 border-orange-500/20" : "bg-white/5"} />
          <DashStat label="Medium"   value={String(counts.Medium)}   accent={counts.Medium   > 0 ? "bg-amber-500/10 border-amber-500/20"  : "bg-white/5"} />
          <DashStat label="Low"      value={String(counts.Low)} />
        </div>
        {topRisks.length > 0 && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Top Risks</p>
            {topRisks.map(r => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${SEV_COLORS[r.severity]}`}>{r.severity}</span>
                <span className="text-sm text-white flex-1">{r.title}</span>
                <span className="text-xs text-slate-400">{r.projectName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── General: title + severity only ── */
  if (role === "general-staff") {
    return (
      <div className="space-y-2">
        {allRisks.map(r => (
          <div key={r.id} className="bg-white/5 rounded-xl border border-white/10 p-4 flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${SEV_COLORS[r.severity]}`}>{r.severity}</span>
            <span className="text-sm text-white">{r.title}</span>
          </div>
        ))}
      </div>
    );
  }

  /* ── Owner: full detail ── */
  return (
    <div className="space-y-3">
      {allRisks.map(r => (
        <div key={r.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="flex items-start gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${SEV_COLORS[r.severity]}`}>{r.severity}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{r.title}</p>
              <p className="text-xs text-slate-500">{r.projectName}</p>
              <p className="text-xs text-slate-400 mt-1">{r.impact}</p>
              <p className="text-xs text-teal-400 mt-1"><span className="font-medium">Mitigation:</span> {r.mitigation}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                <span>Owner: {r.owner}</span><span>·</span>
                <span>Due: {r.mitigationDueDate}</span><span>·</span>
                <span className={r.status === "Open" ? "text-red-400" : "text-green-400"}>{r.status}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── BLOCKERS ──────────────────────────────────────────────────────────────────

function BlockersSection({ projects, role }: {
  projects: Project[]; role: LifecycleInsightsRole | null;
}) {
  const allBlockers = projects.flatMap(p =>
    p.blockers.filter(b => !b.resolved).map(b => ({ ...b, projectName: p.name }))
  );

  if (!allBlockers.length)
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" />
        <p className="text-slate-400 text-sm">No open blockers across this programme.</p>
      </div>
    );

  /* ── Senior: escalation dashboard ── */
  if (role === "senior-stakeholder") {
    const notEsc  = allBlockers.filter(b => b.escalationStatus === "Not Escalated").length;
    const toTO    = allBlockers.filter(b => b.escalationStatus === "Escalated to TO").length;
    const toDH    = allBlockers.filter(b => b.escalationStatus === "Escalated to Division Head").length;
    const escalated = allBlockers.filter(b => b.escalationStatus !== "Not Escalated");
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <DashStat label="Open"                 value={String(notEsc)} sub="not escalated" />
          <DashStat label="Escalated to TO"       value={String(toTO)}  accent={toTO > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5"} />
          <DashStat label="Escalated to Div Head" value={String(toDH)}  accent={toDH > 0 ? "bg-red-500/10 border-red-500/20"    : "bg-white/5"} />
        </div>
        {escalated.length > 0 && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Escalated Items</p>
            {escalated.map(b => (
              <div key={b.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${ESC_COLORS[b.escalationStatus]}`}>
                  {b.escalationStatus.replace("Escalated to ","")}
                </span>
                <span className="text-sm text-white">{b.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── General: title + escalation badge ── */
  if (role === "general-staff") {
    return (
      <div className="space-y-2">
        {allBlockers.map(b => (
          <div key={b.id} className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-4 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-sm text-white flex-1">{b.title}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${ESC_COLORS[b.escalationStatus]}`}>
              {b.escalationStatus === "Not Escalated" ? "Open" : b.escalationStatus.replace("Escalated to ","→ ")}
            </span>
          </div>
        ))}
      </div>
    );
  }

  /* ── Owner: full detail ── */
  return (
    <div className="space-y-3">
      {allBlockers.map(b => (
        <div key={b.id} className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{b.title}</p>
              <p className="text-xs text-slate-400">{b.projectName} · Raised {b.dateRaised} by {b.raisedBy}</p>
              <p className="text-xs text-slate-300 mt-1">Needed: {b.whatIsNeeded}</p>
              <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-medium ${ESC_COLORS[b.escalationStatus]}`}>
                {b.escalationStatus}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── TEAM ──────────────────────────────────────────────────────────────────────

function TeamSection({ initiative, projects, role }: {
  initiative: Initiative; projects: Project[]; role: LifecycleInsightsRole | null;
}) {
  const pms = [...new Set(projects.map(p => p.pmName))].filter(Boolean);

  /* ── General: owner only ── */
  if (role === "general-staff") {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Initiative Owner</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-base font-bold text-teal-300">
            {initiative.owner.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{initiative.owner}</p>
            <p className="text-xs text-slate-400">Programme Manager · {initiative.division}</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Senior & Owner: full team ── */
  return (
    <div className="space-y-4">
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Initiative Owner</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-base font-bold text-teal-300">
            {initiative.owner.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{initiative.owner}</p>
            <p className="text-xs text-slate-400">Programme Manager</p>
          </div>
        </div>
      </div>
      {pms.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Project Managers</p>
          <div className="space-y-3">
            {pms.map(pm => (
              <div key={pm} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-300">
                  {pm.charAt(0)}
                </div>
                <span className="text-sm text-slate-300">{pm}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">EA Office Contact</p>
        <p className="text-sm text-white">Corporate EA Office</p>
        <p className="text-xs text-slate-400">TO Assigned Member · DTMP Programme Team</p>
      </div>
    </div>
  );
}

// ── ACTIVITY ──────────────────────────────────────────────────────────────────

function ActivitySection({ initiative, role }: {
  initiative: Initiative; role: LifecycleInsightsRole | null;
}) {
  const events = [
    { time: initiative.updatedAt,                                    actor: "System",        action: "Initiative data last updated",    note: "" },
    { time: new Date(Date.now() - 2  * 86400000).toISOString(),     actor: initiative.owner, action: "Progress updated",                note: `${initiative.progress}% complete` },
    { time: new Date(Date.now() - 5  * 86400000).toISOString(),     actor: "TO Team",        action: "EA alignment score updated",      note: `${initiative.eaAlignmentScore ?? "TBD"}%` },
    { time: new Date(Date.now() - 10 * 86400000).toISOString(),     actor: "System",         action: "Initiative status",               note: initiative.status },
  ];
  const shown = role === "general-staff" ? events.slice(0, 2) : events;
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/5">
      {shown.map((ev, i) => (
        <div key={i} className="flex gap-4 p-4">
          <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200">
              <span className="font-medium">{ev.actor}</span> · {ev.action}
              {ev.note && <span className="text-slate-400"> — {ev.note}</span>}
            </p>
            <p className="text-xs text-slate-500">{new Date(ev.time).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function LCInsightsPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const initiative = useMemo(() => getInitiatives().find(i => i.id === id) ?? null, [id]);
  const [projects,        setProjects]        = useState<Project[]>(() => id ? getProjects(id) : []);
  const [activeSection,   setActiveSection]   = useState<InsightSection>("health");
  const [role,            setRole]            = useState<LifecycleInsightsRole | null>(() => getLifecycleRole());
  const [roleModalOpen,   setRoleModalOpen]   = useState(false);
  const [serviceModalOpen,setServiceModalOpen]= useState(false);
  const [serviceType,     setServiceType]     = useState<LCServiceType>(INITIATIVE_LEVEL_SERVICES[0]);
  const [servicePriority, setServicePriority] = useState<"Critical"|"High"|"Medium"|"Low">("Medium");
  const [serviceNotes,    setServiceNotes]    = useState("");

  useEffect(() => {
    if (!isUserAuthenticated()) navigate(`/marketplaces/lifecycle-management/initiative/${id}`);
  }, [id, navigate]);

  const refresh  = () => setProjects(id ? getProjects(id) : []);
  const isOwner  = role === "initiative-owner";
  const account  = role ? getDemoAccount(role) : null;

  const openRequestService = () => {
    setServiceType(INITIATIVE_LEVEL_SERVICES[0]);
    setServicePriority("Medium");
    setServiceNotes("");
    setServiceModalOpen(true);
  };

  const submitServiceRequest = () => {
    if (!initiative) return;
    const r = role ?? "general-staff";
    const acc = getDemoAccount(r);
    addLCRequest({
      serviceType, initiativeId: initiative.id, initiativeName: initiative.name,
      submittedBy: acc.name, submittedByRole: LIFECYCLE_ROLE_LABELS[r],
      status: "Submitted", priority: servicePriority,
      notes: serviceNotes.trim() || undefined, slaHours: LC_SERVICE_SLA[serviceType],
    });
    setServiceModalOpen(false);
    toast({ title: "Service request submitted", description: "Saved to your Stage 2 tracker." });
    navigate("/stage2/lifecycle-management");
  };

  if (!initiative) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg font-semibold mb-4">Initiative not found</p>
          <button onClick={() => navigate("/marketplaces/lifecycle-management")}
            className="text-teal-400 hover:text-teal-300 text-sm underline">
            Back to Lifecycle Management
          </button>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "health":     return <HealthSection     initiative={initiative} projects={projects} role={role} />;
      case "projects":   return <ProjectsSection   projects={projects} isOwner={isOwner} role={role} onRefresh={refresh} />;
      case "budget":     return <BudgetSection     initiative={initiative} projects={projects} role={role} />;
      case "milestones": return <MilestonesSection projects={projects} isOwner={isOwner} role={role} onRefresh={refresh} />;
      case "risks":      return <RisksSection      projects={projects} role={role} />;
      case "blockers":   return <BlockersSection   projects={projects} role={role} />;
      case "team":       return <TeamSection       initiative={initiative} projects={projects} role={role} />;
      case "activity":   return <ActivitySection   initiative={initiative} role={role} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      {/* Top bar */}
      <div className="bg-slate-900 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/marketplaces/lifecycle-management/initiative/${id}`)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />Back to Initiative
            </button>
            <span className="text-slate-600">·</span>
            <p className="text-sm text-white font-semibold line-clamp-1">{initiative.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {role && account && (
              <span className="text-xs text-slate-400 hidden sm:block">
                Viewing as <span className="text-teal-400 font-medium">{LIFECYCLE_ROLE_LABELS[role]}</span> — {account.name}
              </span>
            )}
            <button onClick={() => setRoleModalOpen(true)}
              className="text-xs text-teal-400 hover:text-teal-300 px-3 py-1.5 rounded-lg border border-teal-500/30 hover:border-teal-400/50 transition-colors">
              {role ? "Change role" : "Select role"}
            </button>
          </div>
        </div>
      </div>

      {/* Section nav */}
      <div className="bg-slate-900/50 border-b border-white/10 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {SECTIONS.map(({ id: sId, label, icon: Icon }) => (
              <button key={sId} onClick={() => setActiveSection(sId)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeSection === sId
                    ? "border-teal-400 text-teal-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">
                {SECTIONS.find(s => s.id === activeSection)?.label}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {role ? SECTION_DESC[activeSection][role] : "Select a role to see role-appropriate insights"}
              </p>
            </div>
            {renderSection()}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-28 bg-slate-900 border border-white/10 rounded-xl p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Initiative</p>
                <h3 className="text-sm font-bold text-white leading-snug mb-1">{initiative.name}</h3>
                <p className="text-xs text-slate-400">{initiative.division}</p>
              </div>
              <div className="border-t border-white/10" />
              <div className="space-y-2.5">
                {[
                  { label: "Status",       value: initiative.status },
                  { label: "Owner",        value: initiative.owner },
                  { label: "Type",         value: initiative.type },
                  { label: "Target Date",  value: initiative.targetDate },
                  { label: "EA Alignment", value: initiative.eaAlignmentScore !== null ? `${initiative.eaAlignmentScore}%` : "TBD" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
                    <span className="text-xs text-slate-300 text-right font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-white font-semibold">{initiative.progress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 rounded-full" style={{ width: `${initiative.progress}%` }} />
                </div>
              </div>
              <div className="border-t border-white/10" />
              <button onClick={openRequestService}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors">
                <FileText className="w-4 h-4" />Request Service
              </button>
              <p className="text-xs text-slate-500 text-center">
                Viewing as <span className="text-teal-400">{role ? LIFECYCLE_ROLE_LABELS[role] : "Guest"}</span>
              </p>
            </div>
          </aside>
        </div>
      </div>

      {roleModalOpen && (
        <LCInsightsLoginModal
          onSuccess={r => { setRole(r); setRoleModalOpen(false); }}
          onClose={() => setRoleModalOpen(false)}
        />
      )}

      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Service</DialogTitle>
            <DialogDescription>Submit an initiative-level service request to the TO team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-0.5">Initiative</p>
              <p className="text-sm font-semibold text-slate-900">{initiative.name}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Service Type</label>
                <Select value={serviceType} onValueChange={v => setServiceType(v as LCServiceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INITIATIVE_LEVEL_SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Priority</label>
                <Select value={servicePriority} onValueChange={v => setServicePriority(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Critical","High","Medium","Low"] as const).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">SLA (hours)</label>
                <Input value={String(LC_SERVICE_SLA[serviceType])} readOnly />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Notes (optional)</label>
                <Textarea value={serviceNotes} onChange={e => setServiceNotes(e.target.value)} placeholder="What do you need from the TO team?" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceModalOpen(false)}>Cancel</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submitServiceRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
