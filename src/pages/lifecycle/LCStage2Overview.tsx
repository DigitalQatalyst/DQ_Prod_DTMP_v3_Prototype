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
  type LCServiceRequest,
  type LCServiceType,
} from "@/data/lifecycle/serviceRequestState";
import {
  type Blocker,
  computeInitiativeRAG,
  getBlockersByInitiativeId,
  getInitiativeById,
  getInitiatives,
  getProjectsByInitiativeId,
  type Initiative,
  type MilestoneStatus,
  type Project,
  type Risk,
  type InitiativeStatus,
  updateInitiativeBudgetSpent,
  updateInitiativeName,
  updateInitiativeProgress,
  updateInitiativeStatus,
  updateMilestoneStatus,
  updateBlockerEscalation,
  updateProjectBudgetSpent,
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

function ProjectRoutePlaceholder({
  initiative,
  projectId,
}: {
  initiative: Initiative | null;
  projectId?: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-6">
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
                Project Detail Route
              </p>
              <h1 className="text-3xl font-semibold text-slate-950">
                {initiative?.name ?? "Lifecycle workspace route"}
              </h1>
              <p className="max-w-3xl text-sm text-slate-600">
                Project-level routing is in place. The initiative cockpit shell is live, and project detail lands in a later Stage 2 task.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/stage2/lifecycle-management")}>
              Back to Workspace
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <RouteStatCard icon={<FolderKanban className="h-5 w-5 text-blue-700" />} label="Initiative Route" value={initiative?.id ?? "Unknown"} />
        <RouteStatCard icon={<Briefcase className="h-5 w-5 text-emerald-700" />} label="Project Route" value={projectId ?? "Not selected"} />
        <RouteStatCard icon={<RefreshCw className="h-5 w-5 text-orange-700" />} label="Next Task" value="S2-03 Overview Tab" />
      </div>
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
      return <ProjectRoutePlaceholder initiative={initiative} projectId={projectId} />;
    }
    return <InitiativeCockpitShell initiativeId={initiativeId} role={role} />;
  }

  return <WorkspaceOverview role={role} onRoleChange={handleRoleChange} />;
}
