import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Activity, ArrowRight, Brain, ChevronRight, Cpu, Database, Eye, FileText, Globe, Layers, Leaf, Network, RefreshCw, Search, Server, Shield, SlidersHorizontal, TrendingUp, Users, X, Zap } from "lucide-react";
import LCInitiativeDetailPanel from "./lifecycle/LCInitiativeDetailPanel";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SeeInsightsDrawer } from "@/components/lifecycle/SeeInsightsDrawer";
import { RoleSelectorModal } from "@/components/lifecycle/RoleSelectorModal";
import { LCInsightsLoginModal } from "@/components/lifecycle/LCInsightsLoginModal";
import ExploreStartStepper from "@/components/lifecycle/ExploreStartStepper";
import FrameworkSidePanel from "@/components/lifecycle/FrameworkSidePanel";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

import {
  computeInitiativeRAG,
  getInitiatives,
  getPortfolioSummary,
  type Division,
  type Initiative,
  type InitiativeStatus,
  type InitiativeType,
} from "@/data/shared/lifecyclePortfolioStore";
import {
  getDemoAccount,
  getLifecycleRole,
  type LifecycleInsightsRole,
  LIFECYCLE_ROLE_LABELS,
} from "@/data/shared/lifecycleRole";
import { isUserAuthenticated } from "@/data/sessionAuth";

import {
  initiativeFrameworks,
  type InitiativeFramework,
} from "@/data/lifecycle/frameworkCards";
import { lifecycleTemplates } from "@/data/lifecycle/lifecycleData";
import {
  INITIATIVE_LEVEL_SERVICES,
  LC_SERVICE_SLA,
  addApprovalRequest,
  type InitiativeApprovalRequest,
  addLCRequest,
  type LCServiceType,
} from "@/data/lifecycle/serviceRequestState";
import { DEWA_ROLE_OPTIONS } from "@/data/shared/dewaRoles";
import { STRATEGIC_PRIORITY_BY_SLUG, isStrategicPrioritySlug, type StrategicPrioritySlug } from "@/data/strategicPriorities";

type Stage1Tab = "initiatives" | "explore-start";

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

const fmtBudget = (b: number | null | undefined) =>
  b == null ? "TBC" : `AED ${(b / 1_000_000).toFixed(0)}M`;

const fmtAed = (value: number | null | undefined) =>
  value == null ? "TBC" : `AED ${value.toLocaleString()}`;

const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const addHours = (isoDate: string, hours: number) =>
  new Date(new Date(isoDate).getTime() + hours * 60 * 60 * 1000).toISOString();

const APPROVAL_RESPONSE_HOURS: Record<(typeof PRIORITY_OPTIONS)[number], number> = {
  Critical: 48,
  High: 72,
  Medium: 120,
  Low: 120,
};

const ALL_STATUSES: InitiativeStatus[] = ["Active", "Scoping", "At Risk", "On Hold", "Completed", "Pending", "Clarification Requested", "Rejected"];

const ALL_TYPES: InitiativeType[] = [
  "Architecture Remediation", "Application Modernisation", "Technology Rationalisation",
  "AI Deployment", "EA Maturity Improvement", "DXP Programme", "DWS Modernisation",
  "IT/OT Convergence", "Net-Zero Technology", "Security Uplift", "Data Platform",
  "Platform Deployment", "Digital", "Operational", "Strategic", "Innovation",
];

const PRIORITY_OPTIONS = ["Critical", "High", "Medium", "Low"] as const;

const DIVISION_OPTIONS: Division[] = [
  "Generation",
  "Transmission",
  "Distribution",
  "Water",
  "Customer Services",
  "Corporate & Strategy",
  "Business Support & HR",
  "Innovation & AI",
  "DEWA Group Subsidiaries",
  "All Divisions",
];

const ALL_DIVISION_FILTERS: Array<Division | "all"> = ["all", ...DIVISION_OPTIONS];

const INITIATIVE_CARD_TYPE_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-amber-50 text-amber-800 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
] as const;

function pickTypeBadgeClasses(type: string): string {
  const idx = type.length % INITIATIVE_CARD_TYPE_COLORS.length;
  return INITIATIVE_CARD_TYPE_COLORS[idx] ?? INITIATIVE_CARD_TYPE_COLORS[0];
}

const DIVISION_GRADIENT: Partial<Record<Division, string>> = {
  Generation: "from-orange-400 to-amber-500",
  Transmission: "from-blue-400 to-blue-600",
  Distribution: "from-green-400 to-teal-500",
  Water: "from-cyan-400 to-blue-500",
  "Customer Services": "from-purple-400 to-violet-500",
  "Corporate & Strategy": "from-slate-400 to-gray-600",
  "Business Support & HR": "from-rose-400 to-pink-500",
  "Innovation & AI": "from-violet-400 to-purple-600",
  "DEWA Group Subsidiaries": "from-emerald-400 to-teal-600",
  "All Divisions": "from-orange-400 to-red-500",
};

function getInitiativeIcon(type: InitiativeType) {
  const map: Partial<Record<InitiativeType, typeof Activity>> = {
    "Architecture Remediation": Network,
    "Application Modernisation": Server,
    "Technology Rationalisation": Layers,
    "AI Deployment": Brain,
    "EA Maturity Improvement": TrendingUp,
    "DXP Programme": Globe,
    "DWS Modernisation": Zap,
    "IT/OT Convergence": Cpu,
    "Net-Zero Technology": Leaf,
    "Security Uplift": Shield,
    "Data Platform": Database,
    "Platform Deployment": Server,
    "Digital": Globe,
    "Operational": Activity,
    "Strategic": TrendingUp,
    "Innovation": Zap,
  };
  return map[type] ?? Activity;
}

const FRAMEWORK_ICON_MAP: Record<string, typeof Activity> = {
  Brain,
  Cpu,
  Database,
  Globe,
  Layers,
  Leaf,
  Network,
  RefreshCw,
  Server,
  Shield,
  TrendingUp,
  Users: Activity,
};

function normalizeFrameworkLabel(label: string): string {
  return label
    .replace(" Initiative", "")
    .replace(" Programme", "")
    .replace(" Program", "")
    .trim()
    .toLowerCase();
}

function templateComplexity(templateId?: string): "simple" | "moderate" | "complex" {
  const template = lifecycleTemplates.find((item) => item.id === templateId);
  return template?.complexity ?? "moderate";
}

function matchesDuration(duration: string, filter: string): boolean {
  const lower = duration.toLowerCase();
  if (filter === "under-3") return lower.includes("2") || lower.includes("3 months");
  if (filter === "3-6") return lower.includes("3") || lower.includes("4") || lower.includes("5") || lower.includes("6");
  if (filter === "6-12") return lower.includes("6") || lower.includes("7") || lower.includes("8") || lower.includes("9") || lower.includes("12");
  if (filter === "12-plus") return lower.includes("12") || lower.includes("18") || lower.includes("24") || lower.includes("36");
  return true;
}

export default function LifecycleManagementPage() {
  const [activeTab, setActiveTab] = useState<Stage1Tab>("initiatives");

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [initiatives, setInitiatives] = useState<Initiative[]>(() => getInitiatives());
  const refreshInitiatives = () => setInitiatives(getInitiatives());
  const [initiativeSearchQuery, setInitiativeSearchQuery] = useState("");

  // ── Sidebar filters ─────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState<"all" | InitiativeStatus>("all");
  const [filterDivision, setFilterDivision] = useState<Division | "all">("all");
  const [filterType, setFilterType] = useState<"all" | InitiativeType>("all");
  const [filterStrategicPriority, setFilterStrategicPriority] = useState<"all" | StrategicPrioritySlug>("all");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const updateSearchParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const updateDivisionFilter = (value: Division | "all") => {
    setFilterDivision(value);
    updateSearchParam("division", value === "all" ? null : value);
  };

  const updatePriorityFilter = (value: "all" | StrategicPrioritySlug) => {
    setFilterStrategicPriority(value);
    updateSearchParam("priority", value === "all" ? null : value);
  };

  const updateStatusFilter = (value: "all" | InitiativeStatus) => {
    setFilterStatus(value);
    updateSearchParam("status", value === "all" ? null : value);
  };

  const updateTypeFilter = (value: "all" | InitiativeType) => {
    setFilterType(value);
    updateSearchParam("type", value === "all" ? null : value);
  };

  const updateInitiativeSearch = (value: string) => {
    setInitiativeSearchQuery(value);
    updateSearchParam("q", value.trim() ? value.trim() : null);
  };

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterDivision("all");
    setFilterType("all");
    setFilterStrategicPriority("all");
    setInitiativeSearchQuery("");
    setSearchParams({}, { replace: true });
  };

  useEffect(() => {
    const divisionParam = searchParams.get("division");
    const priorityParam = searchParams.get("priority");
    const statusParam = searchParams.get("status");
    const typeParam = searchParams.get("type");
    const queryParam = searchParams.get("q");

    setFilterDivision(
      divisionParam && ALL_DIVISION_FILTERS.includes(divisionParam as Division | "all")
        ? (divisionParam as Division | "all")
        : "all"
    );
    setFilterStrategicPriority(isStrategicPrioritySlug(priorityParam) ? priorityParam : "all");
    setFilterStatus(statusParam && (["all", ...ALL_STATUSES] as string[]).includes(statusParam) ? (statusParam as "all" | InitiativeStatus) : "all");
    setFilterType(typeParam && (["all", ...ALL_TYPES] as string[]).includes(typeParam) ? (typeParam as "all" | InitiativeType) : "all");
    setInitiativeSearchQuery(queryParam ?? "");
  }, [searchParams]);

  useEffect(() => {
    const handleStorage = () => refreshInitiatives();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const strategicPriorityOptions = useMemo(
    () => getPortfolioSummary().strategicPriorityValues.filter(isStrategicPrioritySlug),
    [initiatives]
  );

  const portfolioSummary = useMemo(() => getPortfolioSummary(), [initiatives]);

  const initiativeRagCounts = useMemo(() => {
    return initiatives.reduce(
      (acc, initiative) => {
        acc[computeInitiativeRAG(initiative)] += 1;
        return acc;
      },
      { Red: 0, Amber: 0, Green: 0 } as Record<"Red" | "Amber" | "Green", number>
    );
  }, [initiatives]);

  const activeFilterCount =
    (filterStatus !== "all" ? 1 : 0) +
    (filterType !== "all" ? 1 : 0) +
    (filterDivision !== "all" ? 1 : 0) +
    (filterStrategicPriority !== "all" ? 1 : 0);

  const filteredInitiatives = useMemo(() => {
    const query = initiativeSearchQuery.trim().toLowerCase();
    return initiatives.filter((ini) => {
      if (filterStatus !== "all" && ini.status !== filterStatus) return false;
      if (filterDivision !== "all" && ini.division !== filterDivision) return false;
      if (filterType !== "all" && ini.type !== filterType) return false;
      if (filterStrategicPriority !== "all" && ini.strategicPriority !== filterStrategicPriority) return false;
      if (query) {
        const haystack = [
          ini.name,
          ini.description,
          ini.type,
          ini.division,
          ini.owner,
          ini.strategicPriority ? STRATEGIC_PRIORITY_BY_SLUG[ini.strategicPriority]?.title ?? "" : "",
        ].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [initiatives, filterStatus, filterDivision, filterType, filterStrategicPriority, initiativeSearchQuery]);

  // ── See Insights (role-gated) ───────────────────────────────────────────────
  const [drawerInitiative, setDrawerInitiative] = useState<Initiative | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRole, setDrawerRole] = useState<LifecycleInsightsRole | null>(() => getLifecycleRole());
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginPendingAction, setLoginPendingAction] = useState<"insights" | "request" | null>(null);

  const handleLoginSuccess = (role: LifecycleInsightsRole) => {
    setLoginModalOpen(false);
    if (loginPendingAction === "insights" && drawerInitiative) {
      setDrawerRole(role);
      setDrawerOpen(true);
    } else if (loginPendingAction === "request" && selectedFramework) {
      setRequestModalOpen(true);
    }
    setLoginPendingAction(null);
  };

  const openSeeInsights = (initiative: Initiative) => {
    setDrawerInitiative(initiative);

    if (!isUserAuthenticated()) {
      setLoginPendingAction("insights");
      setLoginModalOpen(true);
      return;
    }

    const currentRole = getLifecycleRole();
    if (currentRole) {
      setDrawerRole(currentRole);
      setDrawerOpen(true);
      setRoleModalOpen(false);
      return;
    }

    setDrawerRole(null);
    setRoleModalOpen(true);
  };

  // Allow Stage 2 "Open Cockpit" to deep-link into the Stage 1 drawer (demo/localStorage).
  useEffect(() => {
    const key = "dtmp.lifecycle.openInitiativeId";
    const openId = window.localStorage.getItem(key);
    if (!openId) return;

    const initiative = initiatives.find((i) => i.id === openId);
    window.localStorage.removeItem(key);

    if (initiative) openSeeInsights(initiative);
  }, [initiatives]);

  const closeSeeInsights = () => {
    setDrawerOpen(false);
    setDrawerInitiative(null);
    refreshInitiatives();
  };

  const handleChangeRole = () => {
    setDrawerOpen(false);
    setRoleModalOpen(true);
  };

  const handleRoleSelected = (role: LifecycleInsightsRole) => {
    setDrawerRole(role);
    setRoleModalOpen(false);
    // If we already chose an initiative, open the drawer now.
    if (drawerInitiative) setDrawerOpen(true);
  };

  // ── Explore & Start ────────────────────────────────────────────────────────
  const [frameworkCategory, setFrameworkCategory] = useState<"all" | "Internal" | "External">("all");
  const [frameworkComplexity, setFrameworkComplexity] = useState<"all" | "simple" | "moderate" | "complex">("all");
  const [frameworkDuration, setFrameworkDuration] = useState("all");
  const [frameworkDivision, setFrameworkDivision] = useState("all");
  const [frameworkFiltersOpen, setFrameworkFiltersOpen] = useState(true);
  const [frameworkSearchQuery, setFrameworkSearchQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [stakeholderRoles, setStakeholderRoles] = useState<string[]>([]);

  const visibleFrameworks = useMemo(() => {
    const query = frameworkSearchQuery.trim().toLowerCase();
    return initiativeFrameworks.filter((framework) => {
      if (frameworkCategory !== "all" && framework.category !== frameworkCategory) return false;
      if (frameworkComplexity !== "all" && templateComplexity(framework.compatibleTemplates[0]) !== frameworkComplexity) return false;
      if (
        frameworkDivision !== "all" &&
        !framework.divisionRelevance.includes(frameworkDivision) &&
        !framework.divisionRelevance.includes("All Divisions")
      ) {
        return false;
      }
      if (frameworkDuration !== "all" && !matchesDuration(framework.typicalDuration, frameworkDuration)) return false;
      if (query) {
        const haystack = [
          framework.type,
          framework.description,
          framework.keyPhases.join(" "),
          framework.expectedOutcomes.join(" "),
        ].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [frameworkCategory, frameworkComplexity, frameworkDivision, frameworkDuration, frameworkSearchQuery]);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<InitiativeFramework | null>(null);
  const [requestConfirmation, setRequestConfirmation] = useState<InitiativeApprovalRequest | null>(null);

  const [initiativeName, setInitiativeName] = useState("");
  const [initiativeDivision, setInitiativeDivision] = useState<Division>("Transmission");
  const [objective, setObjective] = useState("");
  const [scope, setScope] = useState("");
  const [keyStakeholders, setKeyStakeholders] = useState("");
  const [proposedOwner, setProposedOwner] = useState("");
  const [targetStartDate, setTargetStartDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITY_OPTIONS)[number]>("Medium");
  const [additionalContext, setAdditionalContext] = useState("");

  // ── Portfolio gap-state pre-fill ─────────────────────────────────────────────
  // When navigating here from Portfolio Management ("Initiate in Lifecycle" CTA),
  // location.state carries { openStartInitiative: true, prefill: {...} }.
  useEffect(() => {
    const state = location.state as {
      openStartInitiative?: boolean;
      prefill?: { name?: string; division?: string; objective?: string; scope?: string };
    } | null;
    if (!state?.openStartInitiative) return;

    setActiveTab("explore-start");

    if (state.prefill) {
      const { name, division, objective: obj, scope: sc } = state.prefill;
      if (name) setInitiativeName(name);
      if (division) setInitiativeDivision(division as Division);
      if (obj) setObjective(obj);
      if (sc) setScope(sc);
    }

    // Clear state so a back/forward doesn't re-trigger
    window.history.replaceState({}, "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const openInitiativeRequest = (framework: InitiativeFramework) => {
    setSelectedFramework(framework);
    if (!isUserAuthenticated()) {
      setLoginPendingAction("request");
      setLoginModalOpen(true);
      return;
    }

    setRequestConfirmation(null);
    setStakeholderRoles([]);
    setRequestModalOpen(true);

    // Reset form fields
    setInitiativeName("");
    setInitiativeDivision("Transmission");
    setObjective("");
    setScope("");
    setKeyStakeholders("");
    setProposedOwner("");
    setEstimatedBudget("");
    setPriority("Medium");
    setAdditionalContext("");
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setTargetStartDate(d.toISOString().slice(0, 10));
  };

  const submitInitiativeRequest = () => {
    if (!selectedFramework) return;

    const trimmed = (s: string) => s.trim();
    if (!trimmed(initiativeName)) return toast({ title: "Missing fields", description: "Please enter an initiative name." });
    if (!trimmed(objective)) return toast({ title: "Missing fields", description: "Please provide an objective." });
    if (!trimmed(scope)) return toast({ title: "Missing fields", description: "Please provide a scope." });
    if (!trimmed(keyStakeholders)) return toast({ title: "Missing fields", description: "Please add key stakeholders." });
    if (!trimmed(proposedOwner)) return toast({ title: "Missing fields", description: "Please add a proposed initiative owner." });

    const role = drawerRole ?? "initiative-owner";
    const account = getDemoAccount(role);

    const approval = addApprovalRequest({
      frameworkType: selectedFramework.type,
      initiativeName: trimmed(initiativeName),
      division: initiativeDivision,
      isExternal: selectedFramework.category === "External",
      objective: trimmed(objective),
      scope: trimmed(scope),
      keyStakeholders: trimmed([keyStakeholders, stakeholderRoles.join(", ")].filter(Boolean).join(" | ")),
      proposedOwner: trimmed(proposedOwner),
      targetStartDate,
      estimatedBudget: trimmed(estimatedBudget) || undefined,
      priority,
      additionalContext: trimmed(
        [
          selectedTemplateId ? `Selected template: ${selectedTemplateId}` : "",
          additionalContext,
        ].filter(Boolean).join("\n")
      ) || undefined,
      submittedBy: account.name,
    });

    setRequestConfirmation(approval);
    toast({
      title: "Submitted for TO approval",
      description: "Your initiative request was added to the approval queue.",
    });
  };

  const closeInitiativeRequest = (open: boolean) => {
    setRequestModalOpen(open);
    if (!open) {
      setRequestConfirmation(null);
      setSelectedFramework(null);
    }
  };

  const viewSubmittedRequestStatus = () => {
    setRequestModalOpen(false);
    setRequestConfirmation(null);
    setSelectedFramework(null);
    navigate("/stage2/lifecycle-management", {
      state: { cardId: "initiative-requests" },
    });
  };

  const backToPortfolioFromConfirmation = () => {
    setRequestModalOpen(false);
    setRequestConfirmation(null);
    setSelectedFramework(null);
    setActiveTab("initiatives");
  };

  // ── Request Service (initiative-level) ──────────────────────────────────────
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceInitiative, setServiceInitiative] = useState<Initiative | null>(null);

  const [serviceType, setServiceType] = useState<LCServiceType>(INITIATIVE_LEVEL_SERVICES[0]);
  const [servicePriority, setServicePriority] = useState<(typeof PRIORITY_OPTIONS)[number]>("Medium");
  const [serviceNotes, setServiceNotes] = useState("");

  const openRequestService = (initiative: Initiative) => {
    setServiceInitiative(initiative);
    setServiceType(INITIATIVE_LEVEL_SERVICES[0]);
    setServicePriority("Medium");
    setServiceNotes("");
    setServiceModalOpen(true);
  };

  const submitServiceRequest = () => {
    if (!serviceInitiative) return;

    const role = drawerRole ?? "initiative-owner";
    const account = getDemoAccount(role);

    addLCRequest({
      serviceType,
      initiativeId: serviceInitiative.id,
      initiativeName: serviceInitiative.name,
      submittedBy: account.name,
      submittedByRole: LIFECYCLE_ROLE_LABELS[role],
      status: "Submitted",
      priority: servicePriority,
      notes: serviceNotes.trim() || undefined,
      slaHours: LC_SERVICE_SLA[serviceType],
    });

    setServiceModalOpen(false);
    setServiceInitiative(null);
    navigate("/stage2/lifecycle-management");
    toast({
      title: "Service request submitted",
      description: "Saved locally for the Stage 2 tracker (demo).",
    });
  };


  // ── Initiative Detail Panel ──────────────────────────────────────────────────
  const [detailInitiative, setDetailInitiative] = useState<Initiative | null>(null);

  const getInitiativeProjectCount = (i: Initiative) => i.projects.length;
  const frameworkStats = useMemo(() => {
    return initiativeFrameworks.reduce<Record<string, { active: number; completed: number }>>((acc, framework) => {
      const normalized = normalizeFrameworkLabel(framework.type);
      acc[framework.id] = {
        active: initiatives.filter((initiative) => normalizeFrameworkLabel(initiative.type) === normalized && initiative.status !== "Completed").length,
        completed: initiatives.filter((initiative) => normalizeFrameworkLabel(initiative.type) === normalized && initiative.status === "Completed").length,
      };
      return acc;
    }, {});
  }, [initiatives]);
  const compatibleTemplates = useMemo(
    () => (selectedFramework ? lifecycleTemplates.filter((template) => selectedFramework.compatibleTemplates.includes(template.id)) : []),
    [selectedFramework]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-to-b from-orange-50 to-white py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/marketplaces" className="hover:text-foreground transition-colors">
              Marketplaces
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-foreground">Initiative & Programme Portfolio</span>
          </nav>

          <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold uppercase mb-4">
            Drive
          </span>

          <h1 className="text-3xl lg:text-4xl font-bold text-primary-navy mb-3">Initiative & Programme Portfolio</h1>
          <p className="text-base lg:text-lg text-muted-foreground max-w-4xl mb-4">
            The operational execution layer for DEWA transformation initiatives — from conception through delivery and verified outcome.
          </p>

        </div>
      </section>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Stage1Tab)} className="w-full">
        <div className="bg-white border-b-2 border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <TabsList className="h-auto bg-transparent p-0 gap-2 overflow-x-auto flex justify-start">
              <TabsTrigger
                value="initiatives"
                className="flex items-center gap-2 px-6 py-4 text-muted-foreground hover:text-foreground font-medium transition-colors relative rounded-none border-b-2 border-transparent data-[state=active]:border-orange-600 data-[state=active]:text-primary-navy bg-transparent"
              >
                Portfolio Discovery
              </TabsTrigger>
              <TabsTrigger
                value="explore-start"
                className="flex items-center gap-2 px-6 py-4 text-muted-foreground hover:text-foreground font-medium transition-colors relative rounded-none border-b-2 border-transparent data-[state=active]:border-orange-600 data-[state=active]:text-primary-navy bg-transparent"
              >
                <Search className="w-4 h-4" />
                Explore & Start
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <TabsContent value="initiatives" className="mt-0">
            <div className="space-y-6">
              <section className="sticky top-20 z-20 space-y-4 rounded-2xl border border-gray-200 bg-white/95 px-5 py-5 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Portfolio Overview</p>
                    <h2 className="text-2xl font-semibold text-gray-950">Initiative & Programme Portfolio</h2>
                    <p className="text-sm text-gray-600">
                      Filter the full initiative estate and scan computed delivery health before drilling into detail.
                    </p>
                  </div>
                  <div className="w-full max-w-md">
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        value={initiativeSearchQuery}
                        onChange={(e) => updateInitiativeSearch(e.target.value)}
                        placeholder="Search initiatives, owners, divisions, priorities"
                        className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <Card className="border-gray-200 shadow-none"><CardContent className="p-4"><p className="text-xs font-medium text-gray-500">Total Initiatives</p><p className="mt-2 text-2xl font-semibold text-gray-950">{portfolioSummary.totalInitiatives}</p></CardContent></Card>
                  <Card className="border-gray-200 shadow-none"><CardContent className="p-4"><p className="text-xs font-medium text-gray-500">Active Initiatives</p><p className="mt-2 text-2xl font-semibold text-gray-950">{portfolioSummary.activeInitiatives}</p></CardContent></Card>
                  <Card className="border-gray-200 shadow-none"><CardContent className="p-4 space-y-2"><p className="text-xs font-medium text-gray-500">RAG Distribution</p><div className="flex items-center gap-3 text-sm"><span className="inline-flex items-center gap-1.5 text-red-700"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />{initiativeRagCounts.Red}</span><span className="inline-flex items-center gap-1.5 text-amber-700"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />{initiativeRagCounts.Amber}</span><span className="inline-flex items-center gap-1.5 text-emerald-700"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{initiativeRagCounts.Green}</span></div></CardContent></Card>
                  <Card className="border-gray-200 shadow-none"><CardContent className="p-4"><p className="text-xs font-medium text-gray-500">EA Alignment</p><p className="mt-2 text-2xl font-semibold text-gray-950">{portfolioSummary.avgEaAlignment === null ? "Not assessed" : `${portfolioSummary.avgEaAlignment}/100`}</p></CardContent></Card>
                  <Card className="border-gray-200 shadow-none"><CardContent className="p-4"><p className="text-xs font-medium text-gray-500">Total Budget</p><p className="mt-2 text-xl font-semibold text-gray-950">{fmtAed(portfolioSummary.totalBudget)}</p></CardContent></Card>
                  <Card className="border-gray-200 shadow-none"><CardContent className="p-4"><p className="text-xs font-medium text-gray-500">Budget Spent</p><p className="mt-2 text-xl font-semibold text-gray-950">{fmtAed(portfolioSummary.totalBudgetSpent)}</p></CardContent></Card>
                </div>
              </section>

            <div className="flex gap-6">
              {/* Sidebar filters */}
              <aside className={filtersOpen ? "w-60 flex-shrink-0" : "w-auto flex-shrink-0"}>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setFiltersOpen((p) => !p)}
                    className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="ml-1 w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </span>
                    {filtersOpen && activeFilterCount > 0 && (
                      <span
                        onClick={(e) => { e.stopPropagation(); clearFilters(); }}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Clear
                      </span>
                    )}
                  </button>

                  {filtersOpen && (
                    <div className="space-y-5 border-t border-gray-100 px-5 py-5">

                      {/* Status */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700">Status</p>
                        <Select value={filterStatus} onValueChange={(v) => updateStatusFilter(v as "all" | InitiativeStatus)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {ALL_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Division */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700">Division</p>
                        <Select value={filterDivision} onValueChange={(v) => updateDivisionFilter(v as Division | "all")}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All divisions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All divisions</SelectItem>
                            {DIVISION_OPTIONS.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Initiative Type */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700">Initiative Type</p>
                        <Select value={filterType} onValueChange={(v) => updateTypeFilter(v as "all" | InitiativeType)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All initiative types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All initiative types</SelectItem>
                            {ALL_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700">Strategic Priority</p>
                        <Select
                          value={filterStrategicPriority}
                          onValueChange={(v) => updatePriorityFilter(v as "all" | StrategicPrioritySlug)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All strategic priorities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All strategic priorities</SelectItem>
                            {strategicPriorityOptions.map((prioritySlug) => (
                              <SelectItem key={prioritySlug} value={prioritySlug}>
                                {STRATEGIC_PRIORITY_BY_SLUG[prioritySlug].title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </aside>

              {/* Main grid */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">
                    {filteredInitiatives.length} of {initiatives.length} initiatives
                    {activeFilterCount > 0 && <span className="ml-1 text-orange-600 font-medium">(filtered)</span>}
                  </p>
                </div>

                {filterStrategicPriority !== "all" && (
                  <div className="mb-4">
                    <button
                      onClick={() => updatePriorityFilter("all")}
                      className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-800 hover:bg-orange-100 transition-colors"
                    >
                      Filtered by: {STRATEGIC_PRIORITY_BY_SLUG[filterStrategicPriority].title}
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {filterDivision !== "all" && (
                  <div className="mb-4">
                    <button
                      onClick={() => updateDivisionFilter("all")}
                      className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800 hover:bg-sky-100 transition-colors"
                    >
                      Division: {filterDivision}
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {filteredInitiatives.length === 0 ? (
                  <div className="text-center py-12">
                    {initiatives.length === 0 ? (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No initiatives found</h3>
                        <p className="text-gray-600">Use Explore & Start to submit a governed initiative request.</p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No initiatives match your filters</h3>
                        <p className="text-gray-600 mb-4">Reset the current filters to restore the full portfolio.</p>
                        <Button variant="outline" onClick={clearFilters}>Reset filters</Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredInitiatives.map((initiative) => {
                      const InitIcon = getInitiativeIcon(initiative.type as InitiativeType);
                      const rag = computeInitiativeRAG(initiative);
                      const ragDotClass = rag === "Red" ? "bg-red-500" : rag === "Amber" ? "bg-amber-500" : "bg-emerald-500";
                      const ragTextClass = rag === "Red" ? "text-red-700" : rag === "Amber" ? "text-amber-700" : "text-emerald-700";
                      return (
                        <div
                          key={initiative.id}
                          className="bg-white border border-gray-200 rounded-xl hover:shadow-xl hover:border-orange-300 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        >
                          {/* Gradient header */}
                          <div
                            className={`h-32 bg-gradient-to-br ${DIVISION_GRADIENT[initiative.division] ?? "from-orange-400 to-amber-500"} flex items-center justify-center relative`}
                          >
                            <InitIcon className="w-12 h-12 text-white/40" />
                            <span
                              className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE_CLASSES[initiative.status]}`}
                            >
                              {initiative.status}
                            </span>
                            {initiative.fromPortfolio && (
                              <span className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                                Derived from portfolio gap
                              </span>
                            )}
                          </div>

                          {/* Card body */}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-gray-500">{initiative.division}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${pickTypeBadgeClasses(initiative.type)}`}>
                                {initiative.type}
                              </span>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2" title={initiative.name}>
                              {initiative.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                              {initiative.description}
                            </p>
                            <div className="mb-3 flex items-center justify-between text-sm">
                              <span className="inline-flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${ragDotClass}`} />
                                <span className={ragTextClass}>{rag}</span>
                              </span>
                              <span className="text-gray-500">{getInitiativeProjectCount(initiative)} projects</span>
                            </div>
                            <div className="mb-3 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
                              <div>
                                <p className="text-[11px] uppercase tracking-wide text-gray-500">EA Alignment</p>
                                <p className="mt-1 text-sm font-medium text-gray-900">
                                  {initiative.eaAlignmentScore === null ? "Not assessed" : `${initiative.eaAlignmentScore}/100`}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] uppercase tracking-wide text-gray-500">Strategic Priority</p>
                                <p className={`mt-1 text-sm font-medium ${initiative.strategicPriority ? "text-gray-900" : "text-gray-400"}`}>
                                  {initiative.strategicPriority
                                    ? STRATEGIC_PRIORITY_BY_SLUG[initiative.strategicPriority].title
                                    : "Not set"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] uppercase tracking-wide text-gray-500">Target Date</p>
                                <p className="mt-1 text-sm font-medium text-gray-900">{fmtDate(initiative.targetDate)}</p>
                              </div>
                              <div>
                                <p className="text-[11px] uppercase tracking-wide text-gray-500">Owner</p>
                                <p className="mt-1 text-sm font-medium text-gray-900">{initiative.owner}</p>
                              </div>
                            </div>
                            {initiative.fromPortfolio && (
                              <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                                <p className="text-xs font-medium text-blue-800">Portfolio provenance</p>
                                <p className="text-xs text-blue-700 mt-1">
                                  Initiated as the governed execution response to a portfolio-level signal or finding.
                                </p>
                                {initiative.portfolioCardId && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate("/marketplaces/portfolio-management", {
                                        state: {
                                          tab: "ot-asset-portfolio",
                                          highlightCardId: initiative.portfolioCardId,
                                        },
                                      });
                                    }}
                                    className="mt-2 text-xs font-medium text-blue-800 hover:text-blue-900 underline underline-offset-2"
                                  >
                                    View portfolio source
                                  </button>
                                )}
                              </div>
                            )}

                            <div className="border-t border-gray-100 pt-3 space-y-3">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  Delivery progress
                                </span>
                                <span className="font-medium text-foreground">{initiative.progress}%</span>
                              </div>
                              <Progress value={initiative.progress} className="h-1.5" />
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-gray-500">{getInitiativeProjectCount(initiative)} projects</span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-orange-700 hover:text-orange-800 hover:bg-orange-50 px-2"
                                    onClick={() => openSeeInsights(initiative)}
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                    Insights
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      navigate(`/marketplaces/initiative-portfolio/initiative/${initiative.id}`, {
                                        state: { portfolioSearch: location.search },
                                      })
                                    }
                                  >
                                    View Detail
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            </div>
          </TabsContent>

          <TabsContent value="explore-start" className="mt-0">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Explore & Start</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Browse lifecycle frameworks, open one for details, then begin a governed initiative request.
                  </p>
                </div>
                <div className="w-full max-w-sm">
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      value={frameworkSearchQuery}
                      onChange={(e) => setFrameworkSearchQuery(e.target.value)}
                      placeholder="Search frameworks..."
                      className="border-0 px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside className={frameworkFiltersOpen ? "w-full" : "w-auto"}>
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <button
                      onClick={() => setFrameworkFiltersOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                      </span>
                      <span className="text-xs text-gray-400">{(frameworkCategory !== "all" ? 1 : 0) + (frameworkComplexity !== "all" ? 1 : 0) + (frameworkDuration !== "all" ? 1 : 0) + (frameworkDivision !== "all" ? 1 : 0)}</span>
                    </button>
                    {frameworkFiltersOpen ? (
                      <div className="space-y-5 border-t border-gray-100 px-5 py-5">
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700">Category</p>
                          <Select value={frameworkCategory} onValueChange={(value) => setFrameworkCategory(value as "all" | "Internal" | "External")}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="All categories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All categories</SelectItem>
                              <SelectItem value="Internal">Internal</SelectItem>
                              <SelectItem value="External">External</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700">Duration</p>
                          <Select value={frameworkDuration} onValueChange={setFrameworkDuration}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="All durations" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="under-3">Under 3 months</SelectItem>
                              <SelectItem value="3-6">3-6 months</SelectItem>
                              <SelectItem value="6-12">6-12 months</SelectItem>
                              <SelectItem value="12-plus">12+ months</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700">Complexity</p>
                          <Select value={frameworkComplexity} onValueChange={(value) => setFrameworkComplexity(value as "all" | "simple" | "moderate" | "complex")}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="All complexities" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All complexities</SelectItem>
                              <SelectItem value="simple">Simple</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="complex">Complex</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700">Division Relevance</p>
                          <Select value={frameworkDivision} onValueChange={setFrameworkDivision}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="All divisions" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All divisions</SelectItem>
                              {DIVISION_OPTIONS.map((division) => (
                                <SelectItem key={division} value={division}>{division}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </aside>

                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="font-medium text-gray-900">
                        Showing {visibleFrameworks.length} of {initiativeFrameworks.length} frameworks
                      </span>
                    </div>
                    <span className="hidden sm:inline text-xs text-gray-500">
                      Open a framework to view details and start a request
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {visibleFrameworks.map((framework) => {
                      const Icon = FRAMEWORK_ICON_MAP[framework.iconName ?? "Activity"] ?? Activity;
                      const complexity = templateComplexity(framework.compatibleTemplates[0]);
                      const stats = frameworkStats[framework.id] ?? { active: 0, completed: 0 };
                      return (
                        <button
                          key={framework.id}
                          type="button"
                          onClick={() => navigate(`/marketplaces/initiative-portfolio/framework/${framework.id}`)}
                          className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-all hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl"
                        >
                          <div className={`relative flex h-28 items-center justify-center bg-gradient-to-br ${framework.category === "Internal" ? "from-teal-500 to-emerald-600" : "from-blue-500 to-indigo-600"}`}>
                            <Badge className="absolute right-3 top-3 border border-white/20 bg-white/15 text-white">{framework.category}</Badge>
                            <Icon className="h-10 w-10 text-white/40" />
                          </div>
                          <div className="space-y-4 p-5">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{framework.type}</h3>
                              <p className="mt-2 text-sm text-gray-600 line-clamp-3">{framework.description}</p>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Complexity</span>
                                <span className="capitalize">{complexity}</span>
                              </div>
                              <div className="flex gap-1">
                                {[1, 2, 3].map((segment) => (
                                  <span
                                    key={segment}
                                    className={`h-2 flex-1 rounded-full ${
                                      segment <= (complexity === "simple" ? 1 : complexity === "moderate" ? 2 : 3)
                                        ? "bg-orange-500"
                                        : "bg-gray-100"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                              <span>{stats.active} active</span>
                              <span>•</span>
                              <span>{stats.completed} completed</span>
                              <span>•</span>
                              <span>Avg. {framework.typicalDuration}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm font-medium text-orange-700">
                              <span>Open framework</span>
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* See Insights role selector — portal to document.body to guarantee visibility regardless of stacking context */}
      {roleModalOpen && createPortal(
        <RoleSelectorModal
          onClose={() => setRoleModalOpen(false)}
          onRoleSelected={handleRoleSelected}
        />,
        document.body
      )}

      {loginModalOpen && createPortal(
        <LCInsightsLoginModal
          onSuccess={handleLoginSuccess}
          onClose={() => {
            setLoginModalOpen(false);
            setLoginPendingAction(null);
          }}
        />,
        document.body
      )}

      {/* Initiative request form */}
      <Dialog open={requestModalOpen} onOpenChange={closeInitiativeRequest}>
        <DialogContent className="flex flex-col sm:max-w-2xl max-h-[90vh] p-0 gap-0">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
            <DialogHeader>
              <DialogTitle>{requestConfirmation ? "Request Submitted" : "Submit Governed Initiative Request"}</DialogTitle>
              <DialogDescription>
                {requestConfirmation
                  ? "Confirmation generated from the submitted approval record."
                  : "Confirm the framework, template, and operating intent before sending this request to the TO approval queue."}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <ExploreStartStepper
                activeStep={3}
                selectedFramework={selectedFramework?.type ?? null}
                selectedTemplate={
                  selectedTemplateId
                    ? lifecycleTemplates.find((template) => template.id === selectedTemplateId)?.title ?? selectedTemplateId
                    : null
                }
                confirmationNote={requestConfirmation ? "Submitted" : "Ready to submit"}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
          {selectedFramework && !requestConfirmation && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Badge className={`text-xs border ${selectedFramework.category === "Internal" ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-blue-50 text-blue-800 border-blue-200"}`} >
                    {selectedFramework.category}
                  </Badge>
                  <Badge variant="outline" className="border-slate-200 text-slate-700">
                    Typical: {selectedFramework.typicalDuration} • {selectedFramework.typicalScope}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{selectedFramework.description}</p>
              </div>

              {selectedTemplateId && (
                <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Selected Template</p>
                  <p className="mt-1 text-sm font-medium text-orange-950">
                    {lifecycleTemplates.find((template) => template.id === selectedTemplateId)?.title ?? selectedTemplateId}
                  </p>
                  <p className="mt-1 text-xs text-orange-800">This template will govern the stage-gate path and evidence requirements for the request.</p>
                </div>
              )}

              {selectedTemplateId && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stage Preview</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(lifecycleTemplates.find((template) => template.id === selectedTemplateId)?.stages ?? []).slice(0, 4).map((stage) => (
                      <Badge key={stage.id} variant="outline" className="bg-gray-50">
                        {stage.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-600">Key phases</p>
                <div className="flex flex-wrap gap-2">
                  {selectedFramework.keyPhases.map((p) => (
                    <Badge key={p} variant="outline" className="border-slate-200 text-slate-700 bg-white">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Initiative Name</label>
                  <Input value={initiativeName} onChange={(e) => setInitiativeName(e.target.value)} placeholder="e.g. Transmission Architecture Remediation Q2 2026" />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-sm font-medium text-foreground">Division</label>
                  <Select value={initiativeDivision} onValueChange={(v) => setInitiativeDivision(v as Division)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIVISION_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-1">
                  <label className="text-sm font-medium text-foreground">Target Start Date</label>
                  <Input type="date" value={targetStartDate} onChange={(e) => setTargetStartDate(e.target.value)} />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Objective</label>
                  <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="What problem/opportunity will this initiative address?" />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Scope</label>
                  <Textarea value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Systems/applications/asset classes/domains in scope." />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Key Stakeholders</label>
                  <Input value={keyStakeholders} onChange={(e) => setKeyStakeholders(e.target.value)} placeholder="Names/roles, comma-separated" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Proposed Initiative Owner</label>
                  <Input value={proposedOwner} onChange={(e) => setProposedOwner(e.target.value)} placeholder="Name" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Estimated Budget (optional)</label>
                  <Input value={estimatedBudget} onChange={(e) => setEstimatedBudget(e.target.value)} placeholder="e.g. AED 10M" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Priority</label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">DEWA Stakeholder Roles</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DEWA_ROLE_OPTIONS.map((roleOption) => {
                      const selected = stakeholderRoles.includes(roleOption);
                      return (
                        <button
                          key={roleOption}
                          type="button"
                          onClick={() =>
                            setStakeholderRoles((prev) =>
                              prev.includes(roleOption)
                                ? prev.filter((item) => item !== roleOption)
                                : [...prev, roleOption]
                            )
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            selected
                              ? "border-orange-200 bg-orange-50 text-orange-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:text-gray-900"
                          }`}
                        >
                          {roleOption}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Additional Context (optional)</label>
                  <Textarea value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} placeholder="Any extra information for the TO team." />
                </div>
              </div>
            </div>
          )}

          {requestConfirmation && (
            <div className="space-y-6">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Confirmation</p>
                <h3 className="mt-1 text-xl font-semibold text-emerald-950">{requestConfirmation.initiativeName}</h3>
                <p className="mt-2 text-sm text-emerald-900">
                  Your request has been sent to the Transformation Office for review. You will be notified when a decision is made.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Reference Number</p>
                  <p className="mt-2 text-lg font-semibold text-gray-950">{requestConfirmation.id}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</p>
                  <Badge className="mt-2 border bg-yellow-100 text-yellow-700 border-yellow-200">
                    {requestConfirmation.status}
                  </Badge>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Expected Response Date</p>
                  <p className="mt-2 text-lg font-semibold text-gray-950">
                    {fmtDate(addHours(requestConfirmation.submittedAt, APPROVAL_RESPONSE_HOURS[requestConfirmation.priority]))}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Submitted</p>
                  <p className="mt-2 text-lg font-semibold text-gray-950">{fmtDate(requestConfirmation.submittedAt)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">What Happens Next</p>
                <p className="mt-2 text-sm text-orange-900">
                  Your request has been sent to the Transformation Office for review. You will be notified when a decision is made.
                </p>
              </div>
            </div>
          )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
            <DialogFooter>
              {requestConfirmation ? (
                <>
                  <Button variant="outline" onClick={backToPortfolioFromConfirmation}>
                    Back to Portfolio
                  </Button>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={viewSubmittedRequestStatus}>
                    View Status
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => closeInitiativeRequest(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submitInitiativeRequest}>
                    Submit for Approval
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Initiative-level service request (demo) */}
      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Service</DialogTitle>
            <DialogDescription>Submit an initiative-level request (demo/localStorage).</DialogDescription>
          </DialogHeader>

          {serviceInitiative && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-600">Initiative</p>
                <p className="text-sm font-medium text-slate-900">{serviceInitiative.name}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Service Type</label>
                  <Select value={serviceType} onValueChange={(v) => setServiceType(v as LCServiceType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INITIATIVE_LEVEL_SERVICES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Priority</label>
                  <Select value={servicePriority} onValueChange={(v) => setServicePriority(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
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
                  <Textarea value={serviceNotes} onChange={(e) => setServiceNotes(e.target.value)} placeholder="What do you need from TO?" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submitServiceRequest}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FrameworkSidePanel
        framework={selectedFramework && !requestModalOpen ? selectedFramework : null}
        templates={compatibleTemplates}
        selectedTemplateId={selectedTemplateId}
        onClose={() => {
          setSelectedFramework(null);
          setSelectedTemplateId(null);
        }}
        onSelectTemplate={setSelectedTemplateId}
        onBeginRequest={() => {
          if (!selectedFramework) return;
          openInitiativeRequest(selectedFramework);
        }}
      />

      {/* See Insights drawer — portal to document.body to guarantee visibility regardless of stacking context */}
      {drawerOpen && drawerInitiative && drawerRole && createPortal(
        <SeeInsightsDrawer
          initiative={drawerInitiative}
          role={drawerRole}
          onClose={closeSeeInsights}
          onChangeRole={handleChangeRole}
        />,
        document.body
      )}

      {/* Initiative Detail Panel — portal to guarantee overlay above all content */}
      {detailInitiative && createPortal(
        <LCInitiativeDetailPanel
          initiative={detailInitiative}
          onClose={() => setDetailInitiative(null)}
          onSeeInsights={() => {
            const ini = detailInitiative;
            setDetailInitiative(null);
            openSeeInsights(ini);
          }}
          onRequestService={() => {
            const ini = detailInitiative;
            setDetailInitiative(null);
            openRequestService(ini);
          }}
        />,
        document.body
      )}

      <Footer />
    </div>
  );
}
