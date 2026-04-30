// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle Management — Stage 3: TO Office Management Console
// Views: Overview | Pending Approvals | Active Programmes | Service Requests
//        | Escalations | Completed
// src/pages/lifecycle/LCStage3Page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleSlash,
  ClipboardList,
  Clock,
  FileText,
  Flag,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  User,
  Zap,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import Stage3Shell from "@/components/stage3/Stage3Shell";

import {
  addInitiativeObservation,
  computeInitiativeRAG,
  getAllBlockers,
  getBlockersByInitiativeId,
  getInitiativeById,
  getInitiatives,
  getRisksByInitiativeId,
  setInitiativeFlagged,
  updateInitiativeStatus,
  type Division,
  type Initiative,
  type InitiativeStatus,
  type RAGStatus,
} from "@/data/shared/lifecyclePortfolioStore";
import { getAllActivityEvents } from "@/data/shared/activityEventStore";
import {
  addApprovalWorkflow,
  getApprovalWorkflows,
  lifecycleInstances,
  updateApprovalWorkflow,
  type ApprovalWorkflow,
} from "@/data/lifecycle/lifecycleData";

import {
  getApprovalQueue,
  getEscalations,
  getLCRequests,
  updateApprovalStatus,
  updateEscalationStatus,
  updateEscalationNotes,
  updateLCRequestStatus,
  updateLCRequestNotes,
  type ApprovalStatus,
  type EscalationSeverity,
  type EscalationStatus,
  type InitiativeApprovalRequest,
  type LCEscalation,
  type LCRequestStatus,
  type LCServiceRequest,
} from "@/data/lifecycle/serviceRequestState";
import { getFrameworkByType } from "@/data/lifecycle/frameworkCards";

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage3View =
  | "overview"
  | "pending-approvals"
  | "active-programmes"
  | "service-requests"
  | "escalations"
  | "completed";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const fmtBudget = (b: number | null | undefined) =>
  b == null ? "TBC" : `AED ${(b / 1_000_000).toFixed(0)}M`;

function slaClass(r: LCServiceRequest): string {
  const target = new Date(r.submittedAt).getTime() + r.slaHours * 3_600_000;
  return Date.now() > target ? "bg-red-100 text-red-700 border-red-200" : "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function slaLabel(r: LCServiceRequest): string {
  const target = new Date(r.submittedAt).getTime() + r.slaHours * 3_600_000;
  const remaining = target - Date.now();
  if (remaining < 0) return "SLA Breached";
  const h = Math.floor(remaining / 3_600_000);
  const d = Math.floor(h / 24);
  return d > 0 ? `${d}d left` : `${h}h left`;
}

function slaStatus(r: LCServiceRequest): "On Track" | "At Risk" | "Breached" {
  const submitted = new Date(r.submittedAt).getTime();
  const deadline = submitted + r.slaHours * 3_600_000;
  const atRisk = submitted + r.slaHours * 0.8 * 3_600_000;
  const now = Date.now();
  if (now >= deadline) return "Breached";
  if (now >= atRisk) return "At Risk";
  return "On Track";
}

function escalationAgeLabel(dateRaised: string): { label: string; className: string } {
  const daysOpen = Math.max(0, Math.floor((Date.now() - new Date(dateRaised).getTime()) / 86_400_000));
  if (daysOpen > 7) return { label: `${daysOpen} days`, className: "text-red-600" };
  if (daysOpen >= 3) return { label: `${daysOpen} days`, className: "text-amber-600" };
  return { label: `${daysOpen} days`, className: "text-green-600" };
}

const STATUS_BADGES: Record<LCRequestStatus, string> = {
  Submitted: "bg-sky-100 text-sky-700 border-sky-200",
  Assigned: "bg-purple-100 text-purple-700 border-purple-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Delivered: "bg-green-100 text-green-700 border-green-200",
  Completed: "bg-green-50 text-green-600 border-green-100",
};

const APPROVAL_STATUS_BADGES: Record<ApprovalStatus, string> = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  "Clarification Requested": "bg-blue-100 text-blue-700 border-blue-200",
  Approved: "bg-green-100 text-green-700 border-green-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  Escalated: "bg-purple-100 text-purple-700 border-purple-200",
};

const ESCALATION_SEVERITY_BADGES: Record<EscalationSeverity, string> = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-gray-100 text-gray-700 border-gray-200",
};

const INITIATIVE_STATUS_BADGES: Record<InitiativeStatus, string> = {
  Active: "bg-teal-100 text-teal-700 border-teal-200",
  Scoping: "bg-blue-100 text-blue-700 border-blue-200",
  "At Risk": "bg-amber-100 text-amber-800 border-amber-200",
  "On Hold": "bg-slate-200 text-slate-600 border-slate-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
  Pending: "bg-sky-100 text-sky-700 border-sky-200",
  "Clarification Requested": "bg-violet-100 text-violet-700 border-violet-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
};

// ── TO Team (for assignment suggestions) ─────────────────────────────────────

const TO_TEAM = [
  "Eng. Khalid Al Rashidi",
  "Eng. Sara Al Mansoori",
  "Eng. Ahmed Al Zaabi",
  "Dr. Fatima Al Mazrouei",
];

// ── Sidebar nav config ────────────────────────────────────────────────────────

interface NavItem {
  id: Stage3View;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LCStage3Page() {
  const { view: routeView } = useParams<{ view?: string }>();
  const navigate = useNavigate();

  const activeView: Stage3View =
    (["overview", "pending-approvals", "active-programmes", "service-requests", "escalations", "completed"] as Stage3View[]).includes(routeView as Stage3View)
      ? (routeView as Stage3View)
      : "overview";

  // ── Data ─────────────────────────────────────────────────────────────────────

  const [initiatives, setInitiatives] = useState<Initiative[]>(() => getInitiatives());
  const [approvals, setApprovals] = useState(() => getApprovalQueue());
  const [serviceRequests, setServiceRequests] = useState<LCServiceRequest[]>(() => getLCRequests());
  const [escalations, setEscalations] = useState<LCEscalation[]>(() => getEscalations());
  const [gateApprovals, setGateApprovals] = useState<ApprovalWorkflow[]>(() => getApprovalWorkflows());

  const refresh = () => {
    setInitiatives(getInitiatives());
    setApprovals(getApprovalQueue());
    setServiceRequests(getLCRequests());
    setEscalations(getEscalations());
    setGateApprovals(getApprovalWorkflows());
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const pendingApprovals = useMemo(
    () => approvals.filter((a) => a.status === "Pending" || a.status === "Clarification Requested"),
    [approvals]
  );

  const activeProgrammes = useMemo(
    () => initiatives.filter((i) => i.status === "Active" || i.status === "At Risk" || i.status === "Scoping"),
    [initiatives]
  );

  const openServiceRequests = useMemo(
    () => serviceRequests.filter((r) => r.status !== "Completed"),
    [serviceRequests]
  );

  const openEscalations = useMemo(
    () => escalations.filter((e) => e.status === "Open" || e.status === "Acknowledged"),
    [escalations]
  );

  const completedInitiatives = useMemo(
    () => initiatives.filter((i) => i.status === "Completed"),
    [initiatives]
  );

  const completedRequests = useMemo(
    () => serviceRequests.filter((r) => r.status === "Completed"),
    [serviceRequests]
  );

  const pendingGateApprovals = useMemo(
    () => gateApprovals.filter((approval) => approval.status === "pending"),
    [gateApprovals]
  );

  const recentActivity = useMemo(() => getAllActivityEvents().slice(0, 10), [initiatives.length, approvals.length, serviceRequests.length, escalations.length, gateApprovals.length]);

  const benefitsSummary = useMemo(() => {
    const completedLifecycle = lifecycleInstances.filter((instance) => instance.status === "completed");
    const benefits = completedLifecycle.flatMap((instance) => instance.expectedBenefits);
    const realized = benefits.filter((benefit) => benefit.status === "realized");
    return {
      planned: benefits.length,
      realized: realized.length,
      rate: benefits.length > 0 ? Math.round((realized.length / benefits.length) * 100) : 0,
    };
  }, []);

  const slaStats = useMemo(() => {
    let onTrack = 0, atRisk = 0, breached = 0;
    const now = Date.now();
    for (const r of openServiceRequests) {
      const submitted = new Date(r.submittedAt).getTime();
      const deadline = submitted + r.slaHours * 3_600_000;
      const atRiskThreshold = submitted + r.slaHours * 0.8 * 3_600_000;
      if (now >= deadline) breached++;
      else if (now >= atRiskThreshold) atRisk++;
      else onTrack++;
    }
    return { onTrack, atRisk, breached };
  }, [openServiceRequests]);

  const portfolioEscalationsCount = useMemo(
    () => getAllBlockers().filter((b) => !b.resolved && b.escalationStatus !== "Not Escalated").length,
    [initiatives]
  );

  const activeProgrammesRAG = useMemo<Record<RAGStatus, number>>(() => {
    const counts: Record<RAGStatus, number> = { Red: 0, Amber: 0, Green: 0 };
    for (const ini of activeProgrammes) {
      counts[computeInitiativeRAG(ini)]++;
    }
    return counts;
  }, [activeProgrammes]);

  // ── Sidebar nav ───────────────────────────────────────────────────────────────

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "pending-approvals", label: "Pending Approvals", icon: <Inbox className="w-4 h-4" />, count: pendingApprovals.length },
    { id: "active-programmes", label: "Active Programmes", icon: <Play className="w-4 h-4" />, count: activeProgrammes.length },
    { id: "service-requests", label: "Service Requests", icon: <ClipboardList className="w-4 h-4" />, count: openServiceRequests.length },
    { id: "escalations", label: "Escalations", icon: <ShieldAlert className="w-4 h-4" />, count: openEscalations.length },
    { id: "completed", label: "Completed", icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const goTo = (v: Stage3View) => navigate(`/stage3/lifecycle-management/${v}`, { replace: true });

  // ── Action modals ─────────────────────────────────────────────────────────────

  // Approval action modal
  const [approvalModal, setApprovalModal] = useState<{ approval: InitiativeApprovalRequest; action: ApprovalStatus } | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [assignee, setAssignee] = useState("Eng. Khalid Al Rashidi");

  const submitApprovalAction = () => {
    if (!approvalModal) return;
    const { approval, action } = approvalModal;
    if (action === "Rejected" && !approvalNote.trim()) {
      toast({ title: "Rejection reason required", description: "Provide a reason before rejecting this initiative." });
      return;
    }
    updateApprovalStatus(approval.id, action, {
      toNotes: approvalNote.trim() || undefined,
      rejectionReason: action === "Rejected" ? approvalNote.trim() || undefined : undefined,
      escalationNote: action === "Escalated" ? approvalNote.trim() || undefined : undefined,
    });
    toast({ title: `Initiative ${action}`, description: `${approval.initiativeName} — status updated.` });
    setApprovalModal(null);
    setApprovalNote("");
    refresh();
  };

  // Service request action modal
  const [reqModal, setReqModal] = useState<{ req: LCServiceRequest; nextStatus: LCRequestStatus } | null>(null);
  const [reqNote, setReqNote] = useState("");
  const [deliverableTitle, setDeliverableTitle] = useState("");
  const [deliverableFormat, setDeliverableFormat] = useState<"PDF" | "PPTX" | "Word">("PDF");
  const [documentStudioId, setDocumentStudioId] = useState("");

  const submitReqAction = () => {
    if (!reqModal) return;
    const { req, nextStatus } = reqModal;
    const isDeliver = nextStatus === "Delivered";
    if (isDeliver && !reqNote.trim()) {
      toast({ title: "Delivery note required", description: "Please enter a delivery note before marking as delivered.", variant: "destructive" });
      return;
    }
    updateLCRequestStatus(req.id, nextStatus, {
      assignedTo: nextStatus === "Assigned" ? (assignee || undefined) : undefined,
      deliveredAt: isDeliver ? new Date().toISOString() : undefined,
      deliverableTitle: isDeliver && deliverableTitle.trim() ? deliverableTitle.trim() : undefined,
      deliverableFormat: isDeliver ? deliverableFormat : undefined,
      documentStudioId: isDeliver && documentStudioId.trim() ? documentStudioId.trim() : undefined,
      actor: assignee || "Transformation Office",
      note: reqNote.trim() || undefined,
    });
    toast({ title: `Request ${nextStatus}`, description: `${req.serviceType} for ${req.initiativeName}` });
    setReqModal(null);
    setReqNote("");
    setDeliverableTitle("");
    setDocumentStudioId("");
    refresh();
  };

  // Escalation action modal
  const [escModal, setEscModal] = useState<{ esc: LCEscalation; action: EscalationStatus } | null>(null);
  const [escNote, setEscNote] = useState("");

  const [gateModal, setGateModal] = useState<{ approval: ApprovalWorkflow; decision: "approved" | "rejected" | "conditional" } | null>(null);
  const [gateDecisionNote, setGateDecisionNote] = useState("");

  const submitEscAction = () => {
    if (!escModal) return;
    const { esc, action } = escModal;
    if (action === "Resolved" && !escNote.trim()) {
      toast({ title: "Resolution note required", description: "Please enter a resolution note before resolving.", variant: "destructive" });
      return;
    }
    updateEscalationStatus(esc.id, action, {
      toResponse: escNote.trim() || undefined,
      resolvedNote: action === "Resolved" ? escNote.trim() || undefined : undefined,
      actor: "Transformation Office",
      note: escNote.trim() || undefined,
    });
    toast({ title: `Escalation ${action}`, description: esc.title });
    setEscModal(null);
    setEscNote("");
    refresh();
  };

  const submitGateDecision = () => {
    if (!gateModal) return;
    updateApprovalWorkflow(gateModal.approval.id, (workflow) => ({
      ...workflow,
      status: gateModal.decision,
      actualDecisionDate: new Date().toISOString(),
      approvals: workflow.approvals.map((entry, index) =>
        index === 0
          ? {
              ...entry,
              decision: gateModal.decision,
              decisionDate: new Date().toISOString(),
              comments: gateDecisionNote.trim() || entry.comments,
            }
          : entry
      ),
      receivedApprovals: gateModal.decision === "approved" ? workflow.requiredApprovals : workflow.receivedApprovals,
    }));
    toast({ title: "Gate decision recorded", description: `${gateModal.approval.gate.name} has been updated.` });
    setGateModal(null);
    setGateDecisionNote("");
    refresh();
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Stage3Shell
      scope="lifecycle-management"
      title="Lifecycle Management"
      subtitle="Govern the full initiative portfolio, respond to delivery escalations, and manage TO support from one workspace."
    >
    <div className="flex min-h-[calc(100vh-64px)] rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">TO Office</p>
          <h2 className="text-sm font-bold text-gray-900 mt-0.5">Lifecycle Management</h2>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => goTo(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeView === item.id
                  ? "bg-orange-50 text-orange-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-2.5">
                {item.icon}
                {item.label}
              </span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  item.id === "escalations" && item.count > 0
                    ? "bg-red-100 text-red-700"
                    : item.id === "pending-approvals" && item.count > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Scope switcher */}
        <div className="px-3 py-3 border-t border-gray-100 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">Switch Scope</p>
          <button
            onClick={() => navigate("/stage3/portfolio-management/overview")}
            className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <span className="w-4 h-4 flex-shrink-0 text-center text-gray-400">⊞</span>
            Portfolio Management
          </button>
          <button
            onClick={() => navigate("/stage3/dashboard")}
            className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <span className="w-4 h-4 flex-shrink-0 text-center text-gray-400">⌂</span>
            Stage 3 Dashboard
          </button>
        </div>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700">
              TO
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">TO Office</p>
              <p className="text-xs text-gray-500">Stage 3 Console</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-6 space-y-6">

        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        {activeView === "overview" && (
          <OverviewView
            pendingApprovals={pendingApprovals.length}
            pendingApprovalsList={pendingApprovals}
            pendingGateApprovals={pendingGateApprovals.length}
            activeProgrammes={activeProgrammes.length}
            activeProgrammesRAG={activeProgrammesRAG}
            openRequests={openServiceRequests.length}
            requestsList={openServiceRequests}
            openEscalations={openEscalations.length}
            portfolioEscalationsCount={portfolioEscalationsCount}
            slaStats={slaStats}
            completedInitiatives={completedInitiatives.length}
            onNavigate={goTo}
            recentActivity={recentActivity}
            benefitsSummary={benefitsSummary}
          />
        )}

        {/* ── PENDING APPROVALS ────────────────────────────────── */}
        {activeView === "pending-approvals" && (
          <PendingApprovalsView
            approvals={pendingApprovals}
            onAction={(approval, action) => {
              setApprovalModal({ approval, action });
              setApprovalNote("");
            }}
            gateApprovals={pendingGateApprovals}
            onGateAction={(approval, decision) => {
              setGateModal({ approval, decision });
              setGateDecisionNote("");
            }}
          />
        )}

        {/* ── ACTIVE PROGRAMMES ────────────────────────────────── */}
        {activeView === "active-programmes" && (
          <ActiveProgrammesView initiatives={activeProgrammes} onRefresh={refresh} />
        )}

        {/* ── SERVICE REQUESTS ─────────────────────────────────── */}
        {activeView === "service-requests" && (
          <ServiceRequestsView
            requests={openServiceRequests}
            onAction={(req, nextStatus) => {
              setReqModal({ req, nextStatus });
              setAssignee("Eng. Khalid Al Rashidi");
              setDeliverableTitle("");
              setDeliverableFormat("PDF");
              setDocumentStudioId("");
              setReqNote("");
            }}
          />
        )}

        {/* ── ESCALATIONS ──────────────────────────────────────── */}
        {activeView === "escalations" && (
          <EscalationsView
            escalations={escalations}
            onAction={(esc, action) => {
              setEscModal({ esc, action });
              setEscNote("");
            }}
          />
        )}

        {/* ── COMPLETED ────────────────────────────────────────── */}
        {activeView === "completed" && (
          <CompletedView initiatives={completedInitiatives} requests={completedRequests} />
        )}
      </main>

      {/* ── Approval Action Modal ─────────────────────────────────────────────── */}
      <Dialog open={!!approvalModal} onOpenChange={() => setApprovalModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalModal?.action === "Approved" && "Approve Initiative"}
              {approvalModal?.action === "Rejected" && "Reject Initiative"}
              {approvalModal?.action === "Clarification Requested" && "Request Clarification"}
              {approvalModal?.action === "Escalated" && "Escalate to Senior Approver"}
            </DialogTitle>
          </DialogHeader>
          {approvalModal && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500">Initiative</p>
                <p className="text-sm font-semibold text-slate-900">{approvalModal.approval.initiativeName}</p>
                <p className="text-xs text-slate-500 mt-1">{approvalModal.approval.frameworkType} · {approvalModal.approval.division}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {approvalModal.action === "Rejected" ? "Rejection reason" : "Notes (optional)"}
                </label>
                <Textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder={
                    approvalModal.action === "Rejected"
                      ? "Explain why this initiative was rejected…"
                      : approvalModal.action === "Clarification Requested"
                      ? "What information is needed before approval can proceed?"
                      : "Any notes for the record…"
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalModal(null)}>Cancel</Button>
            <Button
              className={
                approvalModal?.action === "Approved"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : approvalModal?.action === "Rejected"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : approvalModal?.action === "Escalated"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }
              onClick={submitApprovalAction}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Service Request Action Modal ──────────────────────────────────────── */}
      <Dialog open={!!reqModal} onOpenChange={() => setReqModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reqModal?.nextStatus === "Assigned" && "Assign Request"}
              {reqModal?.nextStatus === "In Progress" && "Start Work"}
              {reqModal?.nextStatus === "Delivered" && "Mark as Delivered"}
              {reqModal?.nextStatus === "Completed" && "Mark as Completed"}
            </DialogTitle>
          </DialogHeader>
          {reqModal && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500">Request</p>
                <p className="text-sm font-semibold text-slate-900">{reqModal.req.serviceType}</p>
                <p className="text-xs text-slate-500 mt-1">{reqModal.req.initiativeName}</p>
              </div>

              {reqModal.nextStatus === "Assigned" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Assign to</label>
                  <Input
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    placeholder="TO team member name"
                  />
                </div>
              )}

              {reqModal.nextStatus === "Delivered" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Delivery note <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={reqNote}
                      onChange={(e) => setReqNote(e.target.value)}
                      placeholder="Summarise what was delivered and any key decisions…"
                      rows={3}
                      className={!reqNote.trim() ? "border-red-300 focus:border-red-400" : ""}
                    />
                    {!reqNote.trim() && (
                      <p className="text-xs text-red-500 mt-1">Required before marking as delivered.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Deliverable title</label>
                    <Input
                      value={deliverableTitle}
                      onChange={(e) => setDeliverableTitle(e.target.value)}
                      placeholder="e.g. Smart Grid Initiative Status Report – Q2 2026"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Format</label>
                    <Select value={deliverableFormat} onValueChange={(v) => setDeliverableFormat(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="PPTX">PPTX</SelectItem>
                        <SelectItem value="Word">Word</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Document Studio reference (optional)</label>
                    <Input
                      value={documentStudioId}
                      onChange={(e) => setDocumentStudioId(e.target.value)}
                      placeholder="Document Studio request ID or title"
                    />
                  </div>
                </>
              )}

              {reqModal.nextStatus !== "Delivered" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Note (optional)</label>
                  <Textarea
                    value={reqNote}
                    onChange={(e) => setReqNote(e.target.value)}
                    placeholder="Add a note for the action log…"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReqModal(null)}>Cancel</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submitReqAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!gateModal} onOpenChange={() => setGateModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gate Decision</DialogTitle>
          </DialogHeader>
          {gateModal ? (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500">Gate</p>
                <p className="text-sm font-semibold text-slate-900">{gateModal.approval.gate.name}</p>
                <p className="text-xs text-slate-500 mt-1">{gateModal.approval.lifecycleInstanceName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Decision Notes</label>
                <Textarea
                  value={gateDecisionNote}
                  onChange={(e) => setGateDecisionNote(e.target.value)}
                  placeholder="Capture conditional requirements, rejection reasons, or approval notes."
                  rows={4}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setGateModal(null)}>Cancel</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submitGateDecision}>
              Confirm Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Escalation Action Modal ───────────────────────────────────────────── */}
      <Dialog open={!!escModal} onOpenChange={() => setEscModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {escModal?.action === "Acknowledged" && "Acknowledge Escalation"}
              {escModal?.action === "Resolved" && "Resolve Escalation"}
              {escModal?.action === "Escalated Further" && "Escalate Further"}
            </DialogTitle>
          </DialogHeader>
          {escModal && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500">Escalation</p>
                <p className="text-sm font-semibold text-slate-900">{escModal.esc.title}</p>
                <p className="text-xs text-slate-500 mt-1">{escModal.esc.initiativeName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {escModal.action === "Resolved" ? (
                    <>Resolution note <span className="text-red-500">*</span></>
                  ) : "Response"}
                </label>
                <Textarea
                  value={escNote}
                  onChange={(e) => setEscNote(e.target.value)}
                  placeholder={
                    escModal.action === "Resolved"
                      ? "Describe how this was resolved…"
                      : "Your response to the escalation…"
                  }
                  rows={3}
                  className={escModal.action === "Resolved" && !escNote.trim() ? "border-red-300 focus:border-red-400" : ""}
                />
                {escModal.action === "Resolved" && !escNote.trim() && (
                  <p className="text-xs text-red-500 mt-1">Required before resolving.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscModal(null)}>Cancel</Button>
            <Button
              className={escModal?.action === "Resolved" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-orange-600 hover:bg-orange-700 text-white"}
              onClick={submitEscAction}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </Stage3Shell>
  );
}

// ── View Components ───────────────────────────────────────────────────────────

function OverviewView({
  pendingApprovals,
  pendingApprovalsList,
  pendingGateApprovals,
  activeProgrammes,
  activeProgrammesRAG,
  openRequests,
  requestsList,
  openEscalations,
  portfolioEscalationsCount,
  slaStats,
  completedInitiatives,
  onNavigate,
  recentActivity,
  benefitsSummary,
}: {
  pendingApprovals: number;
  pendingApprovalsList: InitiativeApprovalRequest[];
  pendingGateApprovals: number;
  activeProgrammes: number;
  activeProgrammesRAG: Record<RAGStatus, number>;
  openRequests: number;
  requestsList: LCServiceRequest[];
  openEscalations: number;
  portfolioEscalationsCount: number;
  slaStats: { onTrack: number; atRisk: number; breached: number };
  completedInitiatives: number;
  onNavigate: (v: Stage3View) => void;
  recentActivity: Array<{ id: string; actor: string; action: string; timestamp: string; note?: string }>;
  benefitsSummary: { planned: number; realized: number; rate: number };
}) {
  const [copilotCollapsed, setCopilotCollapsed] = useState<boolean>(() =>
    localStorage.getItem("dtmp.stage3.copilotCollapsed") === "true"
  );

  const toggleCopilot = () => {
    const next = !copilotCollapsed;
    setCopilotCollapsed(next);
    localStorage.setItem("dtmp.stage3.copilotCollapsed", String(next));
  };

  // Queue summary
  const oldestPending = useMemo(() => {
    const all = pendingApprovalsList.map((a) => new Date(a.submittedAt).getTime());
    if (all.length === 0) return null;
    const oldest = Math.min(...all);
    return Math.floor((Date.now() - oldest) / 86_400_000);
  }, [pendingApprovalsList]);

  const criticalEscalations = useMemo(
    () => getAllBlockers().filter((b) => !b.resolved && b.escalationStatus !== "Not Escalated" && (b as { severity?: string }).severity === "Critical").length,
    []
  );

  // SLA risk cards — top 3 most urgent (breached by most hours first, then at-risk closest to breach)
  const slaRiskCards = useMemo(() => {
    const now = Date.now();
    return requestsList
      .map((r) => {
        const deadline = new Date(r.submittedAt).getTime() + r.slaHours * 3_600_000;
        return { r, urgency: now - deadline }; // positive = breached, negative = time remaining
      })
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 3)
      .filter(({ urgency }) => urgency > -(120 * 3_600_000)) // only at-risk (≤120h) or breached
      .map(({ r, urgency }) => ({ r, urgency }));
  }, [requestsList]);

  // Assignment suggestions — suggest least-loaded TO member for each unassigned request
  const assignmentSuggestions = useMemo(() => {
    const workload: Record<string, number> = Object.fromEntries(TO_TEAM.map((m) => [m, 0]));
    requestsList.forEach((r) => {
      if (r.assignedTo && workload[r.assignedTo] !== undefined) workload[r.assignedTo]++;
    });
    return requestsList
      .filter((r) => !r.assignedTo)
      .slice(0, 4)
      .map((r) => {
        const suggested = TO_TEAM.reduce((min, m) => (workload[m] < workload[min] ? m : min), TO_TEAM[0]);
        workload[suggested]++;
        return { r, suggested };
      });
  }, [requestsList]);

  // Pattern flags — ≥3 same serviceType from same division
  const patternFlags = useMemo(() => {
    const groups: Record<string, { serviceType: string; division: string; count: number }> = {};
    for (const r of requestsList) {
      const division = getInitiativeById(r.initiativeId)?.division ?? "Unknown";
      const key = `${r.serviceType}||${division}`;
      if (!groups[key]) groups[key] = { serviceType: r.serviceType, division, count: 0 };
      groups[key].count++;
    }
    return Object.values(groups).filter((g) => g.count >= 3);
  }, [requestsList]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">TO Office — Lifecycle Console</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Programme governance, approvals, service delivery, and escalation management.
        </p>
      </div>

      {/* ── AI.06 T-Office Copilot ─────────────────────────────── */}
      <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <button
          onClick={toggleCopilot}
          className="w-full flex items-center justify-between px-5 py-3.5"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-orange-900">AI.06 T-Office Copilot</p>
              <p className="text-xs text-orange-700">Live queue intelligence · Read only</p>
            </div>
          </div>
          {copilotCollapsed
            ? <ChevronDown className="w-4 h-4 text-orange-600" />
            : <ChevronUp className="w-4 h-4 text-orange-600" />}
        </button>

        {!copilotCollapsed && (
          <div className="px-5 pb-5 space-y-5 border-t border-orange-200">
            {/* Queue summary */}
            <div className="pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-1.5">Queue Summary</p>
              <p className="text-sm text-slate-800 leading-relaxed">
                <span className="font-semibold">{pendingApprovals + pendingGateApprovals}</span> initiative{pendingApprovals + pendingGateApprovals !== 1 ? "s" : ""} awaiting approval
                {oldestPending !== null && <> — oldest submitted <span className="font-semibold">{oldestPending} day{oldestPending !== 1 ? "s" : ""}</span> ago</>}.{" "}
                <span className="font-semibold">{openRequests}</span> service request{openRequests !== 1 ? "s" : ""} open:{" "}
                <span className="text-green-700 font-medium">{slaStats.onTrack} on track</span>,{" "}
                <span className="text-amber-700 font-medium">{slaStats.atRisk} at SLA risk</span>,{" "}
                <span className="text-red-700 font-medium">{slaStats.breached} breached</span>.{" "}
                <span className="font-semibold">{portfolioEscalationsCount}</span> open escalation{portfolioEscalationsCount !== 1 ? "s" : ""}
                {criticalEscalations > 0 && <> — <span className="text-red-700 font-semibold">{criticalEscalations} critical</span></>}.
              </p>
            </div>

            {/* SLA risk cards */}
            {slaRiskCards.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-2">SLA Risk Alerts</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {slaRiskCards.map(({ r, urgency }) => {
                    const breached = urgency > 0;
                    const hrs = Math.abs(Math.round(urgency / 3_600_000));
                    return (
                      <div
                        key={r.id}
                        className={`rounded-lg border p-3 ${breached ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}
                      >
                        <p className={`text-xs font-semibold ${breached ? "text-red-700" : "text-amber-700"}`}>
                          {breached ? `${hrs}h overdue` : `${hrs}h remaining`}
                        </p>
                        <p className="text-sm font-medium text-slate-900 mt-0.5 line-clamp-1">{r.serviceType}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{r.initiativeName}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assignment suggestions */}
            {assignmentSuggestions.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-2">Assignment Suggestions</p>
                <div className="space-y-2">
                  {assignmentSuggestions.map(({ r, suggested }) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">{r.serviceType}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{r.initiativeName}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-slate-500">Suggested</p>
                        <p className="text-xs font-semibold text-orange-700">{suggested}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pattern flags */}
            {patternFlags.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-2">Pattern Flags</p>
                <div className="space-y-2">
                  {patternFlags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-violet-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-violet-800">
                        Multiple <span className="font-semibold">{flag.serviceType}</span> requests from <span className="font-semibold">{flag.division}</span> ({flag.count} open) — possible systemic gap.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slaRiskCards.length === 0 && assignmentSuggestions.length === 0 && patternFlags.length === 0 && (
              <p className="text-xs text-slate-500 italic pt-1">No active alerts or suggestions at this time.</p>
            )}
          </div>
        )}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Pending Approvals */}
        <button
          onClick={() => onNavigate("pending-approvals")}
          className={`group text-left p-4 bg-white border rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5 ${pendingApprovals + pendingGateApprovals > 0 ? "border-amber-200 ring-1 ring-amber-100" : "border-gray-200"}`}
        >
          <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center mb-3 text-amber-600">
            <Inbox className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingApprovals + pendingGateApprovals}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">Pending Approvals</p>
          {pendingApprovals + pendingGateApprovals > 0 && (
            <p className="text-xs font-semibold text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Needs attention
            </p>
          )}
        </button>

        {/* Active Programmes with RAG breakdown */}
        <button
          onClick={() => onNavigate("active-programmes")}
          className="group text-left p-4 bg-white border border-gray-200 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center mb-3 text-teal-600">
            <Play className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeProgrammes}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">Active Programmes</p>
          <div className="flex items-center gap-2 mt-2">
            {activeProgrammesRAG.Red > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{activeProgrammesRAG.Red}R
              </span>
            )}
            {activeProgrammesRAG.Amber > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{activeProgrammesRAG.Amber}A
              </span>
            )}
            {activeProgrammesRAG.Green > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{activeProgrammesRAG.Green}G
              </span>
            )}
          </div>
        </button>

        {/* Service Requests with SLA breakdown */}
        <button
          onClick={() => onNavigate("service-requests")}
          className={`group text-left p-4 bg-white border rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5 ${slaStats.breached > 0 ? "border-red-200 ring-1 ring-red-100" : slaStats.atRisk > 0 ? "border-amber-200 ring-1 ring-amber-100" : "border-gray-200"}`}
        >
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-3 text-blue-600">
            <ClipboardList className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{openRequests}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">Open Requests</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-green-600 font-medium">{slaStats.onTrack} on track</span>
            {slaStats.atRisk > 0 && <span className="text-xs text-amber-600 font-semibold">{slaStats.atRisk} at risk</span>}
            {slaStats.breached > 0 && <span className="text-xs text-red-600 font-semibold">{slaStats.breached} breached</span>}
          </div>
        </button>

        {/* Escalations — sourced from portfolio store blockers */}
        <button
          onClick={() => onNavigate("escalations")}
          className={`group text-left p-4 bg-white border rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5 ${portfolioEscalationsCount > 0 ? "border-red-200 ring-1 ring-red-100" : "border-gray-200"}`}
        >
          <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center mb-3 text-red-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{portfolioEscalationsCount}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">Open Escalations</p>
          {portfolioEscalationsCount > 0 && (
            <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Needs attention
            </p>
          )}
        </button>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate("completed")}
          className="group text-left p-4 bg-white border border-gray-200 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center mb-3 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedInitiatives}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">Completed Initiatives</p>
        </button>
        <div className="p-4 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">SLA Status</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-green-600">{slaStats.onTrack}</p>
              <p className="text-xs text-gray-500">On Track</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600">{slaStats.atRisk}</p>
              <p className="text-xs text-gray-500">At Risk</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">{slaStats.breached}</p>
              <p className="text-xs text-gray-500">Breached</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(["pending-approvals", "service-requests", "escalations", "active-programmes"] as Stage3View[]).map((v) => {
                const labels: Record<string, string> = {
                  "pending-approvals": "Review Approvals",
                  "service-requests": "Manage Requests",
                  "escalations": "Resolve Escalations",
                  "active-programmes": "View Programmes",
                };
                return (
                  <Button key={v} variant="outline" className="justify-start text-xs h-9" onClick={() => onNavigate(v)}>
                    <ChevronRight className="w-3 h-3 mr-1" />
                    {labels[v]}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" /> Delivery Health
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>SLA Compliance</span>
                  <span className="font-semibold">
                    {openRequests > 0 ? Math.round((slaStats.onTrack / openRequests) * 100) : 100}%
                  </span>
                </div>
                <Progress
                  value={openRequests > 0 ? (slaStats.onTrack / openRequests) * 100 : 100}
                  className="h-2"
                />
                {slaStats.atRisk > 0 && (
                  <p className="text-xs text-amber-600 mt-1">{slaStats.atRisk} request{slaStats.atRisk > 1 ? "s" : ""} approaching SLA deadline</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Open Escalations</span>
                  <span className={`font-semibold ${portfolioEscalationsCount > 0 ? "text-red-600" : "text-green-600"}`}>
                    {portfolioEscalationsCount === 0 ? "None" : portfolioEscalationsCount}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Approvals Pending</span>
                  <span className={`font-semibold ${pendingApprovals + pendingGateApprovals > 0 ? "text-amber-600" : "text-green-600"}`}>
                    {pendingApprovals + pendingGateApprovals === 0 ? "Clear" : pendingApprovals + pendingGateApprovals}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Programme RAG</span>
                  <span className="flex items-center gap-1.5">
                    {activeProgrammesRAG.Red > 0 && <span className="text-xs font-bold text-red-600">{activeProgrammesRAG.Red}R</span>}
                    {activeProgrammesRAG.Amber > 0 && <span className="text-xs font-bold text-amber-600">{activeProgrammesRAG.Amber}A</span>}
                    {activeProgrammesRAG.Green > 0 && <span className="text-xs font-bold text-green-600">{activeProgrammesRAG.Green}G</span>}
                    {activeProgrammesRAG.Red === 0 && activeProgrammesRAG.Amber === 0 && activeProgrammesRAG.Green === 0 && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-500" /> Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500">No recent lifecycle activity recorded yet.</p>
              ) : (
                recentActivity.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{event.actor}</span> {event.action}
                      </p>
                      {event.note ? <p className="text-xs text-gray-500 mt-0.5">{event.note}</p> : null}
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(event.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-500" /> Benefits Summary
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <S3KpiCard color="plain" label="Planned" value={String(benefitsSummary.planned)} sub="benefits tracked" />
              <S3KpiCard color="green" label="Realized" value={String(benefitsSummary.realized)} sub="completed outcomes" />
              <S3KpiCard color="orange" label="Rate" value={`${benefitsSummary.rate}%`} sub="realization rate" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Pending Approvals View ─────────────────────────────────────────────────────

const PRIORITY_RANK: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function PendingApprovalsView({
  approvals,
  onAction,
  gateApprovals,
  onGateAction,
}: {
  approvals: InitiativeApprovalRequest[];
  onAction: (a: InitiativeApprovalRequest, action: ApprovalStatus) => void;
  gateApprovals: ApprovalWorkflow[];
  onGateAction: (approval: ApprovalWorkflow, decision: "approved" | "rejected" | "conditional") => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Clarification Requested" | "Escalated">("All");
  const [sortBy, setSortBy] = useState<"oldest" | "priority" | "division">("oldest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = statusFilter === "All" ? approvals : approvals.filter((a) => a.status === statusFilter);
    if (sortBy === "oldest") list = [...list].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    else if (sortBy === "priority") list = [...list].sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9));
    else if (sortBy === "division") list = [...list].sort((a, b) => a.division.localeCompare(b.division));
    return list;
  }, [approvals, statusFilter, sortBy]);

  return (
    <div className="space-y-5">
      {/* Header + controls */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Initiative requests awaiting TO review.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["All", "Pending", "Clarification Requested", "Escalated"] as const).map((s) => (
                <SelectItem key={s} value={s}>{s === "All" ? "All statuses" : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="priority">By priority</SelectItem>
              <SelectItem value="division">By division</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
            {filtered.length} shown
          </Badge>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Inbox className="w-8 h-8 text-gray-300" />} message="No approvals match" />
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const isExpanded = expandedId === a.id;
            const initiative = getInitiatives().find((i) => i.name === a.initiativeName);
            const framework = getFrameworkByType(a.frameworkType);
            const activityLog = initiative?.activity ?? [];

            return (
              <Card key={a.id} className="border-gray-200">
                <CardContent className="p-5 space-y-4">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`text-xs border ${APPROVAL_STATUS_BADGES[a.status]}`}>{a.status}</Badge>
                        <Badge variant="outline" className={`text-xs border ${a.priority === "Critical" ? "border-red-200 bg-red-50 text-red-700" : a.priority === "High" ? "border-orange-200 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-700"}`}>
                          {a.priority}
                        </Badge>
                        <Badge variant="outline" className={`text-xs border ${a.isExternal ? "border-blue-200 bg-blue-50 text-blue-700" : "border-teal-200 bg-teal-50 text-teal-700"}`}>
                          {a.isExternal ? "External" : "Internal"}
                        </Badge>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">{a.initiativeName}</h3>
                      <p className="text-sm text-gray-500">{a.frameworkType} · {a.division}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-right text-xs text-gray-400">
                        <p>Submitted {fmtDate(a.submittedAt)}</p>
                        <p>by {a.submittedBy}</p>
                      </div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        className="flex items-center gap-1 text-xs text-orange-600 font-medium hover:text-orange-800 mt-0.5 flex-shrink-0"
                      >
                        {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Less</> : <><ChevronDown className="w-3.5 h-3.5" /> More detail</>}
                      </button>
                    </div>
                  </div>

                  {/* Summary fields — always visible */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-500">Objective</p>
                      <p className="text-sm text-slate-700">{a.objective}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-500">Scope</p>
                      <p className="text-sm text-slate-700">{a.scope}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div><p className="text-xs text-gray-400">Proposed Owner</p><p className="font-medium text-gray-800">{a.proposedOwner}</p></div>
                    <div><p className="text-xs text-gray-400">Key Stakeholders</p><p className="font-medium text-gray-800">{a.keyStakeholders}</p></div>
                    <div><p className="text-xs text-gray-400">Target Start</p><p className="font-medium text-gray-800">{fmtDate(a.targetStartDate)}</p></div>
                  </div>

                  {a.estimatedBudget && (
                    <div className="text-sm">
                      <p className="text-xs text-gray-400">Estimated Budget</p>
                      <p className="font-medium text-gray-800">{a.estimatedBudget}</p>
                    </div>
                  )}

                  {a.additionalContext && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-600 mb-1">Additional context</p>
                      <p className="text-sm text-blue-800">{a.additionalContext}</p>
                    </div>
                  )}

                  {/* ── Expanded detail panels ── */}
                  {isExpanded && (
                    <div className="space-y-4 pt-1">
                      <Separator />

                      {/* 1. Portfolio context block */}
                      {initiative?.fromPortfolio && (
                        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Portfolio Context</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-violet-600">Source Asset Card</p>
                              <p className="font-medium text-violet-900">{initiative.portfolioCardId}</p>
                            </div>
                            <div>
                              <p className="text-xs text-violet-600">Initiative Link</p>
                              <p className="font-medium text-violet-900">Derived from portfolio gap</p>
                            </div>
                          </div>
                          {a.contextFromPortfolio && (
                            <div>
                              <p className="text-xs text-violet-600 mb-1">Condition & Recommendation</p>
                              <p className="text-sm text-violet-800">{a.contextFromPortfolio}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. Framework detail panel */}
                      {framework ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Framework Detail</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-slate-500">Name</p>
                              <p className="font-medium text-slate-900 line-clamp-2">{framework.type}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Type</p>
                              <p className="font-medium text-slate-900">{framework.category}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Typical Duration</p>
                              <p className="font-medium text-slate-900">{framework.typicalDuration}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Scope</p>
                              <p className="font-medium text-slate-900">{framework.typicalScope}</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{framework.description}</p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Framework Detail</p>
                          <p className="text-sm text-slate-500">Framework type "{a.frameworkType}" — no card match found.</p>
                        </div>
                      )}

                      {/* 3. Approval history */}
                      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Approval History</p>
                        {activityLog.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No activity recorded yet for this initiative.</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {[...activityLog].reverse().map((entry) => (
                              <div key={entry.id} className="flex items-start gap-3 py-1.5 border-b border-slate-100 last:border-0">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-slate-700">{entry.action}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{entry.actor} · {fmtDate(entry.timestamp)}</p>
                                </div>
                                <Badge variant="outline" className="text-xs border-slate-200 text-slate-500 flex-shrink-0">{entry.type}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onAction(a, "Approved")}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => onAction(a, "Clarification Requested")}>
                      <MessageSquare className="w-3.5 h-3.5 mr-1" /> Request Clarification
                    </Button>
                    <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => onAction(a, "Escalated")}>
                      <Flag className="w-3.5 h-3.5 mr-1" /> Escalate
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => onAction(a, "Rejected")}>
                      <CircleSlash className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Gate approvals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pending Gate Approvals</h2>
            <p className="text-sm text-gray-500">Gate submissions with evidence captured from initiative delivery teams.</p>
          </div>
          <Badge variant="outline">{gateApprovals.length} pending</Badge>
        </div>
        {gateApprovals.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="w-8 h-8 text-gray-300" />} message="No pending gate approvals" />
        ) : (
          <div className="space-y-3">
            {gateApprovals.map((approval) => (
              <Card key={approval.id} className="border-gray-200">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">{approval.gate.stage}</p>
                      <h3 className="text-base font-semibold text-gray-900 mt-1">{approval.gate.name}</h3>
                      <p className="text-sm text-gray-500">{approval.lifecycleInstanceName}</p>
                    </div>
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200">Pending</Badge>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Submission Evidence</p>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{approval.submissionNotes}</p>
                    {approval.documentStudioRef ? (
                      <p className="text-xs text-slate-500 mt-2">Document Studio: {approval.documentStudioRef}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onGateAction(approval, "approved")}>Approve</Button>
                    <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => onGateAction(approval, "conditional")}>Conditional</Button>
                    <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => onGateAction(approval, "rejected")}>Reject</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Active Programmes View ────────────────────────────────────────────────────

const SEVERITY_RANK: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function ActiveProgrammesView({ initiatives, onRefresh }: { initiatives: Initiative[]; onRefresh: () => void }) {
  const [divisionFilter, setDivisionFilter] = useState<string>("All");
  const [ragFilter, setRagFilter] = useState<"All" | RAGStatus>("All");
  const [sortBy, setSortBy] = useState<"rag" | "division" | "targetDate">("rag");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // TO action state per expanded initiative
  const [statusAction, setStatusAction] = useState<InitiativeStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [observationText, setObservationText] = useState("");
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const divisions = useMemo(() => ["All", ...Array.from(new Set(initiatives.map((i) => i.division))).sort()], [initiatives]);

  const filtered = useMemo(() => {
    let list = initiatives;
    if (divisionFilter !== "All") list = list.filter((i) => i.division === divisionFilter);
    if (ragFilter !== "All") list = list.filter((i) => computeInitiativeRAG(i) === ragFilter);
    if (sortBy === "rag") {
      const rankMap: Record<RAGStatus, number> = { Red: 0, Amber: 1, Green: 2 };
      list = [...list].sort((a, b) => rankMap[computeInitiativeRAG(a)] - rankMap[computeInitiativeRAG(b)]);
    } else if (sortBy === "division") {
      list = [...list].sort((a, b) => a.division.localeCompare(b.division));
    } else {
      list = [...list].sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
    }
    return list;
  }, [initiatives, divisionFilter, ragFilter, sortBy]);

  const handleExpand = (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    setStatusAction("");
    setStatusNote("");
    setObservationText("");
    setShowAuditTrail(false);
  };

  const handleStatusUpdate = (ini: Initiative) => {
    if (!statusAction) { toast({ title: "Select a status" }); return; }
    if (!statusNote.trim()) { toast({ title: "TO note required", description: "Provide a note before updating the status." }); return; }
    updateInitiativeStatus(ini.id, statusAction as InitiativeStatus);
    addInitiativeObservation(ini.id, `Status updated to "${statusAction}". TO note: ${statusNote.trim()}`, "Transformation Office");
    window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecycle.portfolioStore" }));
    toast({ title: "Status updated", description: `${ini.name} → ${statusAction}` });
    setStatusAction("");
    setStatusNote("");
    onRefresh();
  };

  const handleObservation = (ini: Initiative) => {
    if (!observationText.trim()) { toast({ title: "Observation text required" }); return; }
    addInitiativeObservation(ini.id, observationText.trim(), "Transformation Office");
    window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecycle.portfolioStore" }));
    toast({ title: "Observation recorded" });
    setObservationText("");
    onRefresh();
  };

  const handleFlag = (ini: Initiative) => {
    const next = !ini.flaggedForEscalation;
    setInitiativeFlagged(ini.id, next);
    window.dispatchEvent(new StorageEvent("storage", { key: "dtmp.lifecycle.portfolioStore" }));
    toast({ title: next ? "Flagged for escalation" : "Flag removed", description: ini.name });
    onRefresh();
  };

  return (
    <div className="space-y-5">
      {/* Header + filters */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Active Programmes</h1>
          <p className="text-sm text-gray-500 mt-0.5">All initiatives currently in delivery.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {divisions.map((d) => <SelectItem key={d} value={d}>{d === "All" ? "All divisions" : d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={ragFilter} onValueChange={(v) => setRagFilter(v as typeof ragFilter)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["All", "Red", "Amber", "Green"] as const).map((r) => <SelectItem key={r} value={r}>{r === "All" ? "All RAG" : r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rag">RAG Red first</SelectItem>
              <SelectItem value="division">By division</SelectItem>
              <SelectItem value="targetDate">By target date</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline">{filtered.length} shown</Badge>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Play className="w-8 h-8 text-gray-300" />} message="No programmes match" />
      ) : (
        <div className="space-y-4">
          {filtered.map((ini) => {
            const rag = computeInitiativeRAG(ini);
            const isExpanded = expandedId === ini.id;
            const risks = getRisksByInitiativeId(ini.id);
            const blockers = getBlockersByInitiativeId(ini.id);
            const openRisks = risks.filter((r) => r.status === "Open");
            const openBlockers = blockers.filter((b) => !b.resolved);
            const hasDivHeadEscalation = openBlockers.some((b) => b.escalationStatus === "Escalated to Division Head");
            const topRisk = openRisks.sort((a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9))[0];
            const ragDot: Record<RAGStatus, string> = { Red: "bg-red-500", Amber: "bg-amber-400", Green: "bg-green-500" };

            return (
              <Card key={ini.id} className={`border-gray-200 ${rag === "Red" ? "border-red-200" : rag === "Amber" ? "border-amber-200" : ""}`}>
                <CardContent className="p-5 space-y-3">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ragDot[rag]}`} />
                        <p className="text-xs text-gray-400">{ini.division}</p>
                        {ini.flaggedForEscalation && (
                          <Badge className="text-xs border border-red-200 bg-red-50 text-red-700">Flagged</Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{ini.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`text-xs border ${INITIATIVE_STATUS_BADGES[ini.status]}`}>{ini.status}</Badge>
                      <button onClick={() => handleExpand(ini.id)} className="text-xs text-orange-600 font-medium hover:text-orange-800 flex items-center gap-0.5">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{ini.owner ?? "Unassigned"}</span>
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{ini.projects.length} projects</span>
                    <span className="ml-auto font-medium text-gray-700">{fmtBudget(ini.budget)}</span>
                  </div>

                  {/* Progress */}
                  {(ini.status === "Active" || ini.status === "At Risk") && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span><span className="font-medium text-gray-700">{ini.progress}%</span>
                      </div>
                      <Progress value={ini.progress} className="h-1.5" />
                    </div>
                  )}

                  {/* Top risk + open blockers */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500 mb-0.5">Top Risk</p>
                      {topRisk ? (
                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-xs border ${ESCALATION_SEVERITY_BADGES[topRisk.severity as keyof typeof ESCALATION_SEVERITY_BADGES]}`}>{topRisk.severity}</Badge>
                          <p className="text-xs font-medium text-slate-800 line-clamp-1">{topRisk.title}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">None</p>
                      )}
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500 mb-0.5">Open Blockers</p>
                      <p className={`text-sm font-bold ${hasDivHeadEscalation ? "text-red-600" : openBlockers.length > 0 ? "text-amber-600" : "text-slate-700"}`}>
                        {openBlockers.length}
                        {hasDivHeadEscalation && <span className="text-xs font-normal ml-1 text-red-500">Div. Head escalated</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>EA: {ini.eaAlignmentScore == null ? "Not Assessed" : `${ini.eaAlignmentScore}%`}</span>
                    <span>Target: {ini.targetDate}</span>
                  </div>

                  {/* ── Expanded TO actions ── */}
                  {isExpanded && (
                    <div className="space-y-4 pt-2 border-t border-slate-200">

                      {/* 1. Update initiative status */}
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Update Initiative Status</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Select value={statusAction} onValueChange={(v) => setStatusAction(v as InitiativeStatus)}>
                            <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Select new status…" /></SelectTrigger>
                            <SelectContent>
                              {(["Active", "Scoping", "At Risk", "On Hold", "Completed"] as InitiativeStatus[]).map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Textarea
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="TO note (required)…"
                            className="text-xs min-h-[60px] bg-white"
                          />
                        </div>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white text-xs" onClick={() => handleStatusUpdate(ini)}>
                          Update Status
                        </Button>
                      </div>

                      {/* 2. Add TO observation */}
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Add TO Observation</p>
                        <Textarea
                          value={observationText}
                          onChange={(e) => setObservationText(e.target.value)}
                          placeholder="Record a TO observation or note for this initiative…"
                          className="text-xs min-h-[60px] bg-white"
                        />
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => handleObservation(ini)}>
                          Save Observation
                        </Button>
                      </div>

                      {/* 3. Flag for escalation */}
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Flag for Escalation</p>
                          <p className="text-xs text-slate-500">Mark this initiative for senior TO attention.</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className={ini.flaggedForEscalation ? "border-red-200 text-red-700 hover:bg-red-50 text-xs" : "text-xs"}
                          onClick={() => handleFlag(ini)}
                        >
                          <Flag className="w-3 h-3 mr-1" />
                          {ini.flaggedForEscalation ? "Remove Flag" : "Flag"}
                        </Button>
                      </div>

                      {/* 4. Audit trail */}
                      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                        <button
                          onClick={() => setShowAuditTrail((v) => !v)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 uppercase tracking-wide"
                        >
                          {showAuditTrail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          View Full Audit Trail ({ini.activity.length} entries)
                        </button>
                        {showAuditTrail && (
                          <div className="space-y-2 max-h-64 overflow-y-auto mt-2">
                            {ini.activity.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
                            ) : (
                              [...ini.activity].reverse().map((entry) => (
                                <div key={entry.id} className="flex items-start gap-3 py-1.5 border-b border-slate-100 last:border-0">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-700">{entry.action}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{entry.actor} · {fmtDate(entry.timestamp)}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs border-slate-200 text-slate-500 flex-shrink-0">{entry.type}</Badge>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Service Requests View ─────────────────────────────────────────────────────

function ServiceRequestsView({
  requests,
  onAction,
}: {
  requests: LCServiceRequest[];
  onAction: (r: LCServiceRequest, next: LCRequestStatus) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<LCRequestStatus | "all">("all");
  const [slaFilter, setSlaFilter] = useState<"All" | "On Track" | "At Risk" | "Breached">("All");
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [noteSaving, setNoteSaving] = useState<string | null>(null);

  const divisions = useMemo(() => {
    const seen = new Set<string>();
    requests.forEach((r) => {
      const div = getInitiativeById(r.initiativeId)?.division;
      if (div) seen.add(div);
    });
    return ["All", ...Array.from(seen).sort()];
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (slaFilter !== "All" && slaStatus(r) !== slaFilter) return false;
      if (divisionFilter !== "All") {
        const div = getInitiativeById(r.initiativeId)?.division;
        if (div !== divisionFilter) return false;
      }
      return true;
    });
  }, [requests, statusFilter, slaFilter, divisionFilter]);

  const nextStatusMap: Partial<Record<LCRequestStatus, { label: string; next: LCRequestStatus }>> = {
    Submitted: { label: "Assign", next: "Assigned" },
    Assigned: { label: "Start Work", next: "In Progress" },
    "In Progress": { label: "Deliver", next: "Delivered" },
    Delivered: { label: "Complete", next: "Completed" },
  };

  const saveNote = (reqId: string) => {
    setNoteSaving(reqId);
    updateLCRequestNotes(reqId, noteDraft[reqId] ?? "");
    setTimeout(() => setNoteSaving(null), 800);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Service Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">All open lifecycle service requests.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Division filter */}
          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue placeholder="All divisions" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* SLA status filter */}
          <Select value={slaFilter} onValueChange={(v) => setSlaFilter(v as any)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All SLA" />
            </SelectTrigger>
            <SelectContent>
              {(["All", "On Track", "At Risk", "Breached"] as const).map((s) => (
                <SelectItem key={s} value={s}>{s === "All" ? "All SLA" : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(["Submitted", "Assigned", "In Progress", "Delivered"] as LCRequestStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="outline">{filtered.length} shown</Badge>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ClipboardList className="w-8 h-8 text-gray-300" />} message="No requests match" />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const action = nextStatusMap[r.status];
            const sl = slaStatus(r);
            const isAtRisk = sl === "At Risk" || sl === "Breached";
            const isExpanded = expandedId === r.id;
            const division = getInitiativeById(r.initiativeId)?.division;
            const currentNote = noteDraft[r.id] ?? r.internalToNotes ?? "";

            return (
              <Card key={r.id} className={`border-gray-200 ${sl === "Breached" ? "border-red-200 bg-red-50/10" : sl === "At Risk" ? "border-amber-200 bg-amber-50/10" : ""}`}>
                <CardContent className="p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`text-xs border ${STATUS_BADGES[r.status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {r.status}
                        </Badge>
                        <Badge className={`text-xs border ${slaClass(r)}`}>{slaLabel(r)}</Badge>
                        <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">{r.priority}</Badge>
                        {division && <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">{division}</Badge>}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{r.serviceType}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.initiativeName}{r.projectName ? ` · ${r.projectName}` : ""}</p>
                    </div>

                    <div className="text-right text-xs text-gray-400 flex-shrink-0">
                      <p>By {r.submittedBy}</p>
                      <p>{fmtDate(r.submittedAt)}</p>
                      {r.assignedTo ? (
                        <p className={`font-medium ${isAtRisk && r.assignedTo === "Unassigned" ? "text-red-600" : "text-teal-600"}`}>
                          → {r.assignedTo}
                        </p>
                      ) : isAtRisk ? (
                        <p className="font-medium text-red-600">Unassigned</p>
                      ) : null}
                    </div>
                  </div>

                  {r.notes && (
                    <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 border border-gray-100">{r.notes}</p>
                  )}

                  {/* Action + expand row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-gray-500 hover:text-gray-700 h-7 px-2"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                      {isExpanded ? "Hide details" : "Notes & history"}
                    </Button>
                    {action && (
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                        onClick={() => onAction(r, action.next)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        {action.label}
                      </Button>
                    )}
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 pt-3 space-y-4">
                      {/* Internal TO notes */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                          <Activity className="w-3 h-3" /> Internal TO Notes
                          <span className="text-slate-400 font-normal ml-1">(not visible to requestor)</span>
                        </p>
                        <Textarea
                          value={currentNote}
                          onChange={(e) => setNoteDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                          placeholder="Add internal notes for the TO team…"
                          rows={3}
                          className="text-xs"
                        />
                        <div className="flex justify-end mt-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => saveNote(r.id)}
                            disabled={noteSaving === r.id}
                          >
                            {noteSaving === r.id ? "Saved ✓" : "Save note"}
                          </Button>
                        </div>
                      </div>

                      {/* Action history */}
                      {r.actionLog && r.actionLog.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1.5">Action History</p>
                          <div className="space-y-1.5">
                            {[...r.actionLog].reverse().map((entry) => (
                              <div key={entry.id} className="flex items-start gap-2 text-xs">
                                <span className="text-gray-400 tabular-nums flex-shrink-0">{fmtDate(entry.timestamp)}</span>
                                <span className="text-teal-700 font-medium flex-shrink-0">{entry.actor}</span>
                                <span className="text-gray-600">{entry.action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!r.actionLog || r.actionLog.length === 0) && (
                        <p className="text-xs text-gray-400 italic">No action history yet.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Escalations View ──────────────────────────────────────────────────────────

function EscalationsView({
  escalations,
  onAction,
}: {
  escalations: LCEscalation[];
  onAction: (e: LCEscalation, action: EscalationStatus) => void;
}) {
  const [severityFilter, setSeverityFilter] = useState<EscalationSeverity | "All">("All");
  const [statusFilter, setStatusFilter] = useState<EscalationStatus | "All">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [noteSaving, setNoteSaving] = useState<string | null>(null);

  const openCount = useMemo(
    () => escalations.filter((e) => e.status === "Open" || e.status === "Acknowledged").length,
    [escalations]
  );

  const filtered = useMemo(() => {
    return escalations.filter((e) => {
      if (severityFilter !== "All" && e.severity !== severityFilter) return false;
      if (statusFilter !== "All" && e.status !== statusFilter) return false;
      return true;
    });
  }, [escalations, severityFilter, statusFilter]);

  const saveNote = (escId: string) => {
    setNoteSaving(escId);
    updateEscalationNotes(escId, noteDraft[escId] ?? "");
    setTimeout(() => setNoteSaving(null), 800);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Escalations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Blockers, risks, and decisions requiring TO response.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Severity filter */}
          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as any)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All severity" />
            </SelectTrigger>
            <SelectContent>
              {(["All", "Critical", "High", "Medium", "Low"] as const).map((s) => (
                <SelectItem key={s} value={s}>{s === "All" ? "All severity" : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {(["All", "Open", "Acknowledged", "Resolved", "Escalated Further"] as const).map((s) => (
                <SelectItem key={s} value={s}>{s === "All" ? "All statuses" : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="outline" className={openCount > 0 ? "border-red-200 text-red-700 bg-red-50" : "border-gray-200 text-gray-500"}>
            {openCount} open
          </Badge>
          <Badge variant="outline">{filtered.length} shown</Badge>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ShieldAlert className="w-8 h-8 text-gray-300" />} message="No escalations match" />
      ) : (
        <div className="space-y-4">
          {filtered.map((e) => {
            const age = escalationAgeLabel(e.dateRaised);
            const isExpanded = expandedId === e.id;
            const isResolved = e.status === "Resolved" || e.status === "Escalated Further";
            const currentNote = noteDraft[e.id] ?? e.internalToNotes ?? "";

            return (
              <Card key={e.id} className={`border-gray-200 ${e.severity === "Critical" ? "border-red-200 bg-red-50/20" : e.severity === "High" ? "border-orange-200 bg-orange-50/10" : ""}`}>
                <CardContent className="p-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`text-xs border ${ESCALATION_SEVERITY_BADGES[e.severity]}`}>{e.severity}</Badge>
                        <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">{e.type}</Badge>
                        <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">{e.status}</Badge>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">{e.title}</h3>
                      <p className="text-xs text-gray-500">{e.initiativeName}{e.projectName ? ` · ${e.projectName}` : ""}</p>
                    </div>
                    <div className="text-right text-xs text-gray-400 flex-shrink-0">
                      <p>Raised by {e.raisedBy}</p>
                      <p>{fmtDate(e.dateRaised)}</p>
                      <p className={`font-medium ${age.className}`}>Days Open: {age.label}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-slate-500 mb-1">What is needed</p>
                    <p className="text-sm text-slate-700">{e.whatIsNeeded}</p>
                  </div>

                  {e.toResponse && (
                    <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-teal-600 mb-1">TO Response</p>
                      <p className="text-sm text-teal-800">{e.toResponse}</p>
                    </div>
                  )}

                  {e.resolvedNote && (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-600 mb-1">Resolution</p>
                      <p className="text-sm text-green-800">{e.resolvedNote}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Actions + expand */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-gray-500 hover:text-gray-700 h-7 px-2"
                      onClick={() => setExpandedId(isExpanded ? null : e.id)}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                      {isExpanded ? "Hide details" : "Notes & history"}
                    </Button>

                    {!isResolved && (
                      <div className="flex flex-wrap gap-2">
                        {e.status === "Open" && (
                          <Button size="sm" variant="outline" className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => onAction(e, "Acknowledged")}>
                            Acknowledge
                          </Button>
                        )}
                        <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => onAction(e, "Resolved")}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Resolve
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={() => onAction(e, "Escalated Further")}>
                          <Flag className="w-3 h-3 mr-1" /> Escalate Further
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 pt-3 space-y-4">
                      {/* Internal TO notes */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                          <Activity className="w-3 h-3" /> Internal TO Notes
                          <span className="text-slate-400 font-normal ml-1">(not visible to initiative owner)</span>
                        </p>
                        <Textarea
                          value={currentNote}
                          onChange={(ev) => setNoteDraft((d) => ({ ...d, [e.id]: ev.target.value }))}
                          placeholder="Add internal notes for the TO team…"
                          rows={3}
                          className="text-xs"
                        />
                        <div className="flex justify-end mt-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => saveNote(e.id)}
                            disabled={noteSaving === e.id}
                          >
                            {noteSaving === e.id ? "Saved ✓" : "Save note"}
                          </Button>
                        </div>
                      </div>

                      {/* Action history */}
                      {e.actionLog && e.actionLog.length > 0 ? (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1.5">Action History</p>
                          <div className="space-y-1.5">
                            {[...e.actionLog].reverse().map((entry) => (
                              <div key={entry.id} className="flex items-start gap-2 text-xs">
                                <span className="text-gray-400 tabular-nums flex-shrink-0">{fmtDate(entry.timestamp)}</span>
                                <span className="text-teal-700 font-medium flex-shrink-0">{entry.actor}</span>
                                <span className="text-gray-600">{entry.action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No action history yet.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Completed View ────────────────────────────────────────────────────────────

function CompletedView({
  initiatives,
  requests,
}: {
  initiatives: Initiative[];
  requests: LCServiceRequest[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Completed</h1>
        <p className="text-sm text-gray-500 mt-0.5">Delivered initiatives and completed service requests.</p>
      </div>

      {/* Completed initiatives */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" /> Completed Initiatives ({initiatives.length})
        </h2>
        {initiatives.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No completed initiatives yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {initiatives.map((ini) => (
              <Card key={ini.id} className="border-green-100 bg-green-50/20">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">{ini.division}</p>
                    <p className="text-sm font-semibold text-gray-900">{ini.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ini.type} · {fmtBudget(ini.budget)}</p>
                  </div>
                  <Badge className="text-xs border bg-green-100 text-green-700 border-green-200 flex-shrink-0">Completed</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed requests */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-teal-600" /> Completed Requests ({requests.length})
        </h2>
        {requests.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No completed requests yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.slice(0, 20).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{r.serviceType}</p>
                  <p className="text-xs text-gray-500">{r.initiativeName}</p>
                </div>
                <div className="text-right text-xs text-gray-400 flex-shrink-0">
                  {r.deliverableTitle && <p className="text-teal-600 font-medium">{r.deliverableTitle}</p>}
                  <p>{fmtDate(r.submittedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
      <div className="mb-3">{icon}</div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
