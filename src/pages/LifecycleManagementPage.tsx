import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Activity, ArrowRight, Brain, ChevronRight, Cpu, Database, Eye, FileText, Globe, Layers, Leaf, Network, RefreshCw, Search, Server, Shield, SlidersHorizontal, TrendingUp, Users, X, Zap } from "lucide-react";
import LCInitiativeDetailPanel from "./lifecycle/LCInitiativeDetailPanel";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SeeInsightsDrawer } from "@/components/lifecycle/SeeInsightsDrawer";
import { RoleSelectorModal } from "@/components/lifecycle/RoleSelectorModal";
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
  getInitiatives,
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

import {
  initiativeFrameworks,
  type InitiativeFramework,
} from "@/data/lifecycle/frameworkCards";
import { lifecycleTemplates } from "@/data/lifecycle/lifecycleData";
import {
  INITIATIVE_LEVEL_SERVICES,
  LC_SERVICE_SLA,
  addApprovalRequest,
  addLCRequest,
  type LCServiceType,
} from "@/data/lifecycle/serviceRequestState";
import { DEWA_ROLE_OPTIONS } from "@/data/shared/dewaRoles";

type Stage1Tab = "initiatives" | "explore-start";

const STATUS_BADGE_CLASSES: Record<InitiativeStatus, string> = {
  Active: "bg-teal-100 text-teal-700 border-teal-200",
  Scoping: "bg-blue-100 text-blue-700 border-blue-200",
  "At Risk": "bg-amber-100 text-amber-800 border-amber-200",
  "On Hold": "bg-slate-200 text-slate-600 border-slate-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
};

const fmtBudget = (b: number | null | undefined) =>
  b == null ? "TBC" : `AED ${(b / 1_000_000).toFixed(0)}M`;

const ALL_STATUSES: InitiativeStatus[] = ["Active", "Scoping", "At Risk", "On Hold", "Completed"];

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

  const [initiatives, setInitiatives] = useState<Initiative[]>(() => getInitiatives());
  const refreshInitiatives = () => setInitiatives(getInitiatives());
  const [searchQuery, setSearchQuery] = useState("");

  // ── Sidebar filters ─────────────────────────────────────────────────────────
  const [filterStatuses, setFilterStatuses] = useState<Set<InitiativeStatus>>(new Set());
  const [filterDivision, setFilterDivision] = useState<Division | "all">("all");
  const [filterTypes, setFilterTypes] = useState<Set<InitiativeType>>(new Set());
  const [filterOwner, setFilterOwner] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const toggleStatus = (s: InitiativeStatus) =>
    setFilterStatuses((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  const toggleType = (t: InitiativeType) =>
    setFilterTypes((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const clearFilters = () => {
    setFilterStatuses(new Set());
    setFilterDivision("all");
    setFilterTypes(new Set());
    setFilterOwner("");
  };

  const activeFilterCount =
    filterStatuses.size + filterTypes.size + (filterDivision !== "all" ? 1 : 0) + (filterOwner.trim() ? 1 : 0);

  const filteredInitiatives = useMemo(() => {
    const ownerQ = filterOwner.trim().toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    return initiatives.filter((ini) => {
      if (filterStatuses.size > 0 && !filterStatuses.has(ini.status)) return false;
      if (filterDivision !== "all" && ini.division !== filterDivision) return false;
      if (filterTypes.size > 0 && !filterTypes.has(ini.type as InitiativeType)) return false;
      if (ownerQ && !ini.owner?.toLowerCase().includes(ownerQ)) return false;
      if (query) {
        const haystack = [ini.name, ini.description, ini.type, ini.division, ini.owner].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [initiatives, filterStatuses, filterDivision, filterTypes, filterOwner, searchQuery]);

  // ── See Insights (role-gated) ───────────────────────────────────────────────
  const [drawerInitiative, setDrawerInitiative] = useState<Initiative | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRole, setDrawerRole] = useState<LifecycleInsightsRole | null>(() => getLifecycleRole());
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const openSeeInsights = (initiative: Initiative) => {
    setDrawerInitiative(initiative);

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
  const [frameworkCategories, setFrameworkCategories] = useState<Set<"Internal" | "External">>(new Set());
  const [frameworkComplexities, setFrameworkComplexities] = useState<Set<"simple" | "moderate" | "complex">>(new Set());
  const [frameworkDuration, setFrameworkDuration] = useState("all");
  const [frameworkDivision, setFrameworkDivision] = useState("all");
  const [frameworkFiltersOpen, setFrameworkFiltersOpen] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [stakeholderRoles, setStakeholderRoles] = useState<string[]>([]);

  const visibleFrameworks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return initiativeFrameworks.filter((framework) => {
      if (frameworkCategories.size > 0 && !frameworkCategories.has(framework.category)) return false;
      if (frameworkComplexities.size > 0 && !frameworkComplexities.has(templateComplexity(framework.compatibleTemplates[0]))) return false;
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
  }, [frameworkCategories, frameworkComplexities, frameworkDivision, frameworkDuration, searchQuery]);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<InitiativeFramework | null>(null);

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

    addApprovalRequest({
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

    setRequestModalOpen(false);
    setSelectedFramework(null);
    toast({
      title: "Submitted for TO approval",
      description: "Your initiative request was added to the approval queue.",
    });
    navigate("/stage2/lifecycle-management", {
      state: { cardId: "initiative-requests" },
    });
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
            <span className="font-medium text-foreground">Lifecycle Management</span>
          </nav>

          <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold uppercase mb-4">
            Drive
          </span>

          <h1 className="text-3xl lg:text-4xl font-bold text-primary-navy mb-3">Lifecycle Management</h1>
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
                Active Initiatives
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
            <div className="flex gap-6">
              {/* Sidebar filters */}
              <aside className={filtersOpen ? "w-60 flex-shrink-0" : "w-auto flex-shrink-0"}>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setFiltersOpen((p) => !p)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      {filtersOpen ? "Filters" : ""}
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
                    <div className="px-4 pb-4 space-y-5 border-t border-gray-100">

                      {/* Status */}
                      <div className="pt-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
                        {ALL_STATUSES.map((s) => (
                          <label key={s} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={filterStatuses.has(s)}
                              onChange={() => toggleStatus(s)}
                              className="rounded border-gray-300 text-orange-500"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900">{s}</span>
                            <span className={`ml-auto inline-flex h-4 px-1.5 rounded text-xs font-medium items-center ${STATUS_BADGE_CLASSES[s]}`}>
                              {initiatives.filter((i) => i.status === s).length}
                            </span>
                          </label>
                        ))}
                      </div>

                      {/* Division */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Division</p>
                        <Select value={filterDivision} onValueChange={(v) => setFilterDivision(v as any)}>
                          <SelectTrigger className="h-8 text-xs">
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
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Initiative Type</p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {ALL_TYPES.map((t) => (
                            <label key={t} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={filterTypes.has(t)}
                                onChange={() => toggleType(t)}
                                className="rounded border-gray-300 text-orange-500"
                              />
                              <span className="text-xs text-gray-700 group-hover:text-gray-900 leading-tight">{t}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Owner search */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</p>
                        <Input
                          value={filterOwner}
                          onChange={(e) => setFilterOwner(e.target.value)}
                          placeholder="Search by owner name"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </aside>

              {/* Main grid */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">
                    {filteredInitiatives.length} of {initiatives.length} active initiatives
                    {activeFilterCount > 0 && <span className="ml-1 text-orange-600 font-medium">(filtered)</span>}
                  </p>
                </div>

                {filteredInitiatives.length === 0 ? (
                  <div className="text-center py-12">
                    {initiatives.length === 0 ? (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No initiatives found</h3>
                        <p className="text-gray-600">Create an initiative from the "Start an Initiative" tab.</p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No results</h3>
                        <p className="text-gray-600 mb-4">No initiatives match your current filters.</p>
                        <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredInitiatives.map((initiative) => {
                      const InitIcon = getInitiativeIcon(initiative.type as InitiativeType);
                      return (
                        <div
                          key={initiative.id}
                          onClick={() => navigate(`/marketplaces/lifecycle-management/initiative/${initiative.id}`)}
                          className="bg-white border border-gray-200 rounded-xl hover:shadow-xl hover:border-orange-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
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
                                Raised from Portfolio
                              </span>
                            )}
                          </div>

                          {/* Card body */}
                          <div className="p-4">
                            <p className="text-xs text-gray-500 mb-2">{initiative.division}</p>
                            <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                              {initiative.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                              {initiative.description}
                            </p>
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

                            {/* Metadata strip */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <Badge variant="outline" className={`text-xs ${pickTypeBadgeClasses(initiative.type)} border`}>
                                {initiative.type}
                              </Badge>
                              {initiative.eaAlignmentScore !== null && (
                                <Badge className="text-xs bg-slate-50 text-slate-700 border border-slate-200">
                                  EA: {initiative.eaAlignmentScore}%
                                </Badge>
                              )}
                              {initiative.status === "Completed" && (
                                <Badge className="text-xs bg-green-50 text-green-700 border border-green-200">
                                  Closure Recorded
                                </Badge>
                              )}
                            </div>

                            {/* Bottom strip — progress bar or meta */}
                            {(initiative.status === "Active" || initiative.status === "At Risk") ? (
                              <div className="border-t border-gray-100 pt-3 space-y-1.5">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    {getInitiativeProjectCount(initiative)} projects
                                  </span>
                                  <span className="font-medium text-foreground">{initiative.progress}%</span>
                                </div>
                                <Progress value={initiative.progress} className="h-1.5" />
                              </div>
                            ) : (
                              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                                <span>{getInitiativeProjectCount(initiative)} projects</span>
                                <span>Target: {initiative.targetDate}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="explore-start" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-end justify-between gap-4 flex-wrap">
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search frameworks..."
                      className="border-0 px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Showing {visibleFrameworks.length} of {initiativeFrameworks.length} frameworks
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside className={frameworkFiltersOpen ? "w-full" : "w-auto"}>
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <button
                      onClick={() => setFrameworkFiltersOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        {frameworkFiltersOpen ? "Framework Filters" : "Filters"}
                      </span>
                      <span className="text-xs text-gray-400">{frameworkCategories.size + frameworkComplexities.size + (frameworkDuration !== "all" ? 1 : 0) + (frameworkDivision !== "all" ? 1 : 0)}</span>
                    </button>
                    {frameworkFiltersOpen ? (
                      <div className="space-y-5 border-t border-gray-100 px-4 py-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</p>
                          {(["Internal", "External"] as const).map((category) => (
                            <label key={category} className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={frameworkCategories.has(category)}
                                onChange={() =>
                                  setFrameworkCategories((prev) => {
                                    const next = new Set(prev);
                                    next.has(category) ? next.delete(category) : next.add(category);
                                    return next;
                                  })
                                }
                              />
                              {category}
                            </label>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Duration</p>
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
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Complexity</p>
                          {(["simple", "moderate", "complex"] as const).map((complexity) => (
                            <label key={complexity} className="flex items-center gap-2 text-sm capitalize text-gray-700">
                              <input
                                type="checkbox"
                                checked={frameworkComplexities.has(complexity)}
                                onChange={() =>
                                  setFrameworkComplexities((prev) => {
                                    const next = new Set(prev);
                                    next.has(complexity) ? next.delete(complexity) : next.add(complexity);
                                    return next;
                                  })
                                }
                              />
                              {complexity}
                            </label>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Division Relevance</p>
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
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {visibleFrameworks.map((framework) => {
                      const Icon = FRAMEWORK_ICON_MAP[framework.iconName ?? "Activity"] ?? Activity;
                      const complexity = templateComplexity(framework.compatibleTemplates[0]);
                      const stats = frameworkStats[framework.id] ?? { active: 0, completed: 0 };
                      return (
                        <button
                          key={framework.id}
                          type="button"
                          onClick={() => navigate(`/marketplaces/lifecycle-management/framework/${framework.id}`)}
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

      {/* Initiative request form */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="flex flex-col sm:max-w-2xl max-h-[90vh] p-0 gap-0">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
            <DialogHeader>
              <DialogTitle>Submit Governed Initiative Request</DialogTitle>
              <DialogDescription>Confirm the framework, template, and operating intent before sending this request to the TO approval queue.</DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
          {selectedFramework && (
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
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
            <DialogFooter>
              <Button variant="outline" onClick={() => setRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submitInitiativeRequest}>
                Submit for Approval
              </Button>
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
