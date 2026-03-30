import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Flag,
  Shield,
  Users,
  Zap,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Progress } from "@/components/ui/progress";
import { LCInsightsLoginModal } from "@/components/lifecycle/LCInsightsLoginModal";
import {
  isUserAuthenticated,
  setUserAuthenticated,
} from "@/data/sessionAuth";
import {
  INITIATIVE_LEVEL_SERVICES,
  LC_SERVICE_SLA,
  addLCRequest,
  type LCServiceType,
} from "@/data/lifecycle/serviceRequestState";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import {
  getInitiatives,
  getProjects,
  updateMilestoneStatus,
  updateProjectRAG,
  type Initiative,
  type Project,
  type Milestone,
  type RAGStatus,
  type MilestoneStatus,
} from "@/data/shared/lifecyclePortfolioStore";
import {
  getLifecycleRole,
  getDemoAccount,
  type LifecycleInsightsRole,
  LIFECYCLE_ROLE_LABELS,
} from "@/data/shared/lifecycleRole";

// ── Helpers ────────────────────────────────────────────────────────────────────

const RAG_COLORS: Record<RAGStatus, string> = {
  Green: "bg-green-500/20 text-green-300 border-green-500/30",
  Amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Red: "bg-red-500/20 text-red-300 border-red-500/30",
};

const RAG_DOT: Record<RAGStatus, string> = {
  Green: "bg-green-400",
  Amber: "bg-amber-400",
  Red: "bg-red-400",
};

const MILESTONE_COLORS: Record<MilestoneStatus, string> = {
  Complete: "text-green-400 bg-green-500/10",
  "In Progress": "text-blue-400 bg-blue-500/10",
  "Not Started": "text-slate-400 bg-slate-500/10",
  Delayed: "text-red-400 bg-red-500/10",
};

const formatBudget = (n: number | null): string => {
  if (n === null) return "TBC";
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`;
  return `AED ${n}`;
};

const daysUntil = (dateStr: string): number =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

// ── Section config ─────────────────────────────────────────────────────────────

type InsightSection = "health" | "projects" | "budget" | "milestones" | "risks" | "blockers" | "team" | "activity";

const SECTIONS: { id: InsightSection; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "health",     label: "Health",     icon: Activity },
  { id: "projects",   label: "Projects",   icon: BarChart2 },
  { id: "budget",     label: "Budget",     icon: DollarSign },
  { id: "milestones", label: "Milestones", icon: CheckCircle2 },
  { id: "risks",      label: "Risks",      icon: Shield },
  { id: "blockers",   label: "Blockers",   icon: Flag },
  { id: "team",       label: "Team",       icon: Users },
  { id: "activity",   label: "Activity",   icon: Zap },
];

// ── StatCard ───────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 p-4 ${accent ?? "bg-white/5"}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Health section ─────────────────────────────────────────────────────────────

function HealthSection({ initiative, projects }: { initiative: Initiative; projects: Project[] }) {
  const redCount = projects.filter((p) => p.rag === "Red").length;
  const amberCount = projects.filter((p) => p.rag === "Amber").length;
  const days = daysUntil(initiative.targetDate);
  const spentPct = initiative.budget ? Math.round((initiative.budgetSpent / initiative.budget) * 100) : 0;
  const overallRAG: RAGStatus =
    initiative.status === "At Risk" ? "Red" : redCount > 0 ? "Red" : amberCount > 0 ? "Amber" : "Green";

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
        <StatCard label="Progress" value={`${initiative.progress}%`} sub="of delivery complete" accent="bg-teal-500/10 border-teal-500/20" />
        <StatCard label="EA Alignment" value={initiative.eaAlignmentScore !== null ? `${initiative.eaAlignmentScore}%` : "TBD"} />
        <StatCard
          label="Days to Target"
          value={days < 0 ? `${Math.abs(days)}d` : `${days}d`}
          sub={days < 0 ? "overdue" : "remaining"}
          accent={days < 0 ? "bg-red-500/10 border-red-500/20" : days < 90 ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5"}
        />
        <StatCard label="Budget Spent" value={`${spentPct}%`} sub={`${formatBudget(initiative.budgetSpent)} of ${formatBudget(initiative.budget)}`} />
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Progress</p>
        <Progress value={initiative.progress} className="h-3" />
        <div className="flex justify-between text-xs text-slate-400">
          <span>0%</span>
          <span className="text-white font-semibold">{initiative.progress}%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Initiative Summary</p>
        <p className="text-sm text-slate-300 leading-relaxed">{initiative.description}</p>
      </div>

      {projects.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{projects.length} Projects — RAG Summary</p>
          <div className="flex items-center gap-3 flex-wrap">
            {(["Green", "Amber", "Red"] as RAGStatus[]).map((rag) => {
              const count = projects.filter((p) => p.rag === rag).length;
              if (count === 0) return null;
              return (
                <span key={rag} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${RAG_COLORS[rag]}`}>
                  <span className={`w-2 h-2 rounded-full ${RAG_DOT[rag]}`} />
                  {count} {rag}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Projects section ───────────────────────────────────────────────────────────

function ProjectsSection({ projects, isOwner, onRefresh }: { projects: Project[]; isOwner: boolean; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {projects.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-10">No projects linked to this initiative.</p>
      )}
      {projects.map((project) => (
        <div key={project.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <button
            className="w-full text-left flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
            onClick={() => setExpanded(expanded === project.id ? null : project.id)}
          >
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${RAG_DOT[project.rag]}`} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{project.name}</p>
              <p className="text-xs text-slate-400">PM: {project.pmName} · {project.progress}% complete</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${RAG_COLORS[project.rag]}`}>{project.rag}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                project.budgetHealth === "On Track" ? "bg-green-500/10 text-green-400" :
                project.budgetHealth === "At Risk" ? "bg-amber-500/10 text-amber-400" :
                "bg-red-500/10 text-red-400"
              }`}>{project.budgetHealth}</span>
              {expanded === project.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>
          {expanded === project.id && (
            <div className="border-t border-white/10 p-4 space-y-3">
              <Progress value={project.progress} className="h-1.5" />
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">Milestones</p>
                {project.milestones.slice(0, 3).map((ms) => (
                  <div key={ms.id} className="flex items-center gap-2 py-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${MILESTONE_COLORS[ms.status]}`}>{ms.status}</span>
                    <span className="text-xs text-slate-300 truncate flex-1">{ms.name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">{ms.dueDate}</span>
                  </div>
                ))}
              </div>
              {project.blockers.filter((b) => !b.resolved).length > 0 && (
                <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium">{project.blockers.filter((b) => !b.resolved).length} open blocker(s)</span>
                </div>
              )}
              {isOwner && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Update RAG:</span>
                  {(["Green", "Amber", "Red"] as RAGStatus[]).map((rag) => (
                    <button
                      key={rag}
                      onClick={() => { updateProjectRAG(project.id, rag); onRefresh(); }}
                      className={`px-2 py-0.5 rounded text-xs font-medium border transition-opacity ${project.rag === rag ? "opacity-100" : "opacity-40 hover:opacity-70"} ${RAG_COLORS[rag]}`}
                    >
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

// ── Budget section ─────────────────────────────────────────────────────────────

function BudgetSection({ initiative, projects }: { initiative: Initiative; projects: Project[] }) {
  const total = initiative.budget ?? 0;
  const spent = initiative.budgetSpent;
  const committed = projects.reduce((sum, p) => sum + Math.max(0, p.budget - p.budgetSpent), 0);
  const variance = total - spent - committed;
  const pctSpent = total > 0 ? (spent / total) * 100 : 0;
  const pctCommitted = total > 0 ? (committed / total) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Allocated" value={formatBudget(total)} />
        <StatCard label="Spent" value={formatBudget(spent)} accent="bg-blue-500/10 border-blue-500/20" />
        <StatCard label="Forecast to Complete" value={formatBudget(total - spent)} />
        <StatCard label="Variance" value={formatBudget(variance)} accent={variance < 0 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"} />
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Waterfall</p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Spent ({Math.round(pctSpent)}%)</span>
              <span>{formatBudget(spent)}</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, pctSpent)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Committed ({Math.round(pctCommitted)}%)</span>
              <span>{formatBudget(committed)}</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${Math.min(100, pctCommitted)}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">By Project</p>
        <div className="space-y-2">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-xs text-slate-300 flex-1 truncate">{p.name}</span>
              <span className={`text-xs font-medium flex-shrink-0 ${
                p.budgetHealth === "On Track" ? "text-green-400" :
                p.budgetHealth === "At Risk" ? "text-amber-400" : "text-red-400"
              }`}>{p.budgetHealth}</span>
              <span className="text-xs text-slate-500 w-24 text-right flex-shrink-0">{formatBudget(p.budget)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Milestones section ─────────────────────────────────────────────────────────

function MilestonesSection({ projects, isOwner, onRefresh }: { projects: Project[]; isOwner: boolean; onRefresh: () => void }) {
  const allMs = projects.flatMap((p) =>
    p.milestones.map((m) => ({ ...m, projectName: p.name, projectId: p.id }))
  );

  return (
    <div className="space-y-3">
      {allMs.length === 0 && <p className="text-slate-400 text-sm text-center py-10">No milestones found.</p>}
      {allMs.map((ms) => (
        <div key={ms.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="flex items-start gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${MILESTONE_COLORS[ms.status]}`}>{ms.status}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{ms.name}</p>
              <p className="text-xs text-slate-400">{ms.projectName} · Due {ms.dueDate}</p>
              {ms.owner && <p className="text-xs text-slate-500">Owner: {ms.owner}</p>}
            </div>
            {isOwner && ms.status !== "Complete" && (
              <button
                onClick={() => { updateMilestoneStatus(ms.projectId, ms.id, "Complete"); onRefresh(); }}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium flex-shrink-0 px-2 py-1 rounded hover:bg-teal-500/10 transition-colors"
              >
                Mark Complete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Risks section ──────────────────────────────────────────────────────────────

function RisksSection({ projects }: { projects: Project[] }) {
  const allRisks = projects
    .flatMap((p) => p.risks.map((r) => ({ ...r, projectName: p.name })))
    .sort((a, b) => ["Critical","High","Medium","Low"].indexOf(a.severity) - ["Critical","High","Medium","Low"].indexOf(b.severity));

  const SEV: Record<string, string> = {
    Critical: "bg-red-500/20 text-red-300",
    High: "bg-orange-500/20 text-orange-300",
    Medium: "bg-amber-500/20 text-amber-300",
    Low: "bg-slate-500/20 text-slate-300",
  };

  if (allRisks.length === 0) {
    return (
      <div className="text-center py-16">
        <Shield className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" />
        <p className="text-slate-400 text-sm">No risks logged at programme level.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allRisks.map((risk) => (
        <div key={risk.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="flex items-start gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${SEV[risk.severity]}`}>{risk.severity}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{risk.title}</p>
              <p className="text-xs text-slate-500">{risk.projectName}</p>
              <p className="text-xs text-slate-400 mt-1">{risk.impact}</p>
              <p className="text-xs text-teal-400 mt-1"><span className="font-medium">Mitigation:</span> {risk.mitigation}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                <span>Owner: {risk.owner}</span>
                <span>·</span>
                <span>Due: {risk.mitigationDueDate}</span>
                <span>·</span>
                <span className={risk.status === "Open" ? "text-red-400" : "text-green-400"}>{risk.status}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Blockers section ───────────────────────────────────────────────────────────

function BlockersSection({ projects }: { projects: Project[] }) {
  const allBlockers = projects.flatMap((p) =>
    p.blockers.filter((b) => !b.resolved).map((b) => ({ ...b, projectName: p.name }))
  );

  const ESC: Record<string, string> = {
    "Not Escalated": "bg-slate-500/20 text-slate-400",
    "Escalated to TO": "bg-amber-500/20 text-amber-400",
    "Escalated to Division Head": "bg-red-500/20 text-red-400",
  };

  if (allBlockers.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" />
        <p className="text-slate-400 text-sm">No open blockers across this programme.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allBlockers.map((b) => (
        <div key={b.id} className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{b.title}</p>
              <p className="text-xs text-slate-400">{b.projectName} · Raised {b.dateRaised} by {b.raisedBy}</p>
              <p className="text-xs text-slate-300 mt-1">Needed: {b.whatIsNeeded}</p>
              <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-medium ${ESC[b.escalationStatus]}`}>{b.escalationStatus}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Team section ───────────────────────────────────────────────────────────────

function TeamSection({ initiative, projects }: { initiative: Initiative; projects: Project[] }) {
  const pms = [...new Set(projects.map((p) => p.pmName))].filter(Boolean);
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
            {pms.map((pm) => (
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

// ── Activity section ───────────────────────────────────────────────────────────

function ActivitySection({ initiative }: { initiative: Initiative }) {
  const events = [
    { time: initiative.updatedAt, actor: "System", action: "Initiative data last updated", note: "" },
    { time: new Date(Date.now() - 2 * 86400000).toISOString(), actor: initiative.owner, action: "Progress updated", note: `${initiative.progress}% complete` },
    { time: new Date(Date.now() - 5 * 86400000).toISOString(), actor: "TO Team", action: "EA alignment score updated", note: `${initiative.eaAlignmentScore ?? "TBD"}%` },
    { time: new Date(Date.now() - 10 * 86400000).toISOString(), actor: "System", action: "Initiative status", note: initiative.status },
  ];

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/5">
      {events.map((ev, i) => (
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const initiative = useMemo(() => getInitiatives().find((i) => i.id === id) ?? null, [id]);
  const [projects, setProjects] = useState<Project[]>(() => (id ? getProjects(id) : []));
  const [activeSection, setActiveSection] = useState<InsightSection>("health");
  const [role, setRole] = useState<LifecycleInsightsRole | null>(() => getLifecycleRole());
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceType, setServiceType] = useState<LCServiceType>(INITIATIVE_LEVEL_SERVICES[0]);
  const [servicePriority, setServicePriority] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [serviceNotes, setServiceNotes] = useState("");

  useEffect(() => {
    if (!isUserAuthenticated()) {
      navigate(`/marketplaces/lifecycle-management/initiative/${id}`);
    }
  }, [id, navigate]);

  const refresh = () => setProjects(id ? getProjects(id) : []);
  const isOwner = role === "initiative-owner";
  const account = role ? getDemoAccount(role) : null;

  const openRequestService = () => {
    setServiceType(INITIATIVE_LEVEL_SERVICES[0]);
    setServicePriority("Medium");
    setServiceNotes("");
    setServiceModalOpen(true);
  };

  const submitServiceRequest = () => {
    if (!initiative) return;
    const currentRole = role ?? "general-staff";
    const account = getDemoAccount(currentRole);
    addLCRequest({
      serviceType,
      initiativeId: initiative.id,
      initiativeName: initiative.name,
      submittedBy: account.name,
      submittedByRole: LIFECYCLE_ROLE_LABELS[currentRole],
      status: "Submitted",
      priority: servicePriority,
      notes: serviceNotes.trim() || undefined,
      slaHours: LC_SERVICE_SLA[serviceType],
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
          <button
            onClick={() => navigate("/marketplaces/lifecycle-management")}
            className="text-teal-400 hover:text-teal-300 text-sm underline"
          >
            Back to Lifecycle Management
          </button>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "health":     return <HealthSection initiative={initiative} projects={projects} />;
      case "projects":   return <ProjectsSection projects={projects} isOwner={isOwner} onRefresh={refresh} />;
      case "budget":     return <BudgetSection initiative={initiative} projects={projects} />;
      case "milestones": return <MilestonesSection projects={projects} isOwner={isOwner} onRefresh={refresh} />;
      case "risks":      return <RisksSection projects={projects} />;
      case "blockers":   return <BlockersSection projects={projects} />;
      case "team":       return <TeamSection initiative={initiative} projects={projects} />;
      case "activity":   return <ActivitySection initiative={initiative} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      {/* Top bar */}
      <div className="bg-slate-900 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/marketplaces/lifecycle-management/initiative/${id}`)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Initiative
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
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">
                {SECTIONS.find((s) => s.id === activeSection)?.label}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {activeSection === "health" && "Overall programme health, progress and key metrics"}
                {activeSection === "projects" && "All projects linked to this initiative with RAG status"}
                {activeSection === "budget" && "Budget allocation, spend tracking and forecast"}
                {activeSection === "milestones" && "Aggregated milestone tracker across all projects"}
                {activeSection === "risks" && "Risk register sorted by severity"}
                {activeSection === "blockers" && "Open blockers requiring resolution or escalation"}
                {activeSection === "team" && "Programme team and stakeholder contacts"}
                {activeSection === "activity" && "Recent activity and audit log"}
              </p>
            </div>
            {renderSection()}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-28 bg-slate-900 border border-white/10 rounded-xl p-5 space-y-5">

              {/* Initiative summary */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Initiative</p>
                <h3 className="text-sm font-bold text-white leading-snug mb-1">{initiative.name}</h3>
                <p className="text-xs text-slate-400">{initiative.division}</p>
              </div>

              <div className="border-t border-white/10" />

              {/* Key facts */}
              <div className="space-y-2.5">
                {[
                  { label: "Status", value: initiative.status },
                  { label: "Owner", value: initiative.owner },
                  { label: "Type", value: initiative.type },
                  { label: "Target Date", value: initiative.targetDate },
                  { label: "EA Alignment", value: initiative.eaAlignmentScore !== null ? `${initiative.eaAlignmentScore}%` : "TBD" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
                    <span className="text-xs text-slate-300 text-right font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-white font-semibold">{initiative.progress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-400 rounded-full transition-all"
                    style={{ width: `${initiative.progress}%` }}
                  />
                </div>
              </div>

              <div className="border-t border-white/10" />

              {/* Request Service CTA */}
              <button
                onClick={openRequestService}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <FileText className="w-4 h-4" />
                Request Service
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
          onSuccess={(r) => { setRole(r); setRoleModalOpen(false); }}
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
              <p className="text-sm font-semibold text-slate-900">{initiative?.name}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Service Type</label>
                <Select value={serviceType} onValueChange={(v) => setServiceType(v as LCServiceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INITIATIVE_LEVEL_SERVICES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Priority</label>
                <Select value={servicePriority} onValueChange={(v) => setServicePriority(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Critical", "High", "Medium", "Low"] as const).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">SLA (hours)</label>
                <Input value={String(LC_SERVICE_SLA[serviceType])} readOnly />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Notes (optional)</label>
                <Textarea
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="What do you need from the TO team?"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceModalOpen(false)}>Cancel</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submitServiceRequest}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
