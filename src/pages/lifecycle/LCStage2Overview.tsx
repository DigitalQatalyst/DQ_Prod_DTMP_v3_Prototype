import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Clock3,
  FolderKanban,
  RefreshCw,
  ShieldAlert,
  Siren,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { STRATEGIC_PRIORITY_BY_SLUG } from "@/data/strategicPriorities";
import {
  INITIATIVE_LEVEL_SERVICES,
  LC_SERVICE_SLA,
  addLCRequest,
  getLCRequests,
  getLCRequestsByInitiative,
  type LCRequestStatus,
  type LCServiceRequest,
  type LCServiceType,
} from "@/data/lifecycle/serviceRequestState";
import {
  type ActivityEntry,
  type ActivityEntryType,
  type Blocker,
  type BudgetHealth,
  computeInitiativeRAG,
  getBlockersByInitiativeId,
  getInitiativeById,
  getInitiatives,
  getProjectsByInitiativeId,
  type Initiative,
  type MilestoneStatus,
  type Project,
  type RAGStatus,
  type Risk,
  type InitiativeStatus,
  updateInitiativeBudgetSpent,
  updateInitiativeName,
  updateInitiativeProgress,
  updateInitiativeStatus,
  updateMilestoneStatus,
  updateBlockerEscalation,
  updateProjectBudgetSpent,
  updateProjectBudgetHealth,
  updateProjectProgress,
  updateProjectRAG,
  updateRiskStatus,
  resolveBlocker,
} from "@/data/shared/lifecyclePortfolioStore";
import {
  getDemoAccount,
  getLifecycleRole,
  LIFECYCLE_ROLE_LABELS,
  setLifecycleRole,
  type LifecycleInsightsRole,
} from "@/data/shared/lifecycleRole";

const ACTIVE_INITIATIVE_STATUSES: InitiativeStatus[] = ["Active", "Scoping", "At Risk"];
const ACTIVE_REQUEST_STATUSES: LCServiceRequest["status"][] = ["Submitted", "Assigned", "In Progress"];
const ROLE_OPTIONS: LifecycleInsightsRole[] = ["initiative-owner", "senior-stakeholder", "general-staff"];
const PRIORITY_OPTIONS = ["Critical", "High", "Medium", "Low"] as const;
const MILESTONE_STATUS_OPTIONS: Array<"All" | MilestoneStatus> = [
  "All",
  "Complete",
  "In Progress",
  "Not Started",
  "Delayed",
];
const MILESTONE_SORT_OPTIONS = ["due-date", "project", "status"] as const;
const RISK_STATUS_OPTIONS: Array<"All" | Risk["status"]> = ["All", "Open", "Mitigated", "Accepted", "Closed"];
const RISK_SORT_OPTIONS = ["severity", "status"] as const;
const BLOCKER_ESCALATION_BADGE_CLASSES: Record<Blocker["escalationStatus"], string> = {
  "Not Escalated": "bg-slate-100 text-slate-700 border-slate-200",
  "Escalated to TO": "bg-amber-100 text-amber-800 border-amber-200",
  "Escalated to Division Head": "bg-red-100 text-red-700 border-red-200",
};
const INITIATIVE_BUDGET_NOTE_KEY = "dtmp.lifecycle.initiativeBudgetNotes";
const COCKPIT_TABS = [
  "Overview",
  "Projects",
  "Milestones",
  "Risks",
  "Blockers",
  "Budget",
  "Activity",
  "Service Requests",
] as const;

const STATUS_BADGE_CLASSES: Record<InitiativeStatus, string> = {
  Active: "bg-teal-100 text-teal-700 border-teal-200",
  Scoping: "bg-blue-100 text-blue-700 border-blue-200",
  "At Risk": "bg-amber-100 text-amber-800 border-amber-200",
  "On Hold": "bg-slate-200 text-slate-600 border-slate-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Clarification Requested": "bg-sky-100 text-sky-700 border-sky-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
};

const RAG_BADGE_CLASSES = {
  Green: "bg-green-100 text-green-700 border-green-200",
  Amber: "bg-amber-100 text-amber-800 border-amber-200",
  Red: "bg-red-100 text-red-700 border-red-200",
} as const;

const BUDGET_HEALTH_BADGE_CLASSES = {
  "On Track": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "At Risk": "bg-amber-100 text-amber-800 border-amber-200",
  "Over Budget": "bg-red-100 text-red-700 border-red-200",
} as const;

const RISK_SEVERITY_BADGE_CLASSES: Record<Risk["severity"], string> = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-amber-100 text-amber-800 border-amber-200",
  Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const SEVERITY_RANK: Record<Risk["severity"], number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const fmtDateTime = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const deadlineFor = (request: LCServiceRequest) =>
  new Date(new Date(request.submittedAt).getTime() + request.slaHours * 60 * 60 * 1000);

const overdueHours = (request: LCServiceRequest) =>
  Math.max(0, Math.floor((Date.now() - deadlineFor(request).getTime()) / (60 * 60 * 1000)));

const isSlaAtRisk = (request: LCServiceRequest) =>
  ACTIVE_REQUEST_STATUSES.includes(request.status) && Date.now() > deadlineFor(request).getTime();

const formatAed = (value: number | null) =>
  value == null ? "TBC" : `AED ${value.toLocaleString("en-US")}`;

const computeBudgetHealth = (total: number | null, spent: number) => {
  if (total == null || total <= 0) return "On Track" as const;
  const remainingRatio = (total - spent) / total;
  if (remainingRatio > 0.2) return "On Track" as const;
  if (remainingRatio >= 0.1) return "At Risk" as const;
  return "Over Budget" as const;
};

const readInitiativeBudgetNotes = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(INITIATIVE_BUDGET_NOTE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeInitiativeBudgetNotes = (notes: Record<string, string>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INITIATIVE_BUDGET_NOTE_KEY, JSON.stringify(notes));
};

function WorkspaceOverview({
  role,
  onRoleChange,
}: {
  role: LifecycleInsightsRole;
  onRoleChange: (role: LifecycleInsightsRole) => void;
}) {
  const navigate = useNavigate();
  const currentUser = getDemoAccount(role);

  const [initiatives, setInitiatives] = useState<Initiative[]>(() => getInitiatives());
  const [requests, setRequests] = useState<LCServiceRequest[]>(() => getLCRequests());
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [serviceType, setServiceType] = useState<LCServiceType>(INITIATIVE_LEVEL_SERVICES[0]);
  const [servicePriority, setServicePriority] = useState<(typeof PRIORITY_OPTIONS)[number]>("Medium");
  const [serviceInitiativeId, setServiceInitiativeId] = useState<string>("");
  const [serviceNotes, setServiceNotes] = useState("");

  useEffect(() => {
    const refresh = () => {
      setInitiatives(getInitiatives());
      setRequests(getLCRequests());
    };

    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const divisionInitiatives = useMemo(
    () =>
      initiatives.filter(
        (initiative) =>
          initiative.division === currentUser.division || initiative.division === "All Divisions"
      ),
    [initiatives, currentUser.division]
  );

  const activeDivisionInitiatives = useMemo(
    () => divisionInitiatives.filter((initiative) => ACTIVE_INITIATIVE_STATUSES.includes(initiative.status)),
    [divisionInitiatives]
  );

  const ragSummary = useMemo(
    () =>
      activeDivisionInitiatives.reduce(
        (acc, initiative) => {
          acc[computeInitiativeRAG(initiative)] += 1;
          return acc;
        },
        { Green: 0, Amber: 0, Red: 0 } as Record<"Green" | "Amber" | "Red", number>
      ),
    [activeDivisionInitiatives]
  );

  const pendingActions = useMemo(() => {
    const milestonesDueSoon = divisionInitiatives.reduce((count, initiative) => {
      return count + getProjectsByInitiativeId(initiative.id).flatMap((project) => project.milestones).filter((milestone) => {
        if (milestone.status === "Complete") return false;
        const dueAt = new Date(milestone.dueDate).getTime();
        const daysUntilDue = Math.ceil((dueAt - Date.now()) / (24 * 60 * 60 * 1000));
        return daysUntilDue <= 7;
      }).length;
    }, 0);

    const unresolvedBlockers = divisionInitiatives.reduce(
      (count, initiative) =>
        count + getBlockersByInitiativeId(initiative.id).filter((blocker) => !blocker.resolved).length,
      0
    );

    const initiativeIds = new Set(divisionInitiatives.map((initiative) => initiative.id));
    const slaAtRisk = requests.filter((request) => initiativeIds.has(request.initiativeId) && isSlaAtRisk(request)).length;

    return { milestonesDueSoon, unresolvedBlockers, slaAtRisk };
  }, [divisionInitiatives, requests]);

  const slaAlerts = useMemo(() => {
    const initiativeIds = new Set(divisionInitiatives.map((initiative) => initiative.id));
    return requests
      .filter((request) => initiativeIds.has(request.initiativeId) && isSlaAtRisk(request))
      .sort((left, right) => overdueHours(right) - overdueHours(left))
      .slice(0, 6);
  }, [divisionInitiatives, requests]);

  const selectedInitiative = useMemo(
    () => divisionInitiatives.find((initiative) => initiative.id === serviceInitiativeId) ?? null,
    [divisionInitiatives, serviceInitiativeId]
  );

  const openShortcut = () => {
    setServiceType(INITIATIVE_LEVEL_SERVICES[0]);
    setServicePriority("Medium");
    setServiceInitiativeId(divisionInitiatives[0]?.id ?? "");
    setServiceNotes("");
    setShortcutOpen(true);
  };

  const submitShortcut = () => {
    if (!selectedInitiative) {
      toast({ title: "Select an initiative", description: "Choose an initiative before submitting the request." });
      return;
    }

    addLCRequest({
      serviceType,
      initiativeId: selectedInitiative.id,
      initiativeName: selectedInitiative.name,
      submittedBy: currentUser.name,
      submittedByRole: LIFECYCLE_ROLE_LABELS[role],
      status: "Submitted",
      priority: servicePriority,
      notes: serviceNotes.trim() || undefined,
      slaHours: LC_SERVICE_SLA[serviceType],
    });

    setShortcutOpen(false);
    setRequests(getLCRequests());
    toast({
      title: "Service request submitted",
      description: "The request is now visible in the lifecycle workspace tracker.",
    });
  };

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Stage 2 Workspace</p>
            <h1 className="text-3xl font-semibold text-slate-950">My Workspace Overview</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
              Division-scoped execution workspace for active initiatives, urgent delivery actions, and lifecycle support requests.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:min-w-[280px]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Viewing as</p>
              <div className="mt-2 grid gap-2">
                <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.title} · {currentUser.division}</p>
                <Select value={role} onValueChange={(value) => onRoleChange(value as LifecycleInsightsRole)}>
                  <SelectTrigger className="h-9 bg-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((roleOption) => (
                      <SelectItem key={roleOption} value={roleOption}>
                        {LIFECYCLE_ROLE_LABELS[roleOption]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={openShortcut}>
              New Service Request
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Active initiatives</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{activeDivisionInitiatives.length}</p>
            <p className="mt-1 text-sm text-slate-500">In {currentUser.division} scope</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">RAG breakdown</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["Green", "Amber", "Red"] as const).map((rag) => (
                <Badge key={rag} className={`border ${RAG_BADGE_CLASSES[rag]}`}>
                  {rag}: {ragSummary[rag]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending actions</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {pendingActions.milestonesDueSoon + pendingActions.unresolvedBlockers + pendingActions.slaAtRisk}
            </p>
            <p className="mt-1 text-sm text-slate-500">Across milestones, blockers, and SLA breaches</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">SLA alerts</p>
            <p className="mt-2 text-3xl font-semibold text-red-600">{pendingActions.slaAtRisk}</p>
            <p className="mt-1 text-sm text-slate-500">Requests past SLA deadline</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Pending Actions</h2>
                <p className="mt-1 text-sm text-slate-500">Priority operational items requiring attention in the next 7 days.</p>
              </div>
              <Badge variant="outline" className="border-slate-200 text-slate-600">
                {currentUser.division}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ActionCard
                icon={<Clock3 className="h-4 w-4 text-blue-700" />}
                label="Milestones due ≤ 7 days"
                value={pendingActions.milestonesDueSoon}
                tone="bg-blue-50 border-blue-200"
              />
              <ActionCard
                icon={<ShieldAlert className="h-4 w-4 text-amber-700" />}
                label="Unresolved blockers"
                value={pendingActions.unresolvedBlockers}
                tone="bg-amber-50 border-amber-200"
              />
              <ActionCard
                icon={<Siren className="h-4 w-4 text-red-700" />}
                label="SLA at risk"
                value={pendingActions.slaAtRisk}
                tone="bg-red-50 border-red-200"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">SLA Alerts</h2>
              <p className="mt-1 text-sm text-slate-500">Open requests already past deadline, sorted by breach severity.</p>
            </div>

            {slaAlerts.length === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                No SLA breaches in your current division scope.
              </div>
            ) : (
              <div className="space-y-3">
                {slaAlerts.map((request) => (
                  <div key={request.id} className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-950">{request.serviceType}</p>
                        <p className="mt-1 text-xs text-slate-600">{request.initiativeName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Submitted {fmtDate(request.submittedAt)} · Deadline {fmtDate(deadlineFor(request).toISOString())}
                        </p>
                      </div>
                      <Badge className="border border-red-200 bg-red-100 text-red-700">
                        {overdueHours(request)}h overdue
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">My Initiatives</h2>
              <p className="mt-1 text-sm text-slate-500">All initiatives in your division scope. Selecting one opens the Stage 2 cockpit route.</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/marketplaces/initiative-portfolio">Browse Portfolio</Link>
            </Button>
          </div>

          {divisionInitiatives.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              No initiatives are currently mapped to your division scope.
            </div>
          ) : (
            <div className="space-y-3">
              {divisionInitiatives
                .slice()
                .sort((left, right) => new Date(left.targetDate).getTime() - new Date(right.targetDate).getTime())
                .map((initiative) => {
                  const rag = computeInitiativeRAG(initiative);
                  return (
                    <div key={initiative.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-950">{initiative.name}</p>
                          <Badge className={`border ${STATUS_BADGE_CLASSES[initiative.status]}`}>{initiative.status}</Badge>
                          <Badge className={`border ${RAG_BADGE_CLASSES[rag]}`}>{rag}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>{initiative.type}</span>
                          <span>{initiative.division}</span>
                          <span>{initiative.progress}% progress</span>
                          <span>Target {fmtDate(initiative.targetDate)}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="shrink-0"
                        onClick={() => navigate(`/stage2/lifecycle-management/${initiative.id}`)}
                      >
                        Open Cockpit
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={shortcutOpen} onOpenChange={setShortcutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Service Request</DialogTitle>
            <DialogDescription>
              Shortcut request from the workspace overview. This uses your current lifecycle role and selected initiative.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <label className="text-sm font-medium text-slate-900">Initiative</label>
              <Select value={serviceInitiativeId} onValueChange={setServiceInitiativeId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select initiative" />
                </SelectTrigger>
                <SelectContent>
                  {divisionInitiatives.map((initiative) => (
                    <SelectItem key={initiative.id} value={initiative.id}>
                      {initiative.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900">Service Type</label>
              <Select value={serviceType} onValueChange={(value) => setServiceType(value as LCServiceType)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {INITIATIVE_LEVEL_SERVICES.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900">Priority</label>
              <Select value={servicePriority} onValueChange={(value) => setServicePriority(value as (typeof PRIORITY_OPTIONS)[number])}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              Expected SLA: <span className="font-semibold text-slate-900">{LC_SERVICE_SLA[serviceType]} hours</span>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900">Description</label>
              <Textarea
                value={serviceNotes}
                onChange={(event) => setServiceNotes(event.target.value)}
                className="mt-2"
                placeholder="What do you need from the Transformation Office?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShortcutOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={submitShortcut}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectDetailView({
  initiative,
  projectId,
}: {
  initiative: Initiative | null;
  projectId: string;
}) {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const role = getLifecycleRole() ?? "initiative-owner";
  const isOwner = role === "initiative-owner";
  const now = Date.now();

  // confirm dialog for RAG / budget health edits
  const [ragDialog, setRagDialog] = useState<RAGStatus | null>(null);
  const [bhDialog, setBhDialog] = useState<BudgetHealth | null>(null);
  const [progressDraft, setProgressDraft] = useState("");
  const [resolveDialog, setResolveDialog] = useState<{ projectId: string; blocker: Blocker } | null>(null);
  const [resolvedNote, setResolvedNote] = useState("");
  const [escalateDialog, setEscalateDialog] = useState<{
    type: "to" | "division";
    projectId: string;
    blocker: Blocker;
  } | null>(null);

  const refresh = () => {
    const p = getProjectsByInitiativeId(initiative?.id ?? "").find((x) => x.id === projectId) ?? null;
    setProject(p);
    if (p) setProgressDraft(String(p.progress));
  };

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [projectId, initiative?.id]);

  if (!initiative || !project) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-sm text-slate-500">Project not found.</p>
        <Button variant="outline" onClick={() => navigate(`/stage2/lifecycle-management/${initiative?.id ?? ""}`)}>
          Back to Initiative
        </Button>
      </div>
    );
  }

  const targetPast = new Date(project.targetDate).getTime() < now && project.progress < 100;
  const remaining = project.budget > 0 ? Math.max(project.budget - project.budgetSpent, 0) : null;

  const saveProgress = () => {
    const next = Math.min(100, Math.max(0, Math.round(Number(progressDraft))));
    if (!Number.isFinite(next)) return;
    updateProjectProgress(project.id, next);
    window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecycle.portfolioStore" }));
    refresh();
    toast({ title: "Progress updated", description: `Project progress set to ${next}%.` });
  };

  const confirmRag = () => {
    if (!ragDialog) return;
    updateProjectRAG(project.id, ragDialog);
    window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecycle.portfolioStore" }));
    refresh();
    setRagDialog(null);
    toast({ title: "RAG updated", description: `Project RAG set to ${ragDialog}.` });
  };

  const confirmBh = () => {
    if (!bhDialog) return;
    updateProjectBudgetHealth(project.id, bhDialog);
    window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecycle.portfolioStore" }));
    refresh();
    setBhDialog(null);
    toast({ title: "Budget health updated", description: `Budget health set to ${bhDialog}.` });
  };

  const submitEscalate = () => {
    if (!escalateDialog) return;
    const level = escalateDialog.type === "to" ? "Escalated to TO" : "Escalated to Division Head";
    updateBlockerEscalation(escalateDialog.projectId, escalateDialog.blocker.id, level);
    window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecyclePortfolio" }));
    refresh();
    setEscalateDialog(null);
    toast({ title: "Blocker escalated", description: `Escalated to ${escalateDialog.type === "to" ? "Transformation Office" : "Division Head"}.` });
  };

  const submitResolve = () => {
    if (!resolveDialog || !resolvedNote.trim()) {
      toast({ title: "Resolution note required", description: "Describe how the blocker was resolved." });
      return;
    }
    resolveBlocker(resolveDialog.projectId, resolveDialog.blocker.id, resolvedNote.trim());
    window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecyclePortfolio" }));
    refresh();
    setResolveDialog(null);
    setResolvedNote("");
    toast({ title: "Blocker resolved" });
  };

  return (
    <div className="space-y-8 p-6">
      {/* ── Header ── */}
      <div className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
              Project Detail · {initiative.name}
            </p>
            <h1 className="text-3xl font-semibold text-slate-950">{project.name}</h1>
            <p className="text-sm text-slate-500">{project.division} · PM: {project.pmName}</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/stage2/lifecycle-management/${initiative.id}`)}>
            ← Back to Initiative
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* RAG */}
          <Card className="border-slate-200">
            <CardContent className="p-5 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">RAG Status</p>
              <Badge className={`border text-sm ${RAG_BADGE_CLASSES[project.rag]}`}>{project.rag}</Badge>
              {isOwner && (
                <div className="flex gap-2 flex-wrap">
                  {(["Green", "Amber", "Red"] as RAGStatus[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={r === project.rag}
                      onClick={() => setRagDialog(r)}
                      className={`rounded px-2 py-1 text-xs font-medium border transition ${r === project.rag ? "opacity-40 cursor-default" : "hover:opacity-80"} ${RAG_BADGE_CLASSES[r]}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target date */}
          <Card className="border-slate-200">
            <CardContent className="p-5 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Target Date</p>
              <p className={`text-xl font-semibold ${targetPast ? "text-red-600" : "text-slate-950"}`}>
                {fmtDate(project.targetDate)}
              </p>
              {targetPast && <p className="text-xs text-red-500">Past due</p>}
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="border-slate-200">
            <CardContent className="p-5 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Progress</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-950">{project.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-orange-500 transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={progressDraft}
                    onChange={(e) => setProgressDraft(e.target.value)}
                    className="h-8 w-20 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900"
                  />
                  <Button variant="outline" size="sm" onClick={saveProgress}>Save</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget health */}
          <Card className="border-slate-200">
            <CardContent className="p-5 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Budget Health</p>
              <Badge className={`border text-sm ${BUDGET_HEALTH_BADGE_CLASSES[project.budgetHealth]}`}>
                {project.budgetHealth}
              </Badge>
              {isOwner && (
                <div className="flex gap-1.5 flex-wrap">
                  {(["On Track", "At Risk", "Over Budget"] as BudgetHealth[]).map((bh) => (
                    <button
                      key={bh}
                      type="button"
                      disabled={bh === project.budgetHealth}
                      onClick={() => setBhDialog(bh)}
                      className={`rounded px-2 py-1 text-xs font-medium border transition ${bh === project.budgetHealth ? "opacity-40 cursor-default" : "hover:opacity-80"} ${BUDGET_HEALTH_BADGE_CLASSES[bh]}`}
                    >
                      {bh}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Budget strip */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Budget</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatAed(project.budget)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Budget Spent</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatAed(project.budgetSpent)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Remaining</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatAed(remaining)}</p>
          </div>
        </div>
      </div>

      {/* ── Milestones ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">Milestones</h2>
        {project.milestones.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">No milestones for this project.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              <span>Milestone</span><span>Status</span><span>Due</span><span>Owner</span>
            </div>
            <div className="divide-y divide-slate-100">
              {project.milestones.map((m) => {
                const duePast = m.dueDate && new Date(m.dueDate).getTime() < now && m.status === "Delayed";
                return (
                  <div key={m.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 text-sm items-center">
                    <span className="font-medium text-slate-900">{m.name}</span>
                    <span>
                      {isOwner ? (
                        <Select value={m.status} onValueChange={(v) => { updateMilestoneStatus(project.id, m.id, v as MilestoneStatus); window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecyclePortfolio" })); refresh(); }}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["Complete", "In Progress", "Not Started", "Delayed"] as MilestoneStatus[]).map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="text-xs">{m.status}</Badge>
                      )}
                    </span>
                    <span className={`text-sm ${duePast ? "text-red-600 font-medium" : "text-slate-600"}`}>
                      {m.dueDate ? fmtDate(m.dueDate) : "—"}
                    </span>
                    <span className="text-slate-600 text-sm">{m.owner || "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ── Risks ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">Risks</h2>
        {project.risks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">No risks recorded for this project.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              <span>Risk</span><span>Severity</span><span>Likelihood</span><span>Status</span><span>Owner</span>
            </div>
            <div className="divide-y divide-slate-100">
              {project.risks.map((risk) => (
                <div key={risk.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-3.5 text-sm items-center">
                  <div>
                    <p className="font-medium text-slate-900">{risk.title}</p>
                    {risk.mitigation && <p className="text-xs text-slate-500 mt-0.5 truncate">{risk.mitigation}</p>}
                  </div>
                  <Badge className={`border text-xs w-fit ${RISK_SEVERITY_BADGE_CLASSES[risk.severity]}`}>{risk.severity}</Badge>
                  <span className="text-slate-600">{risk.likelihood}</span>
                  <span>
                    {isOwner ? (
                      <Select value={risk.status} onValueChange={(v) => { updateRiskStatus(project.id, risk.id, v as Risk["status"]); window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecyclePortfolio" })); refresh(); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["Open", "Mitigated", "Accepted", "Closed"] as Risk["status"][]).map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-xs">{risk.status}</Badge>
                    )}
                  </span>
                  <span className="text-slate-600">{risk.owner || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Blockers ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">Blockers</h2>
        {project.blockers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">No blockers recorded for this project.</div>
        ) : (
          <div className="space-y-3">
            {project.blockers.map((blocker) => (
              <div key={blocker.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{blocker.title}</span>
                      <Badge
                        className={`border text-xs ${
                          blocker.escalationStatus === "Not Escalated"
                            ? "bg-slate-100 text-slate-600 border-slate-200"
                            : blocker.escalationStatus === "Escalated to TO"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }`}
                      >
                        {blocker.escalationStatus}
                      </Badge>
                      {blocker.resolved && (
                        <Badge className="border bg-green-100 text-green-700 border-green-200 text-xs">Resolved</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Raised by {blocker.raisedBy} · {fmtDate(blocker.dateRaised)}
                    </p>
                    {blocker.whatIsNeeded && (
                      <p className="text-sm text-slate-700 mt-1">{blocker.whatIsNeeded}</p>
                    )}
                    {blocker.resolvedNote && (
                      <p className="text-xs text-green-700 mt-1">Resolution: {blocker.resolvedNote}</p>
                    )}
                  </div>
                  {isOwner && !blocker.resolved && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {blocker.escalationStatus === "Not Escalated" && (
                        <Button variant="outline" size="sm" onClick={() => setEscalateDialog({ type: "to", projectId: project.id, blocker })}>
                          Escalate to TO
                        </Button>
                      )}
                      {blocker.escalationStatus === "Escalated to TO" && (
                        <Button variant="outline" size="sm" onClick={() => setEscalateDialog({ type: "division", projectId: project.id, blocker })}>
                          Escalate to Division Head
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => { setResolvedNote(blocker.resolvedNote ?? ""); setResolveDialog({ projectId: project.id, blocker }); }}>
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── RAG confirm dialog ── */}
      <Dialog open={ragDialog !== null} onOpenChange={() => setRagDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm RAG Update</DialogTitle>
            <DialogDescription>
              Change project RAG to <strong>{ragDialog}</strong>? This will be logged in the initiative activity.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRagDialog(null)}>Cancel</Button>
            <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={confirmRag}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Budget health confirm dialog ── */}
      <Dialog open={bhDialog !== null} onOpenChange={() => setBhDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Budget Health Update</DialogTitle>
            <DialogDescription>
              Change budget health to <strong>{bhDialog}</strong>? This will be logged in the initiative activity.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBhDialog(null)}>Cancel</Button>
            <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={confirmBh}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Escalate blocker dialog ── */}
      <Dialog open={escalateDialog !== null} onOpenChange={() => setEscalateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Blocker</DialogTitle>
            <DialogDescription>
              Escalate <strong>{escalateDialog?.blocker.title}</strong> to{" "}
              {escalateDialog?.type === "to" ? "the Transformation Office" : "the Division Head"}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateDialog(null)}>Cancel</Button>
            <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={submitEscalate}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Resolve blocker dialog ── */}
      <Dialog open={resolveDialog !== null} onOpenChange={() => { setResolveDialog(null); setResolvedNote(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Blocker</DialogTitle>
            <DialogDescription>Describe how <strong>{resolveDialog?.blocker.title}</strong> was resolved.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={resolvedNote}
            onChange={(e) => setResolvedNote(e.target.value)}
            placeholder="Resolution note…"
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResolveDialog(null); setResolvedNote(""); }}>Cancel</Button>
            <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={submitResolve}>Mark Resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InitiativeCockpitShell({
  initiativeId,
  role,
}: {
  initiativeId: string;
  role: LifecycleInsightsRole;
}) {
  const navigate = useNavigate();
  const [initiatives, setInitiatives] = useState<Initiative[]>(() => getInitiatives());
  const [activeTab, setActiveTab] = useState<(typeof COCKPIT_TABS)[number]>("Overview");
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    const refresh = () => setInitiatives(getInitiatives());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const initiative = useMemo(
    () => initiatives.find((item) => item.id === initiativeId) ?? getInitiativeById(initiativeId) ?? null,
    [initiativeId, initiatives]
  );
  const projects = useMemo<Project[]>(() => getProjectsByInitiativeId(initiativeId), [initiativeId, initiatives]);
  const rag = initiative ? computeInitiativeRAG(initiative) : "Green";
  const isOwner = role === "initiative-owner";

  useEffect(() => {
    setNameDraft(initiative?.name ?? "");
  }, [initiative?.name]);

  if (!initiative) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Initiative Cockpit</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-950">Initiative not found</h1>
                <p className="mt-2 text-sm text-slate-600">
                  The requested initiative could not be resolved from the current lifecycle store.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/stage2/lifecycle-management")}>
                Back to Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveName = () => {
    const updated = updateInitiativeName(initiative.id, nameDraft);
    if (!updated) {
      toast({
        title: "Name not updated",
        description: "Enter a non-empty initiative name before saving.",
      });
      return;
    }
    setInitiatives(getInitiatives());
    toast({
      title: "Initiative name updated",
      description: "The cockpit header now reflects the latest stored name.",
    });
  };

  const handleStatusChange = (nextStatus: InitiativeStatus) => {
    updateInitiativeStatus(initiative.id, nextStatus);
    setInitiatives(getInitiatives());
    toast({
      title: "Status updated",
      description: `Initiative status changed to ${nextStatus}.`,
    });
  };

  const handleProgressChange = (nextProgress: number) => {
    updateInitiativeProgress(initiative.id, nextProgress);
    setInitiatives(getInitiatives());
    toast({
      title: "Progress updated",
      description: `Initiative progress changed to ${nextProgress}%.`,
    });
  };

  const budgetRemaining = initiative.budget == null ? null : Math.max(initiative.budget - initiative.budgetSpent, 0);
  const strategicPriority = initiative.strategicPriority
    ? STRATEGIC_PRIORITY_BY_SLUG[initiative.strategicPriority]
    : null;
  const milestoneDates = projects.flatMap((project) => project.milestones.map((milestone) => milestone.dueDate));
  const plannedStartDate = milestoneDates.length
    ? milestoneDates.reduce((earliest, value) => (value < earliest ? value : earliest))
    : null;
  const forecastEndDate = projects.length
    ? projects.reduce((latest, project) => (project.targetDate > latest ? project.targetDate : latest), projects[0].targetDate)
    : null;

  return (
    <div className="space-y-6 p-6">
      <section className="sticky top-0 z-10 -mx-6 border-b border-slate-200 bg-slate-50/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                  Initiative Cockpit
                </Badge>
                <Badge className={`border ${RAG_BADGE_CLASSES[rag]}`}>{rag}</Badge>
              </div>

              <div className="flex flex-col gap-3">
                {isOwner ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      className="h-11 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-lg font-semibold text-slate-950 shadow-sm outline-none ring-0 transition focus:border-orange-500"
                    />
                    <Button
                      variant="outline"
                      onClick={saveName}
                      disabled={!nameDraft.trim() || nameDraft.trim() === initiative.name}
                    >
                      Save Name
                    </Button>
                  </div>
                ) : (
                  <h1 className="text-3xl font-semibold text-slate-950">{initiative.name}</h1>
                )}

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span>{initiative.division}</span>
                  <span>{initiative.type}</span>
                  <span>{initiative.owner}</span>
                  <span>{projects.length} projects</span>
                </div>

                {initiative.strategicPriority ? (
                  <div className="text-sm text-slate-600">
                    Strategic priority: <span className="font-medium text-slate-900">{initiative.strategicPriority}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Select
                value={initiative.status}
                onValueChange={(value) => handleStatusChange(value as InitiativeStatus)}
                disabled={!isOwner}
              >
                <SelectTrigger className="h-10 w-[220px] bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(STATUS_BADGE_CLASSES).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => navigate("/stage2/lifecycle-management")}>
                Back to Workspace
              </Button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Progress</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{initiative.progress}%</p>
                  </div>
                  {isOwner ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={initiative.progress}
                        onChange={(event) => handleProgressChange(Number(event.target.value))}
                        className="w-48"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      rag === "Red" ? "bg-red-500" : rag === "Amber" ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${initiative.progress}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
                <BudgetCell label="Total" value={formatAed(initiative.budget)} />
                <BudgetCell label="Spent" value={formatAed(initiative.budgetSpent)} />
                <BudgetCell label="Remaining" value={formatAed(budgetRemaining)} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {COCKPIT_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                tab === activeTab
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <Card className="border-slate-200">
          <CardContent className="space-y-5 p-6">
            {activeTab === "Overview" ? (
              <OverviewTabContent
                initiative={initiative}
                projects={projects}
                plannedStartDate={plannedStartDate}
                forecastEndDate={forecastEndDate}
                strategicPriority={strategicPriority}
              />
            ) : activeTab === "Projects" ? (
              <ProjectsTabContent initiative={initiative} projects={projects} />
            ) : activeTab === "Milestones" ? (
              <MilestonesTabContent initiative={initiative} projects={projects} role={role} />
            ) : activeTab === "Risks" ? (
              <RisksTabContent initiative={initiative} projects={projects} role={role} />
            ) : activeTab === "Blockers" ? (
              <BlockersTabContent initiative={initiative} projects={projects} role={role} />
            ) : activeTab === "Budget" ? (
              <BudgetTabContent initiative={initiative} projects={projects} role={role} />
            ) : activeTab === "Activity" ? (
              <ActivityTabContent initiative={initiative} />
            ) : activeTab === "Service Requests" ? (
              <ServiceRequestsTabContent initiative={initiative} role={role} />
            ) : (
              <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">{activeTab}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">Initiative Management Cockpit</h2>
                    <p className="mt-2 max-w-3xl text-sm text-slate-600">
                      The cockpit shell is live. The header state is bound to the lifecycle store, and the tab surface is now ready for the Stage 2 tab builds.
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit border-slate-200 text-slate-600">
                    Next build: {nextStage2TaskForTab(activeTab)}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <RouteStatCard icon={<FolderKanban className="h-5 w-5 text-blue-700" />} label="Initiative ID" value={initiative.id} />
                  <RouteStatCard icon={<Briefcase className="h-5 w-5 text-emerald-700" />} label="Projects" value={String(projects.length)} />
                  <RouteStatCard icon={<AlertTriangle className="h-5 w-5 text-amber-700" />} label="Target Date" value={fmtDate(initiative.targetDate)} />
                  <RouteStatCard icon={<RefreshCw className="h-5 w-5 text-orange-700" />} label="Updated" value={fmtDate(initiative.updatedAt)} />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-900">Current shell scope</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>Header is always visible above the tab navigation.</li>
                    <li>Status, progress, and initiative name persist back to the shared lifecycle store.</li>
                    <li>Tabs are wired and ready for the content builds that follow.</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ── Service Requests Tab ──────────────────────────────────────────────────────

const SR_STATUS_BADGE: Record<LCRequestStatus, string> = {
  Submitted: "bg-blue-100 text-blue-800 border-blue-200",
  Assigned: "bg-purple-100 text-purple-800 border-purple-200",
  "In Progress": "bg-amber-100 text-amber-800 border-amber-200",
  Delivered: "bg-teal-100 text-teal-800 border-teal-200",
  Completed: "bg-green-100 text-green-800 border-green-200",
};

const SR_PRIORITY_BADGE: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 border-red-200",
  High: "bg-orange-100 text-orange-800 border-orange-200",
  Medium: "bg-amber-100 text-amber-800 border-amber-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

const SR_STATUS_OPTIONS: Array<"All" | LCRequestStatus> = [
  "All",
  "Submitted",
  "Assigned",
  "In Progress",
  "Delivered",
  "Completed",
];

const NEW_REQUEST_SERVICES: LCServiceType[] = [...INITIATIVE_LEVEL_SERVICES];

function fmtSlaDeadline(submittedAt: string, slaHours: number): { label: string; overdue: boolean } {
  const deadline = new Date(new Date(submittedAt).getTime() + slaHours * 60 * 60 * 1000);
  const overdue = deadline.getTime() < Date.now();
  const day = String(deadline.getDate()).padStart(2, "0");
  const month = deadline.toLocaleString("en-GB", { month: "short" });
  const year = deadline.getFullYear();
  return { label: `${day} ${month} ${year}`, overdue };
}

function daysAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
}

function ServiceRequestsTabContent({
  initiative,
  role,
}: {
  initiative: Initiative;
  role: LifecycleInsightsRole;
}) {
  const [requests, setRequests] = useState<LCServiceRequest[]>(() =>
    getLCRequestsByInitiative(initiative.id)
  );
  const [statusFilter, setStatusFilter] = useState<"All" | LCRequestStatus>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // New request form state
  const [newType, setNewType] = useState<LCServiceType>("Initiative Status Report");
  const [newPriority, setNewPriority] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [newDescription, setNewDescription] = useState("");
  const [newContext, setNewContext] = useState("");

  const isOwner = role === "initiative-owner";
  const account = getDemoAccount(role);

  useEffect(() => {
    const refresh = () => setRequests(getLCRequestsByInitiative(initiative.id));
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [initiative.id]);

  const filtered = useMemo(
    () => (statusFilter === "All" ? requests : requests.filter((r) => r.status === statusFilter)),
    [requests, statusFilter]
  );

  const slaDeadlineForNew = useMemo(() => {
    const hours = LC_SERVICE_SLA[newType] ?? 120;
    const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
    const day = String(deadline.getDate()).padStart(2, "0");
    const month = deadline.toLocaleString("en-GB", { month: "short" });
    return `${day} ${month} ${deadline.getFullYear()}`;
  }, [newType]);

  const submitRequest = () => {
    if (!newDescription.trim()) {
      toast({ title: "Description required", description: "Please describe what you need and why." });
      return;
    }
    addLCRequest({
      serviceType: newType,
      initiativeId: initiative.id,
      initiativeName: initiative.name,
      submittedBy: account.name,
      submittedByRole: account.title,
      status: "Submitted",
      priority: newPriority,
      notes: [newDescription.trim(), newContext.trim()].filter(Boolean).join("\n\n"),
      slaHours: LC_SERVICE_SLA[newType] ?? 120,
    });
    window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecycle.serviceRequests" }));
    setRequests(getLCRequestsByInitiative(initiative.id));
    setShowForm(false);
    setNewDescription("");
    setNewContext("");
    toast({ title: "Service request submitted", description: "Your request has been sent to the Transformation Office." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Service Requests</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Service Requests</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Transformation Office service requests for {initiative.name}. Track status, SLA deadlines, and submit new requests.
          </p>
        </div>
        {isOwner && (
          <Button
            className="bg-orange-600 text-white hover:bg-orange-700 w-fit"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Cancel" : "+ New Request"}
          </Button>
        )}
      </div>

      {/* New request form */}
      {showForm && isOwner && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 space-y-5">
          <h3 className="text-base font-semibold text-slate-900">New Service Request</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Service Type</label>
              <Select value={newType} onValueChange={(v) => setNewType(v as LCServiceType)}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NEW_REQUEST_SERVICES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Priority</label>
              <Select value={newPriority} onValueChange={(v) => setNewPriority(v as typeof newPriority)}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["Critical", "High", "Medium", "Low"] as const).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-orange-200 bg-white px-4 py-3 text-sm text-slate-700">
            <span className="font-medium">SLA deadline:</span>{" "}
            <span className="text-orange-700 font-semibold">{slaDeadlineForNew}</span>
            <span className="text-slate-400 ml-2">({LC_SERVICE_SLA[newType]}h from submission)</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What do you need and why?"
              className="min-h-[100px] bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Supporting Context (optional)</label>
            <Textarea
              value={newContext}
              onChange={(e) => setNewContext(e.target.value)}
              placeholder="Any additional context, constraints, or references."
              className="min-h-[80px] bg-white"
            />
          </div>

          <div className="flex gap-3">
            <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={submitRequest}>
              Submit Request
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
        <div className="min-w-[220px]">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Filter by status</p>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "All" | LCRequestStatus)}>
            <SelectTrigger className="mt-2 bg-white">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {SR_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:ml-auto text-xs text-slate-500">
          {filtered.length} {filtered.length === 1 ? "request" : "requests"} · {requests.length} total
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-sm font-medium text-slate-600">No service requests found.</p>
          <p className="mt-1 text-xs text-slate-400">
            {isOwner ? 'Use "+ New Request" above to submit one.' : "Service requests will appear here once submitted."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const sla = fmtSlaDeadline(req.submittedAt, req.slaHours);
            const isExpanded = expandedId === req.id;
            return (
              <div
                key={req.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{req.serviceType}</span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SR_STATUS_BADGE[req.status]}`}>
                          {req.status}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SR_PRIORITY_BADGE[req.priority]}`}>
                          {req.priority}
                        </span>
                        {sla.overdue && req.status !== "Completed" && req.status !== "Delivered" && (
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            SLA Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>Submitted {daysAgo(req.submittedAt)} by {req.submittedBy}</span>
                        <span>·</span>
                        <span className={sla.overdue && req.status !== "Completed" && req.status !== "Delivered" ? "text-red-600 font-medium" : ""}>
                          SLA deadline: {sla.label}
                        </span>
                        <span>·</span>
                        <span>Assignee: {req.assignedTo ?? "Unassigned"}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 mt-0.5">{isExpanded ? "▲ Hide" : "▼ View"}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-4 text-sm">
                    {req.notes && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Description</p>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{req.notes}</p>
                      </div>
                    )}
                    {req.deliverableTitle && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Deliverable</p>
                        <p className="text-slate-800">{req.deliverableTitle}{req.deliverableFormat ? ` (${req.deliverableFormat})` : ""}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-600">
                      <div><span className="font-medium">Request ID:</span> {req.id}</div>
                      <div><span className="font-medium">SLA hours:</span> {req.slaHours}h</div>
                      <div><span className="font-medium">Submitted:</span> {fmtActivityTimestamp(req.submittedAt)}</div>
                      <div><span className="font-medium">Last updated:</span> {fmtActivityTimestamp(req.updatedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────────

const ACTIVITY_TYPE_BADGE: Record<ActivityEntryType, string> = {
  "Status Change": "bg-blue-100 text-blue-800 border-blue-200",
  Milestone: "bg-green-100 text-green-800 border-green-200",
  Risk: "bg-amber-100 text-amber-800 border-amber-200",
  Blocker: "bg-red-100 text-red-800 border-red-200",
  Budget: "bg-purple-100 text-purple-800 border-purple-200",
  "Service Request": "bg-orange-100 text-orange-800 border-orange-200",
  Submission: "bg-teal-100 text-teal-800 border-teal-200",
};

const ACTIVITY_TYPE_OPTIONS: Array<"All" | ActivityEntryType> = [
  "All",
  "Status Change",
  "Milestone",
  "Risk",
  "Blocker",
  "Budget",
  "Service Request",
  "Submission",
];

const PAGE_SIZE = 20;

function fmtActivityTimestamp(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-GB", { month: "short" });
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} ${hh}:${mm}`;
}

function ActivityTabContent({ initiative }: { initiative: Initiative }) {
  const [typeFilter, setTypeFilter] = useState<"All" | ActivityEntryType>("All");
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<ActivityEntry[]>(() => [...(initiative.activity ?? [])]);

  useEffect(() => {
    setEntries([...(initiative.activity ?? [])]);
  }, [initiative]);

  useEffect(() => {
    const refresh = () => {
      const latest = getInitiativeById(initiative.id);
      setEntries([...(latest?.activity ?? [])]);
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [initiative.id]);

  const filtered = useMemo(
    () => (typeFilter === "All" ? entries : entries.filter((e) => e.type === typeFilter)),
    [entries, typeFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Activity</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Activity Log</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Chronological record of all changes made to {initiative.name} — status updates, milestones, risks, blockers, budget, and service requests.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-slate-200 text-slate-600">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
        </Badge>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
        <div className="min-w-[220px]">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Filter by type</p>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as "All" | ActivityEntryType); setPage(1); }}>
            <SelectTrigger className="mt-2 bg-white">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:ml-auto text-xs text-slate-500">
          Sorted most recent first · {entries.length} total events
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-sm font-medium text-slate-600">No activity recorded yet.</p>
          <p className="mt-1 text-xs text-slate-400">
            Events are logged automatically when status, milestones, risks, blockers, budget, or service requests change.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid grid-cols-[160px_140px_1fr_130px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              <span>Timestamp</span>
              <span>Actor</span>
              <span>Action</span>
              <span>Type</span>
            </div>
            <div className="divide-y divide-slate-100">
              {pageSlice.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-[160px_140px_1fr_130px] gap-4 px-5 py-3.5 text-sm hover:bg-slate-50 transition-colors"
                >
                  <span className="font-mono text-xs text-slate-500 leading-relaxed pt-0.5">
                    {fmtActivityTimestamp(entry.timestamp)}
                  </span>
                  <span className="text-slate-700 font-medium truncate">{entry.actor}</span>
                  <span className="text-slate-800 leading-relaxed">{entry.action}</span>
                  <span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ACTIVITY_TYPE_BADGE[entry.type]}`}>
                      {entry.type}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
              <span className="text-xs text-slate-500">
                Page {safePage} of {totalPages} ({filtered.length} entries)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BudgetTabContent({
  initiative,
  projects,
  role,
}: {
  initiative: Initiative;
  projects: Project[];
  role: LifecycleInsightsRole;
}) {
  const [currentInitiative, setCurrentInitiative] = useState<Initiative>(initiative);
  const [projectRows, setProjectRows] = useState<Project[]>(projects);
  const [initiativeSpendDraft, setInitiativeSpendDraft] = useState(String(initiative.budgetSpent));
  const [projectSpendDrafts, setProjectSpendDrafts] = useState<Record<string, string>>(
    Object.fromEntries(projects.map((project) => [project.id, String(project.budgetSpent)]))
  );
  const [budgetNote, setBudgetNote] = useState("");
  const isOwner = role === "initiative-owner";

  useEffect(() => {
    setCurrentInitiative(initiative);
    setInitiativeSpendDraft(String(initiative.budgetSpent));
  }, [initiative]);

  useEffect(() => {
    setProjectRows(projects);
    setProjectSpendDrafts(Object.fromEntries(projects.map((project) => [project.id, String(project.budgetSpent)])));
  }, [projects]);

  useEffect(() => {
    const refresh = () => {
      const nextInitiative = getInitiativeById(initiative.id);
      if (nextInitiative) {
        setCurrentInitiative(nextInitiative);
        setInitiativeSpendDraft(String(nextInitiative.budgetSpent));
      }

      const nextProjects = getProjectsByInitiativeId(initiative.id);
      setProjectRows(nextProjects);
      setProjectSpendDrafts(Object.fromEntries(nextProjects.map((project) => [project.id, String(project.budgetSpent)])));
      setBudgetNote(readInitiativeBudgetNotes()[initiative.id] ?? "");
    };

    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [initiative.id]);

  const initiativeHealth = computeBudgetHealth(currentInitiative.budget, currentInitiative.budgetSpent);
  const initiativeRemaining =
    currentInitiative.budget == null ? null : Math.max(currentInitiative.budget - currentInitiative.budgetSpent, 0);
  const maxProjectBudget = projectRows.reduce((max, project) => Math.max(max, project.budget), 0);

  const saveInitiativeSpend = () => {
    const nextSpent = Number(initiativeSpendDraft.replace(/,/g, ""));
    if (!Number.isFinite(nextSpent) || nextSpent < 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid initiative spend amount.",
      });
      return;
    }

    updateInitiativeBudgetSpent(currentInitiative.id, nextSpent);
    const nextInitiative = getInitiativeById(currentInitiative.id);
    if (nextInitiative) {
      setCurrentInitiative(nextInitiative);
      setInitiativeSpendDraft(String(nextInitiative.budgetSpent));
    }
    toast({
      title: "Initiative budget updated",
      description: "Initiative spend has been saved to the lifecycle store.",
    });
  };

  const saveProjectSpend = (projectId: string) => {
    const nextSpent = Number((projectSpendDrafts[projectId] ?? "").replace(/,/g, ""));
    if (!Number.isFinite(nextSpent) || nextSpent < 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid project spend amount.",
      });
      return;
    }

    updateProjectBudgetSpent(projectId, nextSpent);
    const nextProjects = getProjectsByInitiativeId(initiative.id);
    setProjectRows(nextProjects);
    setProjectSpendDrafts(Object.fromEntries(nextProjects.map((project) => [project.id, String(project.budgetSpent)])));
    toast({
      title: "Project budget updated",
      description: "Project spend has been saved to the lifecycle store.",
    });
  };

  const saveBudgetNote = () => {
    const nextNotes = {
      ...readInitiativeBudgetNotes(),
      [initiative.id]: budgetNote.trim(),
    };
    writeInitiativeBudgetNotes(nextNotes);
    toast({
      title: "Budget note saved",
      description: "The initiative budget note is stored for this workspace.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Budget</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Budget Control</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Initiative and project budget view for {initiative.name}, including inline spend updates, budget health, and workspace notes.
          </p>
        </div>
        <Badge className={`border ${BUDGET_HEALTH_BADGE_CLASSES[initiativeHealth]}`}>{initiativeHealth}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Budget</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{formatAed(currentInitiative.budget)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="space-y-3 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Budget Spent</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{formatAed(currentInitiative.budgetSpent)}</p>
            </div>
            {isOwner ? (
              <div className="flex gap-2">
                <input
                  value={initiativeSpendDraft}
                  onChange={(event) => setInitiativeSpendDraft(event.target.value)}
                  className="h-9 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                />
                <Button variant="outline" onClick={saveInitiativeSpend}>
                  Save
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Remaining</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{formatAed(initiativeRemaining)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardContent className="space-y-5 p-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Project Budget Table</h3>
            <p className="mt-1 text-sm text-slate-500">Per-project budget position with inline spend adjustment for initiative-owner role.</p>
          </div>

          {projectRows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              No project budgets are available for this initiative.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                <span>Project</span>
                <span>Total</span>
                <span>Spent</span>
                <span>Remaining</span>
                <span>Health</span>
              </div>
              <div className="divide-y divide-slate-200">
                {projectRows.map((project) => {
                  const health = computeBudgetHealth(project.budget, project.budgetSpent);
                  const remaining = Math.max(project.budget - project.budgetSpent, 0);
                  return (
                    <div
                      key={project.id}
                      className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 text-sm"
                    >
                      <div className="font-medium text-slate-900">{project.name}</div>
                      <div className="text-slate-700">{formatAed(project.budget)}</div>
                      <div className="space-y-2">
                        <div className="text-slate-700">{formatAed(project.budgetSpent)}</div>
                        {isOwner ? (
                          <div className="flex gap-2">
                            <input
                              value={projectSpendDrafts[project.id] ?? ""}
                              onChange={(event) =>
                                setProjectSpendDrafts((current) => ({ ...current, [project.id]: event.target.value }))
                              }
                              className="h-8 flex-1 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900"
                            />
                            <Button variant="outline" size="sm" onClick={() => saveProjectSpend(project.id)}>
                              Save
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <div className="text-slate-700">{formatAed(remaining)}</div>
                      <div>
                        <Badge className={`border ${BUDGET_HEALTH_BADGE_CLASSES[health]}`}>{health}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200">
          <CardContent className="space-y-5 p-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Budget Spend Bar Chart</h3>
              <p className="mt-1 text-sm text-slate-500">Simple seeded-data comparison of total vs spent budget per project.</p>
            </div>

            <div className="space-y-4">
              {projectRows.map((project) => {
                const totalWidth = maxProjectBudget > 0 ? (project.budget / maxProjectBudget) * 100 : 0;
                const spentWidth = project.budget > 0 ? Math.min((project.budgetSpent / project.budget) * totalWidth, totalWidth) : 0;
                return (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-900">{project.name}</span>
                      <span className="text-slate-500">
                        {formatAed(project.budgetSpent)} / {formatAed(project.budget)}
                      </span>
                    </div>
                    <div className="relative h-4 rounded-full bg-slate-100">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-slate-300" style={{ width: `${totalWidth}%` }} />
                      <div className="absolute inset-y-0 left-0 rounded-full bg-orange-500" style={{ width: `${spentWidth}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="space-y-5 p-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Budget Notes</h3>
              <p className="mt-1 text-sm text-slate-500">Initiative-scoped working note for budget context and decisions.</p>
            </div>

            <Textarea
              value={budgetNote}
              onChange={(event) => setBudgetNote(event.target.value)}
              className="min-h-[220px]"
              placeholder="Capture funding assumptions, trade-offs, or approvals."
              disabled={!isOwner}
            />

            {isOwner ? (
              <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={saveBudgetNote}>
                Save Note
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BlockersTabContent({
  initiative,
  projects,
  role,
}: {
  initiative: Initiative;
  projects: Project[];
  role: LifecycleInsightsRole;
}) {
  const [projectRows, setProjectRows] = useState<Project[]>(projects);
  const [actionDialog, setActionDialog] = useState<
    | null
    | {
        type: "escalate-to" | "escalate-division" | "resolve";
        projectId: string;
        blocker: Blocker;
      }
  >(null);
  const [resolvedNote, setResolvedNote] = useState("");
  const isOwner = role === "initiative-owner";

  useEffect(() => {
    setProjectRows(projects);
  }, [projects]);

  useEffect(() => {
    const refresh = () => setProjectRows(getProjectsByInitiativeId(initiative.id));
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [initiative.id]);

  const rows = useMemo(
    () =>
      projectRows.flatMap((project) =>
        project.blockers.map((blocker) => ({
          projectId: project.id,
          projectName: project.name,
          blocker,
        }))
      ),
    [projectRows]
  );

  const openActionDialog = (
    type: "escalate-to" | "escalate-division" | "resolve",
    projectId: string,
    blocker: Blocker
  ) => {
    setResolvedNote(blocker.resolvedNote ?? "");
    setActionDialog({ type, projectId, blocker });
  };

  const closeActionDialog = () => {
    setResolvedNote("");
    setActionDialog(null);
  };

  const refreshRows = () => setProjectRows(getProjectsByInitiativeId(initiative.id));

  const submitAction = () => {
    if (!actionDialog) return;

    if (actionDialog.type === "escalate-to") {
      updateBlockerEscalation(actionDialog.projectId, actionDialog.blocker.id, "Escalated to TO");
      window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecyclePortfolio" }));
      refreshRows();
      toast({
        title: "Blocker escalated",
        description: "The blocker is now escalated to the Transformation Office.",
      });
      closeActionDialog();
      return;
    }

    if (actionDialog.type === "escalate-division") {
      updateBlockerEscalation(actionDialog.projectId, actionDialog.blocker.id, "Escalated to Division Head");
      window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecyclePortfolio" }));
      refreshRows();
      toast({
        title: "Blocker escalated",
        description: "The blocker is now escalated to the Division Head.",
      });
      closeActionDialog();
      return;
    }

    if (!resolvedNote.trim()) {
      toast({
        title: "Resolution note required",
        description: "Enter a resolution note before resolving this blocker.",
      });
      return;
    }

    resolveBlocker(actionDialog.projectId, actionDialog.blocker.id, resolvedNote.trim());
    refreshRows();
    toast({
      title: "Blocker resolved",
      description: "The blocker has been marked resolved.",
    });
    closeActionDialog();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Blockers</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Blocker Register</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Cross-project blocker view for {initiative.name}, with escalation controls and resolution workflow for initiative-owner role.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-slate-200 text-slate-600">
          {rows.length} blockers in view
        </Badge>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          No blockers are currently recorded for this initiative.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr_1.3fr_1.1fr_0.7fr_0.8fr_1.2fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span>Title</span>
            <span>Raised By</span>
            <span>Date Raised</span>
            <span>What Is Needed</span>
            <span>Escalation</span>
            <span>Resolved</span>
            <span>TO Ack</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-slate-200">
            {rows.map(({ projectId, blocker }) => (
              <div
                key={`${projectId}:${blocker.id}`}
                className="grid grid-cols-[1.1fr_0.9fr_0.9fr_1.3fr_1.1fr_0.7fr_0.8fr_1.2fr] gap-4 px-5 py-4 text-sm"
              >
                <div className="font-medium text-slate-900">{blocker.title}</div>
                <div className="text-slate-700">{blocker.raisedBy}</div>
                <div className="text-slate-700">{fmtDate(blocker.dateRaised)}</div>
                <div className="text-slate-700">{blocker.whatIsNeeded}</div>
                <div>
                  <Badge className={`border ${BLOCKER_ESCALATION_BADGE_CLASSES[blocker.escalationStatus]}`}>
                    {blocker.escalationStatus}
                  </Badge>
                </div>
                <div>
                  <Badge
                    variant="outline"
                    className={blocker.resolved ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-700"}
                  >
                    {blocker.resolved ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="text-slate-600">
                  {blocker.acknowledgedByTO == null ? "" : blocker.acknowledgedByTO ? "Acknowledged" : "Pending"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {isOwner && !blocker.resolved && blocker.escalationStatus === "Not Escalated" ? (
                    <Button variant="outline" size="sm" onClick={() => openActionDialog("escalate-to", projectId, blocker)}>
                      Escalate to TO
                    </Button>
                  ) : null}
                  {isOwner && !blocker.resolved && blocker.escalationStatus === "Escalated to TO" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openActionDialog("escalate-division", projectId, blocker)}
                    >
                      Escalate to Division Head
                    </Button>
                  ) : null}
                  {isOwner && !blocker.resolved ? (
                    <Button size="sm" className="bg-orange-600 text-white hover:bg-orange-700" onClick={() => openActionDialog("resolve", projectId, blocker)}>
                      Resolve
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={Boolean(actionDialog)} onOpenChange={(open) => (!open ? closeActionDialog() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "resolve"
                ? "Resolve Blocker"
                : actionDialog?.type === "escalate-division"
                  ? "Escalate to Division Head"
                  : "Escalate to TO"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.type === "resolve"
                ? "Resolution requires a note. The blocker stays open until a note is provided."
                : "Confirm this escalation action. The change is written immediately to the shared lifecycle store."}
            </DialogDescription>
          </DialogHeader>

          {actionDialog?.type === "resolve" ? (
            <div className="py-2">
              <label className="text-sm font-medium text-slate-900">Resolution Note</label>
              <Textarea
                value={resolvedNote}
                onChange={(event) => setResolvedNote(event.target.value)}
                className="mt-2"
                placeholder="Describe how the blocker was resolved."
              />
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {actionDialog?.blocker.title}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog}>
              Cancel
            </Button>
            <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={submitAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RisksTabContent({
  initiative,
  projects,
  role,
}: {
  initiative: Initiative;
  projects: Project[];
  role: LifecycleInsightsRole;
}) {
  const [projectRows, setProjectRows] = useState<Project[]>(projects);
  const [statusFilter, setStatusFilter] = useState<"All" | Risk["status"]>("All");
  const [sortBy, setSortBy] = useState<(typeof RISK_SORT_OPTIONS)[number]>("severity");
  const isOwner = role === "initiative-owner";
  const now = Date.now();

  useEffect(() => {
    setProjectRows(projects);
  }, [projects]);

  useEffect(() => {
    const refresh = () => setProjectRows(getProjectsByInitiativeId(initiative.id));
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [initiative.id]);

  const rows = useMemo(() => {
    const allRows = projectRows.flatMap((project) =>
      project.risks.map((risk) => ({
        projectId: project.id,
        projectName: project.name,
        risk,
      }))
    );

    const filtered =
      statusFilter === "All" ? allRows : allRows.filter((row) => row.risk.status === statusFilter);

    const sorted = filtered.slice();
    sorted.sort((left, right) => {
      if (sortBy === "status") {
        return left.risk.status.localeCompare(right.risk.status) || SEVERITY_RANK[left.risk.severity] - SEVERITY_RANK[right.risk.severity];
      }
      return (
        SEVERITY_RANK[left.risk.severity] - SEVERITY_RANK[right.risk.severity] ||
        left.risk.status.localeCompare(right.risk.status) ||
        left.projectName.localeCompare(right.projectName)
      );
    });

    return sorted;
  }, [projectRows, sortBy, statusFilter]);

  const handleStatusChange = (projectId: string, riskId: string, status: Risk["status"]) => {
    updateRiskStatus(projectId, riskId, status);
    setProjectRows(getProjectsByInitiativeId(initiative.id));
    toast({
      title: "Risk updated",
      description: `Risk status changed to ${status}.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Risks</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Risk Register</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Consolidated risk register for {initiative.name}, sorted by severity and ready for initiative-owner status management.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-slate-200 text-slate-600">
          {rows.length} risks in view
        </Badge>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="min-w-[220px]">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Filter</p>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | Risk["status"])}>
              <SelectTrigger className="mt-2 bg-white">
                <SelectValue placeholder="Filter risks" />
              </SelectTrigger>
              <SelectContent>
                {RISK_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[220px]">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sort</p>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as (typeof RISK_SORT_OPTIONS)[number])}>
              <SelectTrigger className="mt-2 bg-white">
                <SelectValue placeholder="Sort risks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="severity">Severity first</SelectItem>
                <SelectItem value="status">By status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          {isOwner ? "Status updates persist directly to the shared lifecycle store." : "Status editing is limited to initiative-owner role."}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          No risks match the current filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1.2fr_1.3fr_0.9fr_0.9fr_0.9fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span>Title</span>
            <span>Severity</span>
            <span>Likelihood</span>
            <span>Impact</span>
            <span>Mitigation</span>
            <span>Owner</span>
            <span>Due Date</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-slate-200">
            {rows.map(({ projectId, risk }) => {
              const duePast =
                risk.status === "Open" && new Date(risk.mitigationDueDate).getTime() < now;

              return (
                <div
                  key={`${projectId}:${risk.id}`}
                  className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1.2fr_1.3fr_0.9fr_0.9fr_0.9fr] gap-4 px-5 py-4 text-sm"
                >
                  <div className="font-medium text-slate-900">{risk.title}</div>
                  <div>
                    <Badge className={`border ${RISK_SEVERITY_BADGE_CLASSES[risk.severity]}`}>{risk.severity}</Badge>
                  </div>
                  <div className="text-slate-700">{risk.likelihood}</div>
                  <div className="text-slate-700">{risk.impact}</div>
                  <div className="text-slate-700">{risk.mitigation}</div>
                  <div className="text-slate-600">{risk.owner}</div>
                  <div className={duePast ? "font-semibold text-red-600" : "text-slate-700"}>
                    {fmtDate(risk.mitigationDueDate)}
                  </div>
                  <div>
                    {isOwner ? (
                      <Select
                        value={risk.status}
                        onValueChange={(value) => handleStatusChange(projectId, risk.id, value as Risk["status"])}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_STATUS_OPTIONS.filter((option) => option !== "All").map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="border-slate-200 text-slate-700">
                        {risk.status}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MilestonesTabContent({
  initiative,
  projects,
  role,
}: {
  initiative: Initiative;
  projects: Project[];
  role: LifecycleInsightsRole;
}) {
  const [projectRows, setProjectRows] = useState<Project[]>(projects);
  const [statusFilter, setStatusFilter] = useState<"All" | MilestoneStatus>("All");
  const [sortBy, setSortBy] = useState<(typeof MILESTONE_SORT_OPTIONS)[number]>("due-date");
  const isOwner = role === "initiative-owner";
  const now = Date.now();

  useEffect(() => {
    setProjectRows(projects);
  }, [projects]);

  useEffect(() => {
    const refresh = () => setProjectRows(getProjectsByInitiativeId(initiative.id));
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [initiative.id]);

  const rows = useMemo(() => {
    const allRows = projectRows.flatMap((project) =>
      project.milestones.map((milestone) => ({
        projectId: project.id,
        projectName: project.name,
        milestone,
      }))
    );

    const filtered =
      statusFilter === "All"
        ? allRows
        : allRows.filter((row) => row.milestone.status === statusFilter);

    const sorted = filtered.slice();
    sorted.sort((left, right) => {
      if (sortBy === "project") {
        return left.projectName.localeCompare(right.projectName) || left.milestone.name.localeCompare(right.milestone.name);
      }
      if (sortBy === "status") {
        return left.milestone.status.localeCompare(right.milestone.status) || left.projectName.localeCompare(right.projectName);
      }
      return new Date(left.milestone.dueDate).getTime() - new Date(right.milestone.dueDate).getTime();
    });

    return sorted;
  }, [projectRows, sortBy, statusFilter]);

  const handleStatusChange = (projectId: string, milestoneId: string, status: MilestoneStatus) => {
    updateMilestoneStatus(projectId, milestoneId, status);
    setProjectRows(getProjectsByInitiativeId(initiative.id));
    toast({
      title: "Milestone updated",
      description: `Milestone status changed to ${status}.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Milestones</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Milestone Tracker</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Cross-project milestone view for {initiative.name}, with due-date ordering, owner visibility, and initiative-owner status controls.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-slate-200 text-slate-600">
          {rows.length} milestones in view
        </Badge>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="min-w-[220px]">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Filter</p>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | MilestoneStatus)}>
              <SelectTrigger className="mt-2 bg-white">
                <SelectValue placeholder="Filter milestones" />
              </SelectTrigger>
              <SelectContent>
                {MILESTONE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[220px]">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sort</p>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as (typeof MILESTONE_SORT_OPTIONS)[number])}>
              <SelectTrigger className="mt-2 bg-white">
                <SelectValue placeholder="Sort milestones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due-date">Due date ascending</SelectItem>
                <SelectItem value="project">By project</SelectItem>
                <SelectItem value="status">By status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          {isOwner ? "Status changes update project progress automatically." : "Status editing is limited to initiative-owner role."}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          No milestones match the current filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[1.2fr_1.4fr_0.9fr_0.9fr_0.9fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span>Project</span>
            <span>Milestone</span>
            <span>Status</span>
            <span>Due Date</span>
            <span>Owner</span>
          </div>

          <div className="divide-y divide-slate-200">
            {rows.map(({ projectId, projectName, milestone }) => {
              const delayedPastDue =
                milestone.status === "Delayed" && new Date(milestone.dueDate).getTime() < now;

              return (
                <div
                  key={`${projectId}:${milestone.id}`}
                  className="grid grid-cols-[1.2fr_1.4fr_0.9fr_0.9fr_0.9fr] gap-4 px-5 py-4 text-sm"
                >
                  <div className="font-medium text-slate-900">{projectName}</div>
                  <div className="text-slate-700">{milestone.name}</div>
                  <div>
                    {isOwner ? (
                      <Select
                        value={milestone.status}
                        onValueChange={(value) => handleStatusChange(projectId, milestone.id, value as MilestoneStatus)}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {MILESTONE_STATUS_OPTIONS.filter((option) => option !== "All").map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="border-slate-200 text-slate-700">
                        {milestone.status}
                      </Badge>
                    )}
                  </div>
                  <div className={delayedPastDue ? "font-semibold text-red-600" : "text-slate-700"}>
                    {fmtDate(milestone.dueDate)}
                  </div>
                  <div className="text-slate-600">{milestone.owner || "Unassigned"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectsTabContent({
  initiative,
  projects,
}: {
  initiative: Initiative;
  projects: Project[];
}) {
  const navigate = useNavigate();
  const now = Date.now();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Projects</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Child Projects</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Delivery view across all projects linked to {initiative.name}, including schedule pressure, budget posture, and current execution risk.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-slate-200 text-slate-600">
          {projects.length} linked projects
        </Badge>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          No projects are currently linked to this initiative.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {projects
            .slice()
            .sort((left, right) => new Date(left.targetDate).getTime() - new Date(right.targetDate).getTime())
            .map((project) => {
              const openBlockers = project.blockers.filter((blocker) => !blocker.resolved).length;
              const openRisks = project.risks.filter((risk) => risk.status === "Open").length;
              const targetPast = new Date(project.targetDate).getTime() < now && project.progress < 100;

              return (
                <Card key={project.id} className="border-slate-200">
                  <CardContent className="space-y-5 p-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-slate-950">{project.name}</p>
                          <Badge className={`border ${RAG_BADGE_CLASSES[project.rag]}`}>{project.rag}</Badge>
                          <Badge className={`border ${BUDGET_HEALTH_BADGE_CLASSES[project.budgetHealth]}`}>
                            {project.budgetHealth}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
                          <span>PM: {project.pmName}</span>
                          <span>{project.division}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() =>
                          navigate(`/stage2/lifecycle-management/${initiative.id}/projects/${project.id}`)
                        }
                      >
                        View Project
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-700">Progress</span>
                        <span className="font-semibold text-slate-950">{project.progress}%</span>
                      </div>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            project.rag === "Red" ? "bg-red-500" : project.rag === "Amber" ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <BudgetCell label="Total Budget" value={formatAed(project.budget)} />
                      <BudgetCell label="Spent" value={formatAed(project.budgetSpent)} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <DetailStat
                        label="Target Date"
                        value={fmtDate(project.targetDate)}
                        tone={targetPast ? "text-red-600" : undefined}
                      />
                      <DetailStat label="Open Blockers" value={String(openBlockers)} />
                      <DetailStat label="Open Risks" value={String(openRisks)} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}

function OverviewTabContent({
  initiative,
  projects,
  plannedStartDate,
  forecastEndDate,
  strategicPriority,
}: {
  initiative: Initiative;
  projects: Project[];
  plannedStartDate: string | null;
  forecastEndDate: string | null;
  strategicPriority:
    | (typeof STRATEGIC_PRIORITY_BY_SLUG)[keyof typeof STRATEGIC_PRIORITY_BY_SLUG]
    | null;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Overview</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Initiative Overview</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Full initiative context, derived delivery dates, alignment posture, and linked execution footprint.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-slate-200 text-slate-600">
          Last updated: {fmtDateTime(initiative.updatedAt)}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-slate-200">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{initiative.description}</p>
            </div>

            {initiative.fromPortfolio ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Badge className="border border-blue-200 bg-white text-blue-700">Derived from portfolio gap</Badge>
                    <p className="mt-2 text-sm text-slate-700">
                      This initiative originated from portfolio analysis and retains a traceable source card.
                    </p>
                  </div>
                  {initiative.portfolioCardId ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate("/marketplaces/portfolio-management", {
                          state: {
                            tab: "ot-asset-portfolio",
                            portfolioCardId: initiative.portfolioCardId,
                          },
                        })
                      }
                    >
                      View Source Asset
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <DetailStat
                label="EA Alignment"
                value={
                  initiative.eaAlignmentScore == null
                    ? "Not assessed"
                    : `${initiative.eaAlignmentScore}/100`
                }
              />
              <DetailStat label="Projects Linked" value={String(projects.length)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Key Dates</p>
              <div className="mt-3 grid gap-3">
                <DetailStat label="Target Date" value={fmtDate(initiative.targetDate)} />
                <DetailStat label="Planned Start" value={plannedStartDate ? fmtDate(plannedStartDate) : "Not available"} />
                {forecastEndDate && forecastEndDate !== initiative.targetDate ? (
                  <DetailStat label="Forecast" value={fmtDate(forecastEndDate)} />
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Linked Projects Summary</p>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-sm font-semibold text-slate-950">{projects.length} projects</p>
                <div className="flex flex-wrap items-center gap-2">
                  {projects.map((project) => (
                    <span
                      key={project.id}
                      title={`${project.name} · ${project.rag}`}
                      className={`h-3 w-3 rounded-full border ${
                        project.rag === "Red"
                          ? "border-red-300 bg-red-500"
                          : project.rag === "Amber"
                            ? "border-amber-300 bg-amber-500"
                            : "border-emerald-300 bg-emerald-500"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Strategic Priority</p>
              {strategicPriority ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    {strategicPriority.number}. {strategicPriority.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{strategicPriority.body}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">{strategicPriority.kpi}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No strategic priority mapped.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function RouteStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="flex items-start gap-3 p-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 break-all text-sm font-semibold text-slate-950">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function DetailStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${tone ?? "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function nextStage2TaskForTab(tab: (typeof COCKPIT_TABS)[number]) {
  switch (tab) {
    case "Overview":
      return "S2-03 Overview Tab";
    case "Projects":
      return "S2-04 Projects Tab";
    case "Milestones":
      return "S2-05 Milestones Tab";
    case "Risks":
      return "S2-06 Risks Tab";
    case "Blockers":
      return "S2-07 Blockers Tab";
    case "Budget":
      return "S2-08 Budget Tab";
    case "Activity":
      return "S2-09 Activity Tab";
    case "Service Requests":
      return "S2-12 Service Requests";
    default:
      return "Stage 2";
  }
}

export default function LCStage2Overview() {
  const { initiativeId, projectId } = useParams<{ initiativeId?: string; projectId?: string }>();
  const [role, setRole] = useState<LifecycleInsightsRole>(() => getLifecycleRole() ?? "initiative-owner");

  useEffect(() => {
    const syncRole = () => setRole(getLifecycleRole() ?? "initiative-owner");
    window.addEventListener("storage", syncRole);
    return () => window.removeEventListener("storage", syncRole);
  }, []);

  const handleRoleChange = (nextRole: LifecycleInsightsRole) => {
    setLifecycleRole(nextRole);
    setRole(nextRole);
    toast({
      title: "Lifecycle role updated",
      description: `Workspace now reflects ${LIFECYCLE_ROLE_LABELS[nextRole]}.`,
    });
  };

  if (initiativeId) {
    const initiative = getInitiativeById(initiativeId) ?? null;
    if (projectId) {
      return <ProjectDetailView initiative={initiative} projectId={projectId} />;
    }
    return <InitiativeCockpitShell initiativeId={initiativeId} role={role} />;
  }

  return <WorkspaceOverview role={role} onRoleChange={handleRoleChange} />;
}
