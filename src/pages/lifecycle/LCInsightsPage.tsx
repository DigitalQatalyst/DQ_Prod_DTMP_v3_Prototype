import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, ArrowLeft, BarChart2, Calendar,
  CheckCircle2, ChevronDown, ChevronUp, Clock, DollarSign, FileText,
  Flag, Shield, TrendingUp, Users, Zap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { LCInsightsLoginModal } from "@/components/lifecycle/LCInsightsLoginModal";
import { isUserAuthenticated } from "@/data/sessionAuth";
import {
  INITIATIVE_LEVEL_SERVICES, LC_SERVICE_SLA, addEscalation, addLCRequest,
  getLCRequestsByInitiative, type LCServiceType,
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
import {
  getInitiatives, getProjects, resolveBlocker, updateBlockerEscalation,
  updateInitiativeBudgetSpent, updateInitiativeStatus, updateMilestoneStatus,
  updateProjectRAG, updateRiskStatus,
  type Initiative, type Project, type RAGStatus, type MilestoneStatus,
} from "@/data/shared/lifecyclePortfolioStore";
import { addActivityEvent, getActivityEvents, type ActivityEvent } from "@/data/shared/activityEventStore";
import {
  getLifecycleRole, getDemoAccount, type LifecycleInsightsRole, LIFECYCLE_ROLE_LABELS,
} from "@/data/shared/lifecycleRole";

// ── Helpers ────────────────────────────────────────────────────────────────────

const RAG_COLORS: Record<RAGStatus, string> = {
  Green: "bg-green-500/20 text-green-300 border-green-500/30",
  Amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Red:   "bg-red-500/20 text-red-300 border-red-500/30",
};

const SECTION_DESC: Record<InsightSection, Record<LifecycleInsightsRole, string>> = {
  health:     { "initiative-owner": "Is this initiative under control? Review governed health, delivery pressure, risks, blockers, budget use, and overall progress.", "senior-stakeholder": "Is the programme healthy enough to stay on course? Review executive health signals at a glance.", "general-staff": "What is the current initiative status and how far through delivery are we?" },
  projects:   { "initiative-owner": "Which delivery workstreams are moving the initiative outcome? Review every linked project with live RAG, milestones, risks, and blockers.", "senior-stakeholder": "Which projects are carrying delivery risk and which ones remain on track?", "general-staff": "Which projects sit under this initiative?" },
  budget:     { "initiative-owner": "Are we financially on track? Review allocation, spend, commitments, variance, and intervention signals across projects.", "senior-stakeholder": "What is the executive budget position for this initiative?", "general-staff": "How much of the initiative budget has been used?" },
  milestones: { "initiative-owner": "What is due, delayed, or complete across the initiative? Review milestone movement and schedule pressure.", "senior-stakeholder": "Which milestones are complete and which ones need attention?", "general-staff": "What milestones are coming up next?" },
  risks:      { "initiative-owner": "What could derail delivery? Review the governed risk register, mitigation posture, and support needs.", "senior-stakeholder": "Which risks matter most right now?", "general-staff": "What major risks are currently recorded?" },
  blockers:   { "initiative-owner": "What needs intervention now? Review open blockers, escalation status, and what is required to unblock delivery.", "senior-stakeholder": "Which blockers are escalated and where is intervention required?", "general-staff": "What blockers are currently affecting this initiative?" },
  team:       { "initiative-owner": "Who is accountable for delivery? Review programme leadership, project ownership, workload, and EA support context.", "senior-stakeholder": "Who owns delivery and who supports governance?", "general-staff": "Who is leading this initiative?" },
  activity:   { "initiative-owner": "What has happened and what evidence exists? Review the initiative's governed activity history and support actions.", "senior-stakeholder": "What recent activity should leadership know about?", "general-staff": "What has happened recently on this initiative?" },
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

const relTime = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7)  return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} week${Math.floor(d / 7) > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
};

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

const LEGACY_SECTION_DESC: Record<InsightSection, Record<LifecycleInsightsRole, string>> = {
  health:     { "initiative-owner": "Full programme health — RAG, all metrics, budget utilisation, open risks and blockers, project summary", "senior-stakeholder": "Executive health dashboard — key numbers at a glance", "general-staff": "Initiative status and overall progress" },
  projects:   { "initiative-owner": "All linked projects — expand any row for milestones, budget, open risks and blockers, with live RAG controls", "senior-stakeholder": "Project health overview — RAG distribution and progress bars", "general-staff": "Projects linked to this initiative" },
  budget:     { "initiative-owner": "Full budget breakdown — allocation, spend, committed, variance and per-project health with visual bars", "senior-stakeholder": "Budget headline — total, spend and variance", "general-staff": "Budget utilisation summary" },
  milestones: { "initiative-owner": "Full milestone tracker grouped by status — delayed first, with days-overdue counters and Mark Complete controls", "senior-stakeholder": "Milestone completion dashboard — counts and overdue alerts", "general-staff": "Upcoming milestones across the programme" },
  risks:      { "initiative-owner": "Full risk register grouped by severity — expand any risk for likelihood, impact, mitigation plan, owner and due date", "senior-stakeholder": "Risk severity breakdown — critical and high items surfaced", "general-staff": "Risks identified on this programme" },
  blockers:   { "initiative-owner": "Open blockers grouped by escalation level — each with days open, what is needed, and the raising party", "senior-stakeholder": "Blocker escalation dashboard", "general-staff": "Open blockers across the programme" },
  team:       { "initiative-owner": "Full programme team — PM per project, active milestone workload, EA contact, division context", "senior-stakeholder": "Programme team and EA contact", "general-staff": "Initiative owner" },
  activity:   { "initiative-owner": "Full activity log — milestones, risk events, blocker escalations, budget updates and status changes", "senior-stakeholder": "Recent programme activity", "general-staff": "Recent activity" },
};

// ── Shared atoms ───────────────────────────────────────────────────────────────

void LEGACY_SECTION_DESC;

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

function HealthSection({ initiative, projects, role, onInitiativeStatusChange }: {
  initiative: Initiative; projects: Project[]; role: LifecycleInsightsRole | null;
  onInitiativeStatusChange: (status: string) => void;
}) {
  const days       = daysUntil(initiative.targetDate);
  const spentPct   = initiative.budget ? Math.round((initiative.budgetSpent / initiative.budget) * 100) : 0;
  const redCount   = projects.filter(p => p.rag === "Red").length;
  const amberCount = projects.filter(p => p.rag === "Amber").length;
  const overallRAG: RAGStatus =
    initiative.status === "At Risk" ? "Red" : redCount > 0 ? "Red" : amberCount > 0 ? "Amber" : "Green";

  /* ── Senior: dashboard ── */
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
          <DashStat label="Progress"          value={`${initiative.progress}%`} sub="delivery complete" accent="bg-teal-500/10 border-teal-500/20" icon={TrendingUp} />
          <DashStat label="EA Alignment"      value={initiative.eaAlignmentScore !== null ? `${initiative.eaAlignmentScore}%` : "TBD"} sub="architecture score" />
          <DashStat label="Days to Target"    value={days < 0 ? `${Math.abs(days)}d` : `${days}d`}
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

  /* ── Owner: full operational cockpit ── */
  const allMs          = projects.flatMap(p => p.milestones);
  const completedMs    = allMs.filter(m => m.status === "Complete").length;
  const delayedMs      = allMs.filter(m => m.status === "Delayed").length;
  const openRisks      = projects.flatMap(p => p.risks).filter(r => r.status === "Open").length;
  const criticalRisks  = projects.flatMap(p => p.risks).filter(r => r.severity === "Critical" && r.status === "Open").length;
  const openBlockers   = projects.flatMap(p => p.blockers).filter(b => !b.resolved).length;
  const escalatedB     = projects.flatMap(p => p.blockers).filter(b => !b.resolved && b.escalationStatus !== "Not Escalated").length;

  const attentionItems: { label: string; level: "red" | "amber" }[] = [];
  if (redCount > 0) attentionItems.push({ label: `${redCount} project${redCount > 1 ? "s" : ""} in Red RAG — delivery at risk`, level: "red" });
  if (criticalRisks > 0) attentionItems.push({ label: `${criticalRisks} critical risk${criticalRisks > 1 ? "s" : ""} open — mitigation required`, level: "red" });
  if (escalatedB > 0) attentionItems.push({ label: `${escalatedB} blocker${escalatedB > 1 ? "s" : ""} escalated — exec action needed`, level: "amber" });
  if (delayedMs > 0) attentionItems.push({ label: `${delayedMs} milestone${delayedMs > 1 ? "s" : ""} delayed — schedule impact likely`, level: "amber" });
  if (days < 0) attentionItems.push({ label: `Programme is ${Math.abs(days)} days past target date`, level: "red" });

  return (
    <div className="space-y-5">
      {/* RAG banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-4 ${RAG_COLORS[overallRAG]}`}>
        <span className={`w-4 h-4 rounded-full flex-shrink-0 ${RAG_DOT[overallRAG]}`} />
        <div className="flex-1 min-w-0">
          <p className="font-bold">{overallRAG} — Overall Programme Health</p>
          <p className="text-xs opacity-70 mt-0.5">{initiative.status} · {initiative.division} · {initiative.type}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Initiative Status:</span>
        <select
          value={initiative.status}
          onChange={(e) => onInitiativeStatusChange(e.target.value)}
          className="bg-slate-800 border border-white/10 text-white text-xs rounded px-2 py-1"
        >
          {["Active", "Scoping", "At Risk", "On Hold", "Completed"].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Attention Required */}
      {attentionItems.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Attention Required</p>
          <div className="space-y-2">
            {attentionItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${item.level === "red" ? "text-red-400" : "text-amber-400"}`} />
                <span className={`text-sm ${item.level === "red" ? "text-red-300" : "text-amber-300"}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Overall Progress"  value={`${initiative.progress}%`} sub="of delivery complete"
          accent="bg-teal-500/10 border-teal-500/20" />
        <StatCard label="EA Alignment"      value={initiative.eaAlignmentScore !== null ? `${initiative.eaAlignmentScore}%` : "TBD"}
          sub="architecture score" />
        <StatCard label="Days to Target"    value={days < 0 ? `${Math.abs(days)}d` : `${days}d`}
          sub={days < 0 ? "overdue" : "remaining"}
          accent={days < 0 ? "bg-red-500/10 border-red-500/20" : days < 90 ? "bg-amber-500/10 border-amber-500/20" : undefined} />
        <StatCard label="Budget Utilised"   value={`${spentPct}%`}
          sub={`${fmt(initiative.budgetSpent)} of ${fmt(initiative.budget)}`} />
        <StatCard label="Open Risks"        value={String(openRisks)}
          sub={criticalRisks > 0 ? `${criticalRisks} critical` : "none critical"}
          accent={criticalRisks > 0 ? "bg-red-500/10 border-red-500/20" : undefined} />
        <StatCard label="Open Blockers"     value={String(openBlockers)}
          sub={escalatedB > 0 ? `${escalatedB} escalated` : "none escalated"}
          accent={escalatedB > 0 ? "bg-amber-500/10 border-amber-500/20" : undefined} />
      </div>

      {/* Delivery progress bar */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delivery Progress</p>
          <span className="text-sm font-bold text-white">{initiative.progress}%</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-teal-400 rounded-full" style={{ width: `${initiative.progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>{completedMs}/{allMs.length} milestones complete</span>
          <span>{delayedMs > 0 ? `${delayedMs} delayed` : "No milestone delays"}</span>
        </div>
      </div>

      {/* Project health table */}
      {projects.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            {projects.length} Projects — Health Summary
          </p>
          <div className="space-y-3">
            {projects.map(p => {
              const pOpenRisks   = p.risks.filter(r => r.status === "Open").length;
              const pOpenBlockers = p.blockers.filter(b => !b.resolved).length;
              return (
                <div key={p.id} className="border-b border-white/5 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${RAG_DOT[p.rag]}`} />
                    <span className="text-sm text-white flex-1 font-medium">{p.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${RAG_COLORS[p.rag]}`}>{p.rag}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-5">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.rag === "Green" ? "bg-green-400" : p.rag === "Amber" ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right flex-shrink-0">{p.progress}%</span>
                    {pOpenRisks > 0 && <span className="text-xs text-red-400 flex-shrink-0">{pOpenRisks}R</span>}
                    {pOpenBlockers > 0 && <span className="text-xs text-amber-400 flex-shrink-0">{pOpenBlockers}B</span>}
                  </div>
                  <p className="text-xs text-slate-500 ml-5 mt-1">PM: {p.pmName} · {p.budgetHealth}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Programme summary */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Programme Summary</p>
        <p className="text-sm text-slate-300 leading-relaxed">{initiative.description}</p>
        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-slate-500">Owner: </span><span className="text-slate-300">{initiative.owner}</span></div>
          <div><span className="text-slate-500">Type: </span><span className="text-slate-300">{initiative.type}</span></div>
          <div><span className="text-slate-500">Division: </span><span className="text-slate-300">{initiative.division}</span></div>
          <div><span className="text-slate-500">Target: </span><span className="text-slate-300">{initiative.targetDate}</span></div>
        </div>
      </div>
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

  /* ── Owner: rich expandable ── */
  const greenN = projects.filter(p => p.rag === "Green").length;
  const amberN = projects.filter(p => p.rag === "Amber").length;
  const redN   = projects.filter(p => p.rag === "Red").length;

  return (
    <div className="space-y-3">
      {/* Summary pill row */}
      <div className="flex items-center gap-4 text-xs px-1 pb-1">
        <span className="text-slate-500">{projects.length} projects</span>
        {greenN > 0 && <span className="text-green-400 font-medium">{greenN} on track</span>}
        {amberN > 0 && <span className="text-amber-400 font-medium">{amberN} at risk</span>}
        {redN   > 0 && <span className="text-red-400 font-medium">{redN} critical</span>}
        <span className="text-slate-600 ml-auto">Click a row to expand</span>
      </div>

      {projects.map(p => {
        const pBudgetPct    = p.budget > 0 ? (p.budgetSpent / p.budget) * 100 : 0;
        const openRisks     = p.risks.filter(r => r.status === "Open");
        const openBlockers  = p.blockers.filter(b => !b.resolved);
        const completedMs   = p.milestones.filter(m => m.status === "Complete").length;
        const delayedMs     = p.milestones.filter(m => m.status === "Delayed");
        const isExp         = expanded === p.id;

        return (
          <div key={p.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            {/* Collapsed header */}
            <button
              className="w-full text-left flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
              onClick={() => setExpanded(isExp ? null : p.id)}
            >
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${RAG_DOT[p.rag]}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 flex-wrap">
                  <span>PM: {p.pmName}</span>
                  <span>·</span>
                  <span>{completedMs}/{p.milestones.length} milestones</span>
                  {delayedMs.length > 0 && (
                    <span className="text-red-400">· {delayedMs.length} delayed</span>
                  )}
                  {openBlockers.length > 0 && (
                    <span className="text-amber-400">· {openBlockers.length} blocker{openBlockers.length > 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${RAG_COLORS[p.rag]}`}>{p.rag}</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                  p.budgetHealth === "On Track" ? "bg-green-500/10 text-green-400" :
                  p.budgetHealth === "At Risk"  ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                }`}>{p.budgetHealth}</span>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {/* Mini progress bar always visible */}
            <div className="px-4 pb-3 -mt-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.rag === "Green" ? "bg-green-400" : p.rag === "Amber" ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{p.progress}%</span>
              </div>
            </div>

            {/* Expanded detail */}
            {isExp && (
              <div className="border-t border-white/10 p-4 space-y-5">

                {/* Budget */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider">Budget</span>
                    <span className="text-white font-medium">
                      {fmt(p.budgetSpent)}{" "}
                      <span className="text-slate-500 font-normal">of {fmt(p.budget)}</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pBudgetPct > 90 ? "bg-red-500" : pBudgetPct > 70 ? "bg-amber-400" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(100, pBudgetPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{Math.round(pBudgetPct)}% utilised</span>
                    <span>{fmt(p.budget - p.budgetSpent)} remaining</span>
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Milestones ({p.milestones.length})
                  </p>
                  <div className="space-y-1.5">
                    {p.milestones.map(ms => (
                      <div key={ms.id} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${MS_COLORS[ms.status]}`}>
                          {ms.status}
                        </span>
                        <span className="text-xs text-slate-300 flex-1 min-w-0 truncate">{ms.name}</span>
                        {ms.owner && (
                          <span className="text-xs text-slate-500 hidden sm:block flex-shrink-0">{ms.owner}</span>
                        )}
                        <span className="text-xs text-slate-500 flex-shrink-0">{ms.dueDate}</span>
                        {ms.status === "Delayed" && (
                          <span className="text-xs text-red-400 font-medium flex-shrink-0">
                            {Math.abs(daysUntil(ms.dueDate))}d late
                          </span>
                        )}
                        {isOwner && ms.status !== "Complete" && (
                          <button
                            onClick={() => { updateMilestoneStatus(p.id, ms.id, "Complete"); onRefresh(); }}
                            className="text-xs text-teal-400 hover:text-teal-300 px-1.5 py-0.5 rounded hover:bg-teal-500/10 transition-colors flex-shrink-0 font-medium"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Risks */}
                {openRisks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Open Risks ({openRisks.length})
                    </p>
                    <div className="space-y-2">
                      {openRisks.map(r => (
                        <div key={r.id} className="flex items-start gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${SEV_COLORS[r.severity]}`}>
                            {r.severity}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300 font-medium">{r.title}</p>
                            <p className="text-xs text-slate-500 truncate">Mitigation: {r.mitigation}</p>
                            <p className="text-xs text-slate-500">Owner: {r.owner} · Due {r.mitigationDueDate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Open Blockers */}
                {openBlockers.length > 0 && (
                  <div className="bg-amber-500/5 rounded-lg border border-amber-500/20 p-3">
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                      Open Blockers ({openBlockers.length})
                    </p>
                    <div className="space-y-3">
                      {openBlockers.map(b => (
                        <div key={b.id}>
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span className="text-xs font-medium text-amber-200 flex-1">{b.title}</span>
                            <span className={`ml-auto px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${ESC_COLORS[b.escalationStatus]}`}>
                              {b.escalationStatus === "Not Escalated" ? "Open" : b.escalationStatus.replace("Escalated to ", "")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 ml-5">Needed: {b.whatIsNeeded}</p>
                          <p className="text-xs text-slate-500 ml-5">Raised by {b.raisedBy} · {b.dateRaised}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RAG update controls */}
                {isOwner && (
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <span className="text-xs text-slate-500">Update RAG:</span>
                    {(["Green", "Amber", "Red"] as RAGStatus[]).map(rag => (
                      <button
                        key={rag}
                        onClick={() => { updateProjectRAG(p.id, rag); onRefresh(); }}
                        className={`px-2 py-0.5 rounded text-xs font-medium border transition-opacity ${
                          p.rag === rag ? "opacity-100" : "opacity-40 hover:opacity-70"
                        } ${RAG_COLORS[rag]}`}
                      >
                        {rag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── BUDGET ────────────────────────────────────────────────────────────────────

function BudgetSection({
  initiative,
  projects,
  role,
  budgetEditOpen,
  budgetSpentInput,
  onBudgetSpentInputChange,
  onBudgetEditOpenChange,
  onSaveBudgetSpent,
}: {
  initiative: Initiative; projects: Project[]; role: LifecycleInsightsRole | null;
  budgetEditOpen: boolean;
  budgetSpentInput: string;
  onBudgetSpentInputChange: (value: string) => void;
  onBudgetEditOpenChange: (open: boolean) => void;
  onSaveBudgetSpent: () => void;
}) {
  const total     = initiative.budget ?? 0;
  const spent     = initiative.budgetSpent;
  const committed = projects.reduce((s, p) => s + Math.max(0, p.budget - p.budgetSpent), 0);
  const variance  = total - spent - committed;
  const pctSpent  = total > 0 ? (spent / total) * 100 : 0;
  const pctCommit = total > 0 ? (committed / total) * 100 : 0;

  /* ── Senior ── */
  if (role === "senior-stakeholder") {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashStat label="Total Allocated"      value={fmt(total)}         sub="programme budget" />
          <DashStat label="Spent to Date"        value={fmt(spent)}         sub={`${Math.round(pctSpent)}% utilised`} accent="bg-blue-500/10 border-blue-500/20" />
          <DashStat label="Forecast to Complete" value={fmt(total - spent)} />
          <DashStat label="Variance"             value={fmt(variance)}      sub={variance < 0 ? "over budget" : "under budget"}
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

  /* ── General ── */
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
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Allocated"      value={fmt(total)}
          sub={`${projects.length} project${projects.length !== 1 ? "s" : ""} in scope`} />
        <StatCard label="Spent to Date"        value={fmt(spent)}
          sub={`${Math.round(pctSpent)}% utilised`} accent="bg-blue-500/10 border-blue-500/20" />
        <StatCard label="Committed Remaining"  value={fmt(committed)}
          sub={`${Math.round(pctCommit)}% of total`} accent="bg-teal-500/10 border-teal-500/20" />
        <StatCard label="Variance"             value={variance >= 0 ? fmt(variance) : `(${fmt(Math.abs(variance))})`}
          sub={variance < 0 ? "over budget — action needed" : "available headroom"}
          accent={variance < 0 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"} />
      </div>

      {/* Budget waterfall */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Waterfall</p>
        {[
          { label: "Spent",                      value: fmt(spent),                    pct: pctSpent,  color: "bg-blue-500",    note: `${Math.round(pctSpent)}% of total` },
          { label: "Committed (not yet spent)",  value: fmt(committed),                pct: pctCommit, color: "bg-teal-400",    note: `${Math.round(pctCommit)}% of total` },
          { label: "Available Headroom",         value: fmt(Math.max(0, variance)),    pct: Math.max(0, (variance / (total || 1)) * 100), color: "bg-green-500/60", note: variance < 0 ? "⚠ over budget" : `${Math.round(Math.max(0, (variance / (total || 1)) * 100))}% of total` },
        ].map(bar => (
          <div key={bar.label}>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>{bar.label}</span>
              <span className="text-white font-medium">
                {bar.value}{" "}
                <span className="text-slate-500 font-normal">· {bar.note}</span>
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${Math.min(100, bar.pct)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Per-project budget breakdown */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Per-Project Budget</p>
        <div className="space-y-5">
          {projects.map(p => {
            const pPct = p.budget > 0 ? (p.budgetSpent / p.budget) * 100 : 0;
            return (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${RAG_DOT[p.rag]}`} />
                    <span className="text-xs text-slate-300 truncate font-medium">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className={`text-xs font-semibold ${
                      p.budgetHealth === "On Track" ? "text-green-400" :
                      p.budgetHealth === "At Risk"  ? "text-amber-400" : "text-red-400"
                    }`}>{p.budgetHealth}</span>
                    <span className="text-xs text-slate-400">
                      {fmt(p.budgetSpent)} <span className="text-slate-600">/ {fmt(p.budget)}</span>
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pPct > 90 ? "bg-red-500" : pPct > 70 ? "bg-amber-400" : "bg-blue-500"}`}
                    style={{ width: `${Math.min(100, pPct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{Math.round(pPct)}% spent</span>
                  <span>{fmt(p.budget - p.budgetSpent)} remaining</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">Update total spend (AED):</span>
          <button
            onClick={() => onBudgetEditOpenChange(!budgetEditOpen)}
            className="text-xs text-blue-300 hover:text-blue-200"
          >
            {budgetEditOpen ? "Hide" : "Edit"}
          </button>
        </div>
        {budgetEditOpen && (
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={budgetSpentInput}
              onChange={(e) => onBudgetSpentInputChange(e.target.value)}
              placeholder={String(initiative.budgetSpent)}
              className="flex-1 bg-slate-800 border border-white/10 text-white text-xs rounded px-2 py-1.5"
            />
            <button
              onClick={onSaveBudgetSpent}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MILESTONES ────────────────────────────────────────────────────────────────

function MilestonesSection({ projects, isOwner, role, onMilestoneStatusChange }: {
  projects: Project[]; isOwner: boolean;
  role: LifecycleInsightsRole | null;
  onMilestoneStatusChange: (projectId: string, milestoneId: string, status: MilestoneStatus, name: string) => void;
}) {
  const allMs = projects.flatMap(p =>
    p.milestones.map(m => ({ ...m, projectName: p.name, projectId: p.id }))
  );

  /* ── Senior ── */
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

  /* ── General ── */
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

  /* ── Owner: grouped by status ── */
  const delayed    = allMs.filter(m => m.status === "Delayed");
  const inProgress = allMs.filter(m => m.status === "In Progress");
  const notStarted = allMs.filter(m => m.status === "Not Started");
  const complete   = allMs.filter(m => m.status === "Complete");
  const total      = allMs.length;
  const completePct = total > 0 ? Math.round((complete.length / total) * 100) : 0;

  const renderMsGroup = (
    label: string,
    items: typeof allMs,
    accentBg: string,
    accentBorder: string,
    labelColor: string,
  ) => {
    if (!items.length) return null;
    return (
      <div className={`rounded-xl border p-4 ${accentBg} ${accentBorder}`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs font-semibold uppercase tracking-wider ${labelColor}`}>{label}</p>
          <span className={`text-xs font-bold ${labelColor}`}>{items.length}</span>
        </div>
        <div className="space-y-2">
          {items.map(ms => {
            const overdueDays = ms.status === "Delayed" ? Math.abs(daysUntil(ms.dueDate)) : null;
            return (
              <div key={ms.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white leading-tight">{ms.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                    <span>{ms.projectName}</span>
                    {ms.owner && <><span>·</span><span>{ms.owner}</span></>}
                    <span>·</span>
                    <span>Due {ms.dueDate}</span>
                    {overdueDays !== null && overdueDays > 0 && (
                      <span className="text-red-400 font-semibold">{overdueDays}d overdue</span>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <select
                    value={ms.status}
                    onChange={(e) => onMilestoneStatusChange(ms.projectId, ms.id, e.target.value as MilestoneStatus, ms.name)}
                    className="text-xs bg-slate-800 border border-white/10 text-slate-300 rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5"
                  >
                    {["Not Started", "In Progress", "Complete", "Delayed"].map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary counts */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{complete.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Complete</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{inProgress.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">In Progress</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-slate-300">{notStarted.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Not Started</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${delayed.length > 0 ? "bg-red-500/10 border border-red-500/20" : "bg-white/5 border border-white/10"}`}>
          <p className={`text-2xl font-bold ${delayed.length > 0 ? "text-red-400" : "text-slate-300"}`}>{delayed.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Delayed</p>
        </div>
      </div>

      {/* Completion bar */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Programme Completion</span>
          <span className="font-bold text-white">{completePct}%</span>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-green-400 rounded-full" style={{ width: `${completePct}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-1.5">{complete.length} of {total} milestones complete</p>
      </div>

      {!allMs.length && <p className="text-slate-400 text-sm text-center py-10">No milestones found.</p>}

      {renderMsGroup("⚠ Delayed", delayed, "bg-red-500/5", "border-red-500/20", "text-red-400")}
      {renderMsGroup("In Progress", inProgress, "bg-blue-500/5", "border-blue-500/10", "text-blue-400")}
      {renderMsGroup("Not Started", notStarted, "bg-white/5", "border-white/10", "text-slate-400")}
      {complete.length > 0 && renderMsGroup(`Complete (${complete.length})`, complete, "bg-green-500/5", "border-green-500/10", "text-green-400")}
    </div>
  );
}

// ── RISKS ─────────────────────────────────────────────────────────────────────

function RisksSection({ projects, role, onRiskStatusChange, onRequestSupport }: {
  projects: Project[]; role: LifecycleInsightsRole | null;
  onRiskStatusChange: (projectId: string, riskId: string, status: "Open" | "Mitigated" | "Accepted" | "Closed", title: string) => void;
  onRequestSupport: (risk: Project["risks"][number] & { projectId: string }) => void;
}) {
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

  const SEV_ORDER = ["Critical", "High", "Medium", "Low"];
  const allRisks  = projects
    .flatMap(p => p.risks.map(r => ({ ...r, projectName: p.name, projectId: p.id })))
    .sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity));

  if (!allRisks.length)
    return (
      <div className="text-center py-16">
        <Shield className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" />
        <p className="text-slate-400 text-sm">No risks logged at programme level.</p>
      </div>
    );

  /* ── Senior ── */
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

  /* ── General ── */
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

  /* ── Owner: grouped by severity, expandable rows ── */
  const grouped: Record<string, typeof allRisks> = { Critical: [], High: [], Medium: [], Low: [] };
  allRisks.forEach(r => grouped[r.severity].push(r));

  const openCount   = allRisks.filter(r => r.status === "Open").length;
  const closedCount = allRisks.length - openCount;

  return (
    <div className="space-y-5">
      {/* Summary chips */}
      <div className="flex items-center gap-3 flex-wrap">
        {SEV_ORDER.map(sev => {
          const n = grouped[sev].length;
          if (!n) return null;
          return (
            <span key={sev} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${SEV_COLORS[sev]}`}>
              {n} {sev}
            </span>
          );
        })}
        <span className="text-xs text-slate-500 ml-auto">
          {openCount} open · {closedCount} resolved
        </span>
      </div>

      {/* Severity groups */}
      {SEV_ORDER.map(sev => {
        const items = grouped[sev];
        if (!items.length) return null;
        return (
          <div key={sev}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SEV_COLORS[sev]}`}>{sev}</span>
              <span className="text-xs text-slate-500">— {items.length} risk{items.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {items.map(r => (
                <div key={r.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    className="w-full text-left p-4 flex items-start gap-3 hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedRisk(expandedRisk === r.id ? null : r.id)}
                  >
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5 ${SEV_COLORS[r.severity]}`}>
                      {r.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{r.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.projectName}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-xs font-medium ${
                        r.status === "Open" ? "text-red-400" :
                        r.status === "Mitigated" ? "text-green-400" : "text-slate-400"
                      }`}>{r.status}</span>
                      {expandedRisk === r.id
                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                        : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {expandedRisk === r.id && (
                    <div className="border-t border-white/10 p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Likelihood</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            r.likelihood === "High" ? "bg-red-500/20 text-red-300" :
                            r.likelihood === "Medium" ? "bg-amber-500/20 text-amber-300" : "bg-slate-500/20 text-slate-300"
                          }`}>{r.likelihood}</span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Risk Owner</p>
                          <p className="text-xs text-slate-200 font-medium">{r.owner}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Mitigation Due</p>
                          <p className="text-xs text-slate-200">{r.mitigationDueDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Current Status</p>
                          <span className={`text-xs font-semibold ${
                            r.status === "Open" ? "text-red-400" :
                            r.status === "Mitigated" ? "text-green-400" :
                            r.status === "Accepted" ? "text-amber-400" : "text-slate-400"
                          }`}>{r.status}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Impact</p>
                          <p className="text-xs text-slate-300 leading-relaxed">{r.impact}</p>
                        </div>
                        <div className="bg-teal-500/5 border border-teal-500/10 rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-1">Mitigation Plan</p>
                          <p className="text-xs text-teal-200 leading-relaxed">{r.mitigation}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-white/10 flex-wrap">
                        <span className="text-xs text-slate-500">Update status:</span>
                        {(["Open", "Mitigated", "Accepted", "Closed"] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => onRiskStatusChange(r.projectId, r.id, status, r.title)}
                            className={`text-xs px-2 py-0.5 rounded border ${r.status === status ? "opacity-100" : "opacity-40 hover:opacity-70"} ${SEV_COLORS[r.severity]}`}
                          >
                            {status}
                          </button>
                        ))}
                        <button
                          onClick={() => onRequestSupport(r)}
                          className="text-xs text-orange-400 hover:text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded ml-auto"
                        >
                          Get TO Support
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── BLOCKERS ──────────────────────────────────────────────────────────────────

function BlockersSection({ projects, role, initiative, accountName, onEscalateBlocker, onResolveBlocker }: {
  projects: Project[]; role: LifecycleInsightsRole | null; initiative: Initiative;
  accountName: string;
  onEscalateBlocker: (
    projectId: string,
    blockerId: string,
    title: string,
    escalationStatus: "Escalated to TO" | "Escalated to Division Head",
    whatIsNeeded: string
  ) => void;
  onResolveBlocker: (projectId: string, blockerId: string, title: string) => void;
}) {
  const allBlockers = projects.flatMap(p =>
    p.blockers.filter(b => !b.resolved).map(b => ({ ...b, projectName: p.name, projectId: p.id }))
  );

  const daysOpen = (dateRaised: string) =>
    Math.floor((Date.now() - new Date(dateRaised).getTime()) / 86_400_000);

  if (!allBlockers.length)
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" />
        <p className="text-slate-400 text-sm">No open blockers across this programme.</p>
      </div>
    );

  /* ── Senior ── */
  if (role === "senior-stakeholder") {
    const notEsc    = allBlockers.filter(b => b.escalationStatus === "Not Escalated").length;
    const toTO      = allBlockers.filter(b => b.escalationStatus === "Escalated to TO").length;
    const toDH      = allBlockers.filter(b => b.escalationStatus === "Escalated to Division Head").length;
    const escalated = allBlockers.filter(b => b.escalationStatus !== "Not Escalated");
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <DashStat label="Open"                  value={String(notEsc)} sub="not escalated" />
          <DashStat label="Escalated to TO"        value={String(toTO)}  accent={toTO > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5"} />
          <DashStat label="Escalated to Div Head"  value={String(toDH)}  accent={toDH > 0 ? "bg-red-500/10 border-red-500/20"    : "bg-white/5"} />
        </div>
        {escalated.length > 0 && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Escalated Items</p>
            {escalated.map(b => (
              <div key={b.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${ESC_COLORS[b.escalationStatus]}`}>
                  {b.escalationStatus.replace("Escalated to ", "")}
                </span>
                <span className="text-sm text-white">{b.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── General ── */
  if (role === "general-staff") {
    return (
      <div className="space-y-2">
        {allBlockers.map(b => (
          <div key={b.id} className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-4 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-sm text-white flex-1">{b.title}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${ESC_COLORS[b.escalationStatus]}`}>
              {b.escalationStatus === "Not Escalated" ? "Open" : b.escalationStatus.replace("Escalated to ", "→ ")}
            </span>
          </div>
        ))}
      </div>
    );
  }

  /* ── Owner: grouped by escalation level ── */
  const escalatedToDH = allBlockers.filter(b => b.escalationStatus === "Escalated to Division Head");
  const escalatedToTO = allBlockers.filter(b => b.escalationStatus === "Escalated to TO");
  const notEscalated  = allBlockers.filter(b => b.escalationStatus === "Not Escalated");

  const BlockerCard = ({ b }: { b: typeof allBlockers[0] }) => {
    const days = daysOpen(b.dateRaised);
    const isEscHigh = b.escalationStatus === "Escalated to Division Head";
    const isEscMid  = b.escalationStatus === "Escalated to TO";
    const nextEscalation = b.escalationStatus === "Not Escalated"
      ? "Escalated to TO"
      : "Escalated to Division Head";
    return (
      <div className={`rounded-xl border p-4 ${
        isEscHigh ? "bg-red-500/5 border-red-500/20" :
        isEscMid  ? "bg-amber-500/5 border-amber-500/20" :
        "bg-white/5 border-white/10"
      }`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
            isEscHigh ? "text-red-400" : isEscMid ? "text-amber-400" : "text-slate-400"
          }`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-white leading-tight">{b.title}</p>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                days > 14 ? "bg-red-500/20 text-red-300" :
                days > 7  ? "bg-amber-500/20 text-amber-300" :
                "bg-white/10 text-slate-300"
              }`}>
                {days}d open
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              {b.projectName} · Raised {b.dateRaised} by {b.raisedBy}
            </p>
            <div className="bg-white/5 rounded-lg p-2.5 mb-2">
              <p className="text-xs text-slate-500 mb-0.5">What is needed</p>
              <p className="text-xs text-slate-200 leading-relaxed">{b.whatIsNeeded}</p>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ESC_COLORS[b.escalationStatus]}`}>
              {b.escalationStatus}
            </span>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {b.escalationStatus !== "Escalated to Division Head" && (
                <button
                  onClick={() => onEscalateBlocker(b.projectId, b.id, b.title, nextEscalation, b.whatIsNeeded)}
                  className="text-xs text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded hover:bg-amber-500/10"
                >
                  Escalate to {nextEscalation.replace("Escalated to ", "")}
                </button>
              )}
              <button
                onClick={() => onResolveBlocker(b.projectId, b.id, b.title)}
                className="text-xs text-green-400 border border-green-500/30 px-2 py-0.5 rounded hover:bg-green-500/10"
              >
                Mark Resolved
              </button>
              <span className="text-xs text-slate-500 ml-auto">
                {initiative.name} Â· {accountName}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Summary stat row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Open"                  value={String(notEscalated.length)} sub="not yet escalated" />
        <StatCard label="Escalated to TO"       value={String(escalatedToTO.length)} sub="under TO review"
          accent={escalatedToTO.length > 0 ? "bg-amber-500/10 border-amber-500/20" : undefined} />
        <StatCard label="Escalated to Div Head" value={String(escalatedToDH.length)} sub="requires exec action"
          accent={escalatedToDH.length > 0 ? "bg-red-500/10 border-red-500/20" : undefined} />
      </div>

      {escalatedToDH.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Escalated to Division Head</p>
          <div className="space-y-2">
            {escalatedToDH.map(b => <BlockerCard key={b.id} b={b} />)}
          </div>
        </div>
      )}
      {escalatedToTO.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Escalated to TO</p>
          <div className="space-y-2">
            {escalatedToTO.map(b => <BlockerCard key={b.id} b={b} />)}
          </div>
        </div>
      )}
      {notEscalated.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Open — Not Yet Escalated</p>
          <div className="space-y-2">
            {notEscalated.map(b => <BlockerCard key={b.id} b={b} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TEAM ──────────────────────────────────────────────────────────────────────

function TeamSection({ initiative, projects, role }: {
  initiative: Initiative; projects: Project[]; role: LifecycleInsightsRole | null;
}) {
  const pms = [...new Set(projects.map(p => p.pmName))].filter(Boolean);

  /* ── General ── */
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

  /* ── Senior: team overview ── */
  if (role === "senior-stakeholder") {
    return (
      <div className="space-y-4">
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Programme Lead</p>
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
        {pms.length > 0 && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Project Managers</p>
            <div className="space-y-2">
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

  /* ── Owner: full rich team view ── */
  // Map PM → projects they manage
  const pmProjectMap: Record<string, string[]> = {};
  projects.forEach(p => {
    if (!pmProjectMap[p.pmName]) pmProjectMap[p.pmName] = [];
    pmProjectMap[p.pmName].push(p.name);
  });
  // Active milestone workload per PM
  const pmWorkload: Record<string, number> = {};
  projects.forEach(p => {
    const active = p.milestones.filter(m => m.status === "In Progress").length;
    pmWorkload[p.pmName] = (pmWorkload[p.pmName] || 0) + active;
  });

  return (
    <div className="space-y-5">
      {/* Programme Lead */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Programme Lead</p>
        <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-500/30 flex items-center justify-center text-xl font-bold text-teal-200 flex-shrink-0">
              {initiative.owner.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-base">{initiative.owner}</p>
              <p className="text-xs text-slate-400 mt-0.5">Programme Manager · {initiative.division}</p>
              <p className="text-xs text-teal-400 mt-1">Accountable for overall delivery and stakeholder alignment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Managers */}
      {pms.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Project Managers ({pms.length})
          </p>
          <div className="space-y-2">
            {pms.map(pm => {
              const managedProjects = pmProjectMap[pm] || [];
              const activeWork = pmWorkload[pm] || 0;
              return (
                <div key={pm} className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-300 flex-shrink-0">
                      {pm.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{pm}</p>
                      <p className="text-xs text-slate-500">Project Manager</p>
                      <div className="mt-1.5 space-y-0.5">
                        {managedProjects.map((proj, i) => (
                          <p key={i} className="text-xs text-slate-400">
                            <span className="text-slate-600">→ </span>{proj}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-slate-500">Active milestones</p>
                      <p className={`text-lg font-bold mt-0.5 ${activeWork > 3 ? "text-amber-400" : "text-white"}`}>
                        {activeWork}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EA & TO Office */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">EA & TO Office</p>
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
              EA
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Corporate EA Office</p>
              <p className="text-xs text-slate-400">TO Assigned Member · DTMP Programme Team</p>
              <p className="text-xs text-purple-400 mt-0.5">EA governance, architecture review and alignment oversight</p>
            </div>
          </div>
        </div>
      </div>

      {/* Programme context */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Programme Context</p>
        <div className="grid grid-cols-2 gap-y-2.5 text-xs">
          <div><span className="text-slate-500">Division</span></div>
          <div className="text-right"><span className="text-slate-300 font-medium">{initiative.division}</span></div>
          <div><span className="text-slate-500">Initiative Type</span></div>
          <div className="text-right"><span className="text-slate-300 font-medium">{initiative.type}</span></div>
          <div><span className="text-slate-500">Total Projects</span></div>
          <div className="text-right"><span className="text-slate-300 font-medium">{projects.length}</span></div>
          <div><span className="text-slate-500">EA Alignment Score</span></div>
          <div className="text-right">
            <span className="text-slate-300 font-medium">
              {initiative.eaAlignmentScore !== null ? `${initiative.eaAlignmentScore}%` : "TBD"}
            </span>
          </div>
          <div><span className="text-slate-500">Target Completion</span></div>
          <div className="text-right"><span className="text-slate-300 font-medium">{initiative.targetDate}</span></div>
        </div>
      </div>
    </div>
  );
}

// ── ACTIVITY ──────────────────────────────────────────────────────────────────

function LegacyActivitySection({ initiative, projects, role }: {
  initiative: Initiative; projects: Project[]; role: LifecycleInsightsRole | null;
}) {
  const allMsData    = projects.flatMap(p => p.milestones.map(m => ({ ...m, projectName: p.name, pmName: p.pmName })));
  const completedMs  = allMsData.filter(m => m.status === "Complete");
  const openRisks    = projects.flatMap(p => p.risks).filter(r => r.status === "Open");
  const openBlockers = projects.flatMap(p => p.blockers).filter(b => !b.resolved);
  const escalatedB   = openBlockers.filter(b => b.escalationStatus !== "Not Escalated");
  const spentPct     = initiative.budget ? Math.round((initiative.budgetSpent / initiative.budget) * 100) : 0;

  type EventColor = "bg-teal-400" | "bg-green-400" | "bg-red-400" | "bg-amber-400" | "bg-blue-400" | "bg-purple-400" | "bg-orange-400" | "bg-slate-400";

  const events: { time: string; actor: string; action: string; note: string; color: EventColor }[] = [
    {
      time: initiative.updatedAt,
      actor: initiative.owner, action: "Programme data updated",
      note: `${initiative.progress}% overall progress recorded`, color: "bg-teal-400",
    },
    {
      time: new Date(Date.now() - 2 * 86400000).toISOString(),
      actor: "System", action: "EA alignment score recorded",
      note: `${initiative.eaAlignmentScore ?? "TBD"}% architecture alignment`, color: "bg-purple-400",
    },
    ...completedMs.slice(0, 2).map((m, i) => ({
      time: new Date(Date.now() - (3 + i * 2) * 86400000).toISOString(),
      actor: m.owner ?? m.pmName, action: "Milestone marked complete",
      note: `${m.name} — ${m.projectName}`, color: "bg-green-400" as EventColor,
    })),
    ...escalatedB.slice(0, 1).map(b => ({
      time: new Date(Date.now() - 6 * 86400000).toISOString(),
      actor: b.raisedBy, action: "Blocker escalated",
      note: b.title, color: "bg-red-400" as EventColor,
    })),
    ...openRisks.slice(0, 1).map(r => ({
      time: new Date(Date.now() - 8 * 86400000).toISOString(),
      actor: r.owner, action: "Risk logged on register",
      note: `${r.severity}: ${r.title}`, color: "bg-orange-400" as EventColor,
    })),
    {
      time: new Date(Date.now() - 10 * 86400000).toISOString(),
      actor: "TO Team", action: "Initiative reviewed by TO office",
      note: `Status confirmed: ${initiative.status}`, color: "bg-blue-400",
    },
    {
      time: new Date(Date.now() - 14 * 86400000).toISOString(),
      actor: initiative.owner, action: "Budget utilisation reported",
      note: `${spentPct}% of ${fmt(initiative.budget)} spent to date`, color: "bg-blue-400",
    },
    {
      time: new Date(Date.now() - 21 * 86400000).toISOString(),
      actor: "System", action: "Initiative registered in DTMP",
      note: `Type: ${initiative.type} · Division: ${initiative.division}`, color: "bg-slate-400",
    },
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const shown = role === "general-staff" ? events.slice(0, 2) : events;

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {shown.map((ev, i) => (
        <div key={i} className="flex gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
          <div className="flex flex-col items-center gap-0 flex-shrink-0 w-3 mt-1.5">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ev.color}`} />
            {i < shown.length - 1 && (
              <div className="w-px flex-1 bg-white/10 mt-1" style={{ minHeight: 16 }} />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <p className="text-sm text-slate-200">
              <span className="font-semibold text-white">{ev.actor}</span>
              <span className="text-slate-400"> - {ev.action}</span>
            </p>
            {ev.note && (
              <p className="text-xs text-slate-500 mt-0.5 italic">{ev.note}</p>
            )}
            <p className="text-xs text-slate-600 mt-1">{relTime(ev.time)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

function ActivitySection({ role, events }: {
  role: LifecycleInsightsRole | null; events: ActivityEvent[];
}) {
  const colorByEventType: Record<ActivityEvent["eventType"], string> = {
    milestone: "bg-green-400",
    risk: "bg-orange-400",
    blocker: "bg-amber-400",
    escalation: "bg-red-400",
    resolve: "bg-green-400",
    budget: "bg-blue-400",
    status: "bg-teal-400",
    request: "bg-purple-400",
    rag: "bg-yellow-400",
    system: "bg-slate-400",
  };

  const shown = role === "general-staff" ? events.slice(0, 2) : events;

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {!shown.length && (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-slate-400">No activity logged for this initiative yet.</p>
        </div>
      )}
      {shown.map((ev, i) => (
        <div key={ev.id} className="flex gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
          <div className="flex flex-col items-center gap-0 flex-shrink-0 w-3 mt-1.5">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorByEventType[ev.eventType]}`} />
            {i < shown.length - 1 && (
              <div className="w-px flex-1 bg-white/10 mt-1" style={{ minHeight: 16 }} />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <p className="text-sm text-slate-200">
              <span className="font-semibold text-white">{ev.actor}</span>
              <span className="text-slate-400"> - {ev.action}</span>
            </p>
            {ev.note && (
              <p className="text-xs text-slate-500 mt-0.5 italic">{ev.note}</p>
            )}
            <p className="text-xs text-slate-600 mt-1">{relTime(ev.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LCInsightsPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initiative,       setInitiative]       = useState<Initiative | null>(() => getInitiatives().find(i => i.id === id) ?? null);
  const [projects,         setProjects]         = useState<Project[]>(() => id ? getProjects(id) : []);
  const [activeSection,    setActiveSection]    = useState<InsightSection>("health");
  const [role,             setRole]             = useState<LifecycleInsightsRole | null>(() => getLifecycleRole());
  const [roleModalOpen,    setRoleModalOpen]    = useState(false);
  const [activityKey,      setActivityKey]      = useState(0);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceType,      setServiceType]      = useState<LCServiceType>(INITIATIVE_LEVEL_SERVICES[0]);
  const [servicePriority,  setServicePriority]  = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [serviceNotes,     setServiceNotes]     = useState("");
  const [requests,         setRequests]         = useState(() => initiative ? getLCRequestsByInitiative(initiative.id) : []);
  const [serviceSource,    setServiceSource]    = useState<{ type: "risk" | "blocker" | "initiative"; id: string; name: string } | null>(null);
  const [resolveTarget,    setResolveTarget]    = useState<{ projectId: string; blockerId: string; title: string } | null>(null);
  const [resolveNote,      setResolveNote]      = useState("");
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [budgetEditOpen,   setBudgetEditOpen]   = useState(false);
  const [budgetSpentInput, setBudgetSpentInput] = useState("");

  useEffect(() => {
    if (!isUserAuthenticated()) navigate(`/marketplaces/lifecycle-management/initiative/${id}`);
  }, [id, navigate]);

  const refresh = () => {
    setInitiative(getInitiatives().find((item) => item.id === id) ?? null);
    setProjects(id ? getProjects(id) : []);
  };
  const isOwner  = role === "initiative-owner";
  const account  = role ? getDemoAccount(role) : null;

  useEffect(() => {
    setInitiative(getInitiatives().find((item) => item.id === id) ?? null);
    setProjects(id ? getProjects(id) : []);
  }, [id]);

  useEffect(() => {
    setRequests(initiative ? getLCRequestsByInitiative(initiative.id) : []);
  }, [initiative]);

  const logAndRefresh = (event: Omit<ActivityEvent, "id" | "timestamp">) => {
    if (!initiative) return;
    addActivityEvent(event);
    refresh();
    setActivityKey((key) => key + 1);
    setRequests(getLCRequestsByInitiative(initiative.id));
  };

  const openRequestService = () => {
    setServiceType(INITIATIVE_LEVEL_SERVICES[0]);
    setServicePriority("Medium");
    setServiceNotes("");
    setServiceSource(initiative ? { type: "initiative", id: initiative.id, name: initiative.name } : null);
    setServiceModalOpen(true);
  };

  const submitServiceRequest = () => {
    if (!initiative) return;
    const r   = role ?? "general-staff";
    const acc = getDemoAccount(r);
    addLCRequest({
      serviceType, initiativeId: initiative.id, initiativeName: initiative.name,
      submittedBy: acc.name, submittedByRole: LIFECYCLE_ROLE_LABELS[r],
      status: "Submitted", priority: servicePriority,
      notes: serviceNotes.trim() || undefined,
      sourceType: serviceSource?.type,
      sourceId: serviceSource?.id,
      sourceName: serviceSource?.name,
      slaHours: LC_SERVICE_SLA[serviceType],
    });
    addActivityEvent({
      initiativeId: initiative.id,
      actor: acc.name,
      action: "Service request submitted",
      note: `${serviceType}${serviceSource ? ` â€” ${serviceSource.type}: ${serviceSource.name}` : ""}`,
      eventType: "request",
      sourceType: "service-request",
    });
    setRequests(getLCRequestsByInitiative(initiative.id));
    setServiceSource(null);
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

  const handleInitiativeStatusChange = (status: string) => {
    updateInitiativeStatus(initiative.id, status as Initiative["status"]);
    logAndRefresh({
      initiativeId: initiative.id,
      actor: account?.name ?? initiative.owner,
      action: "Initiative status updated",
      note: status,
      eventType: "status",
      sourceType: "initiative",
      sourceId: initiative.id,
    });
  };

  const handleMilestoneStatusChange = (projectId: string, milestoneId: string, status: MilestoneStatus, name: string) => {
    updateMilestoneStatus(projectId, milestoneId, status);
    logAndRefresh({
      initiativeId: initiative.id,
      actor: account?.name ?? initiative.owner,
      action: `Milestone status → ${status}`,
      note: name,
      eventType: "milestone",
      sourceType: "milestone",
      sourceId: milestoneId,
    });
  };

  const handleRiskStatusChange = (
    projectId: string,
    riskId: string,
    status: "Open" | "Mitigated" | "Accepted" | "Closed",
    title: string
  ) => {
    updateRiskStatus(projectId, riskId, status);
    logAndRefresh({
      initiativeId: initiative.id,
      actor: account?.name ?? initiative.owner,
      action: `Risk status → ${status}`,
      note: title,
      eventType: "risk",
      sourceType: "risk",
      sourceId: riskId,
    });
  };

  const handleRiskSupportRequest = (risk: Project["risks"][number] & { projectId: string }) => {
    setServiceType("Risk Assessment");
    setServicePriority(risk.severity === "Critical" ? "Critical" : risk.severity === "High" ? "High" : "Medium");
    setServiceNotes(`Risk: ${risk.title}\nImpact: ${risk.impact}\nCurrent mitigation: ${risk.mitigation}`);
    setServiceSource({ type: "risk", id: risk.id, name: risk.title });
    setServiceModalOpen(true);
  };

  const handleEscalateBlocker = (
    projectId: string,
    blockerId: string,
    title: string,
    escalationStatus: "Escalated to TO" | "Escalated to Division Head",
    whatIsNeeded: string
  ) => {
    updateBlockerEscalation(projectId, blockerId, escalationStatus);
    addEscalation({
      title,
      type: "Blocker",
      initiativeId: initiative.id,
      initiativeName: initiative.name,
      raisedBy: account?.name ?? initiative.owner,
      dateRaised: new Date().toISOString().split("T")[0],
      severity: "High",
      whatIsNeeded,
    });
    logAndRefresh({
      initiativeId: initiative.id,
      actor: account?.name ?? initiative.owner,
      action: `Blocker escalated to ${escalationStatus.replace("Escalated to ", "")}`,
      note: title,
      eventType: "escalation",
      sourceType: "blocker",
      sourceId: blockerId,
    });
  };

  const handleResolveBlocker = (projectId: string, blockerId: string, title: string) => {
    setResolveTarget({ projectId, blockerId, title });
    setResolveNote("");
    setResolveModalOpen(true);
  };

  const confirmResolveBlocker = () => {
    if (!resolveTarget) return;
    resolveBlocker(resolveTarget.projectId, resolveTarget.blockerId, resolveNote.trim());
    logAndRefresh({
      initiativeId: initiative.id,
      actor: account?.name ?? initiative.owner,
      action: "Blocker resolved",
      note: `${resolveTarget.title}${resolveNote.trim() ? ` â€” ${resolveNote.trim()}` : ""}`,
      eventType: "resolve",
      sourceType: "blocker",
      sourceId: resolveTarget.blockerId,
    });
    setResolveModalOpen(false);
    setResolveTarget(null);
    setResolveNote("");
  };

  const saveInitiativeBudgetSpent = () => {
    const value = Number(budgetSpentInput);
    if (Number.isNaN(value) || value < 0) return;
    updateInitiativeBudgetSpent(initiative.id, value);
    logAndRefresh({
      initiativeId: initiative.id,
      actor: account?.name ?? initiative.owner,
      action: "Budget spend updated",
      note: `New total: ${fmt(value)}`,
      eventType: "budget",
      sourceType: "initiative",
      sourceId: initiative.id,
    });
    setBudgetSpentInput("");
    setBudgetEditOpen(false);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "health":     return <HealthSection     initiative={initiative} projects={projects} role={role} onInitiativeStatusChange={handleInitiativeStatusChange} />;
      case "projects":   return <ProjectsSection   projects={projects} isOwner={isOwner} role={role} onRefresh={refresh} />;
      case "budget":     return <BudgetSection     initiative={initiative} projects={projects} role={role} budgetEditOpen={budgetEditOpen} budgetSpentInput={budgetSpentInput} onBudgetSpentInputChange={setBudgetSpentInput} onBudgetEditOpenChange={setBudgetEditOpen} onSaveBudgetSpent={saveInitiativeBudgetSpent} />;
      case "milestones": return <MilestonesSection projects={projects} isOwner={isOwner} role={role} onMilestoneStatusChange={handleMilestoneStatusChange} />;
      case "risks":      return <RisksSection      projects={projects} role={role} onRiskStatusChange={handleRiskStatusChange} onRequestSupport={handleRiskSupportRequest} />;
      case "blockers":   return <BlockersSection   projects={projects} role={role} initiative={initiative} accountName={account?.name ?? initiative.owner} onEscalateBlocker={handleEscalateBlocker} onResolveBlocker={handleResolveBlocker} />;
      case "team":       return <TeamSection       initiative={initiative} projects={projects} role={role} />;
      case "activity":   return <ActivitySection   role={role} events={getActivityEvents(initiative.id)} key={activityKey} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <Toaster />

      {/* Top bar */}
      <div className="bg-slate-900 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/marketplaces/lifecycle-management/initiative/${id}`)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />Back to Initiative
            </button>
            <span className="text-slate-600">·</span>
            <p className="text-sm text-white font-semibold line-clamp-1">{initiative.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {role && account && (
              <span className="text-xs text-slate-400 hidden sm:block">
                Viewing as{" "}
                <span className="text-teal-400 font-medium">{LIFECYCLE_ROLE_LABELS[role]}</span>
                {" "}— {account.name}
              </span>
            )}
            <button
              onClick={() => setRoleModalOpen(true)}
              className="text-xs text-teal-400 hover:text-teal-300 px-3 py-1.5 rounded-lg border border-teal-500/30 hover:border-teal-400/50 transition-colors"
            >
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
              <button
                key={sId}
                onClick={() => setActiveSection(sId)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeSection === sId
                    ? "border-teal-400 text-teal-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
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
                {role
                  ? SECTION_DESC[activeSection][role]
                  : "Select a role to see role-appropriate insights"}
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
              {requests.length > 0 && (
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Requests</p>
                  {requests.slice(0, 4).map((request) => (
                    <div key={request.id} className="bg-white/5 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-slate-200 font-medium leading-tight">{request.serviceType}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 font-medium ${
                          request.status === "Delivered" || request.status === "Completed" ? "bg-green-500/20 text-green-300" :
                          request.status === "In Progress" ? "bg-blue-500/20 text-blue-300" :
                          request.status === "Assigned" ? "bg-purple-500/20 text-purple-300" :
                          "bg-slate-500/20 text-slate-300"
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      {request.sourceName && <p className="text-xs text-slate-500">â†³ {request.sourceName}</p>}
                      {(request.status === "Delivered" || request.status === "Completed") && (
                        <button
                          onClick={() => navigate("/stage2/lifecycle-management")}
                          className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-0.5"
                        >
                          View in Stage 2 â†’
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-white/10" />
              <button
                onClick={openRequestService}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <FileText className="w-4 h-4" />Request Service
              </button>
              <p className="text-xs text-slate-500 text-center">
                Viewing as{" "}
                <span className="text-teal-400">{role ? LIFECYCLE_ROLE_LABELS[role] : "Guest"}</span>
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Role modal */}
      {roleModalOpen && (
        <LCInsightsLoginModal
          onSuccess={r => { setRole(r); setRoleModalOpen(false); }}
          onClose={() => setRoleModalOpen(false)}
        />
      )}

      {/* Request Service dialog */}
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
            {serviceSource && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs text-orange-600 mb-0.5">Source Context</p>
                <p className="text-sm font-semibold text-slate-900">
                  {serviceSource.type}: {serviceSource.name}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Service Type</label>
                <Select value={serviceType} onValueChange={v => setServiceType(v as LCServiceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INITIATIVE_LEVEL_SERVICES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Priority</label>
                <Select value={servicePriority} onValueChange={v => setServicePriority(v as typeof servicePriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Critical","High","Medium","Low"] as const).map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">SLA</label>
                <div className="h-10 flex items-center px-3 rounded-md border border-input bg-background text-sm text-muted-foreground">
                  {LC_SERVICE_SLA[serviceType]}h response
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Notes</label>
                <Textarea
                  placeholder="Describe what you need and any relevant context..."
                  value={serviceNotes}
                  onChange={e => setServiceNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setServiceModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors">
              Cancel
            </button>
            <button onClick={submitServiceRequest}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors">
              Submit Request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Blocker</DialogTitle>
            <DialogDescription>Add a resolution note before closing this blocker.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-0.5">Blocker</p>
              <p className="text-sm font-semibold text-slate-900">{resolveTarget?.title ?? "Selected blocker"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Resolution Note</label>
              <Textarea
                placeholder="Describe what was done to resolve this blocker..."
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                className="resize-none"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setResolveModalOpen(false);
                setResolveTarget(null);
                setResolveNote("");
              }}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmResolveBlocker}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Confirm Resolve
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
