import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Archive,
  Briefcase,
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  FolderKanban,
  Package,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import AIInitiativeRecommender from "@/components/lifecycle/AIInitiativeRecommender";
import { LCInsightsLoginModal } from "@/components/lifecycle/LCInsightsLoginModal";
import { SeeInsightsDrawer } from "@/components/lifecycle/SeeInsightsDrawer";
import { RoleSelectorModal } from "@/components/lifecycle/RoleSelectorModal";
import { isUserAuthenticated } from "@/data/sessionAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getActivityEvents } from "@/data/shared/activityEventStore";
import { getLCRequestsByInitiative } from "@/data/lifecycle/serviceRequestState";
import {
  getInitiatives,
  getProjects,
  type Division,
  type Initiative,
  type InitiativeType,
  type Project,
} from "@/data/shared/lifecyclePortfolioStore";
import {
  getLifecycleRole,
  type LifecycleInsightsRole,
} from "@/data/shared/lifecycleRole";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AppEntry {
  name: string;
  type: "Core" | "Supporting" | "Integration";
  status: "Active" | "Modernising" | "Retiring";
  owner: string;
  note: string;
}

interface ComplianceCheck {
  framework: string;
  status: "Passed" | "In Review" | "Action Required" | "Not Assessed";
  dueDate: string;
  note: string;
}

interface ProductEntry {
  name: string;
  type: "Platform" | "Service" | "API" | "Dataset" | "Capability";
  status: "Planned" | "In Development" | "Live" | "Decommissioned";
  owner: string;
  expectedDate: string;
}

interface RetirementEntry {
  assetName: string;
  assetType: "Application" | "Infrastructure" | "Service" | "PLC / OT Asset";
  reason: string;
  targetDate: string;
  status: "Scoping" | "Approved" | "In Progress" | "Completed";
  owner: string;
}

// ── Data helpers (seeded per initiative type) ─────────────────────────────────

function getApplications(ini: Initiative): AppEntry[] {
  const base: AppEntry[] = [
    { name: "SCADA / OT Control System", type: "Core", status: "Active", owner: ini.division, note: "Directly impacted by this initiative's scope." },
    { name: "Enterprise GIS (Smallworld)", type: "Supporting", status: "Active", owner: "Corporate & Strategy", note: "Asset mapping integration required." },
    { name: "SAP ERP (FI / PM modules)", type: "Integration", status: "Active", owner: "Business Support & HR", note: "Budget and procurement integration." },
  ];
  if (ini.type === "Application Modernisation" || ini.type === "DXP Programme") {
    base.push({ name: "Legacy BIS-3 Billing System", type: "Core", status: "Retiring", owner: "Customer Services", note: "Identified for decommission as part of this initiative." });
    base.push({ name: "MyDEWA Customer Portal", type: "Supporting", status: "Modernising", owner: "Customer Services", note: "UX refresh scoped in delivery plan." });
  }
  if (ini.type === "AI Deployment") {
    base.push({ name: "Rammas AI Platform", type: "Core", status: "Modernising", owner: "Innovation & AI", note: "Extended capabilities being deployed." });
    base.push({ name: "Data Lake (Azure ADLS Gen2)", type: "Integration", status: "Active", owner: "Corporate & Strategy", note: "Training data pipeline integration." });
  }
  if (ini.type === "IT/OT Convergence" || ini.type === "Net-Zero Technology") {
    base.push({ name: "IoT Sensor Network", type: "Core", status: "Active", owner: ini.division, note: "New sensor nodes being commissioned." });
  }
  return base;
}

function getComplianceChecks(ini: Initiative): ComplianceCheck[] {
  return [
    { framework: "NESA / UAE IAS", status: ini.eaAlignmentScore && ini.eaAlignmentScore >= 80 ? "Passed" : "In Review", dueDate: ini.targetDate, note: "National cybersecurity framework alignment review." },
    { framework: "ADSIC Information Security Policy", status: ini.status === "Active" ? "In Review" : "Not Assessed", dueDate: ini.targetDate, note: "Abu Dhabi government entity compliance obligation." },
    { framework: "ISO 27001", status: ini.eaAlignmentScore && ini.eaAlignmentScore >= 75 ? "Passed" : "Action Required", dueDate: "2026-06-30", note: "Information security management system certification check." },
    { framework: "DEWA EA 4.0 Benchmark", status: ini.eaAlignmentScore === null ? "Not Assessed" : ini.eaAlignmentScore >= 70 ? "Passed" : "Action Required", dueDate: ini.targetDate, note: `Current EA alignment score: ${ini.eaAlignmentScore === null ? "TBD" : `${ini.eaAlignmentScore}%`}` },
    { framework: "UAE Personal Data Protection Law", status: ini.type === "DXP Programme" || ini.type === "Application Modernisation" ? "In Review" : "Not Assessed", dueDate: "2026-09-30", note: "Data handling and PII obligations review." },
  ];
}

function getProducts(ini: Initiative): ProductEntry[] {
  const products: ProductEntry[] = [
    { name: `${ini.name} — Core Capability`, type: "Capability", status: ini.status === "Completed" ? "Live" : ini.status === "Active" ? "In Development" : "Planned", owner: ini.owner, expectedDate: ini.targetDate },
  ];
  if (ini.type === "AI Deployment") {
    products.push({ name: "AI Inference API", type: "API", status: "In Development", owner: "Innovation & AI", expectedDate: ini.targetDate });
    products.push({ name: "AI Governance Dataset", type: "Dataset", status: "Planned", owner: "Innovation & AI", expectedDate: "2026-12-31" });
  }
  if (ini.type === "Platform Deployment" || ini.type === "DXP Programme") {
    products.push({ name: "Self-Service Portal", type: "Service", status: "In Development", owner: ini.division, expectedDate: ini.targetDate });
    products.push({ name: "Integration Middleware Platform", type: "Platform", status: "Planned", owner: "Corporate & Strategy", expectedDate: "2027-03-31" });
  }
  if (ini.type === "Data Platform") {
    products.push({ name: "Data Mesh Domain API", type: "API", status: "In Development", owner: ini.owner, expectedDate: ini.targetDate });
    products.push({ name: "Enterprise Data Catalogue", type: "Platform", status: "Planned", owner: "Corporate & Strategy", expectedDate: "2027-06-30" });
  }
  return products;
}

function getRetirements(ini: Initiative): RetirementEntry[] {
  const retirements: RetirementEntry[] = [];
  if (ini.type === "Application Modernisation" || ini.type === "Technology Rationalisation") {
    retirements.push({ assetName: "Legacy BIS-3 Billing System", assetType: "Application", reason: "Vendor support ending Q3 2026. Being replaced by SAP S/4HANA billing module.", targetDate: "2026-09-30", status: "Scoping", owner: "Customer Services" });
  }
  if (ini.type === "IT/OT Convergence" || ini.type === "Net-Zero Technology") {
    retirements.push({ assetName: "Legacy PLC Controllers (14 units)", assetType: "PLC / OT Asset", reason: "End-of-life firmware — critical vulnerability. Replacement mandated by NESA.", targetDate: "2026-06-30", status: "In Progress", owner: ini.owner });
    retirements.push({ assetName: "Analogue SCADA RTU Nodes", assetType: "Infrastructure", reason: "Non-IP-capable nodes cannot participate in smart grid monitoring.", targetDate: "2027-03-31", status: "Scoping", owner: ini.division });
  }
  if (ini.type === "Architecture Remediation") {
    retirements.push({ assetName: "Shadow IT — Departmental SharePoint Instances (x6)", assetType: "Application", reason: "Consolidated into enterprise SharePoint under EA governance.", targetDate: "2026-12-31", status: "Approved", owner: ini.owner });
  }
  if (retirements.length === 0) {
    retirements.push({ assetName: "No decommission items identified yet", assetType: "Application", reason: "Retirement scope to be determined during planning phase.", targetDate: "TBD", status: "Scoping", owner: ini.owner });
  }
  return retirements;
}

// ── Colour helpers ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  Active: "bg-teal-100 text-teal-700 border-teal-200",
  Scoping: "bg-blue-100 text-blue-700 border-blue-200",
  "At Risk": "bg-amber-100 text-amber-800 border-amber-200",
  "On Hold": "bg-slate-200 text-slate-600 border-slate-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
};

const COMPLIANCE_BADGE: Record<string, string> = {
  Passed: "bg-green-100 text-green-700 border-green-200",
  "In Review": "bg-amber-100 text-amber-700 border-amber-200",
  "Action Required": "bg-red-100 text-red-700 border-red-200",
  "Not Assessed": "bg-gray-100 text-gray-500 border-gray-200",
};

const PRODUCT_STATUS_BADGE: Record<string, string> = {
  Live: "bg-green-100 text-green-700 border-green-200",
  "In Development": "bg-blue-100 text-blue-700 border-blue-200",
  Planned: "bg-gray-100 text-gray-500 border-gray-200",
  Decommissioned: "bg-red-100 text-red-700 border-red-200",
};

const RETIREMENT_STATUS_BADGE: Record<string, string> = {
  Scoping: "bg-gray-100 text-gray-600 border-gray-200",
  Approved: "bg-blue-100 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
};

const APP_STATUS_BADGE: Record<string, string> = {
  Active: "bg-teal-100 text-teal-700 border-teal-200",
  Modernising: "bg-blue-100 text-blue-700 border-blue-200",
  Retiring: "bg-red-100 text-red-700 border-red-200",
};

const RAG_COLOR: Record<string, string> = {
  Green: "bg-green-500",
  Amber: "bg-amber-400",
  Red: "bg-red-500",
};

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

const fmtBudget = (b: number | null | undefined) =>
  b == null ? "TBC" : `AED ${(b / 1_000_000).toFixed(0)}M`;

const INITIATIVE_CAPABILITY_LINKS: Partial<Record<InitiativeType, { label: string; tab: string }>> = {
  "IT/OT Convergence": { label: "Operational Technology", tab: "ot-asset-portfolio" },
  "Net-Zero Technology": { label: "Operational Technology", tab: "ot-asset-portfolio" },
  "Architecture Remediation": { label: "IT Asset Estate", tab: "it-asset-portfolio" },
  "Application Modernisation": { label: "IT Asset Estate", tab: "it-asset-portfolio" },
  "Technology Rationalisation": { label: "Technology Rationalisation", tab: "technology-rationalisation" },
  "AI Deployment": { label: "Data & Digital Capability", tab: "data-digital-portfolio" },
  "Data Platform": { label: "Data & Digital Capability", tab: "data-digital-portfolio" },
  "DXP Programme": { label: "Data & Digital Capability", tab: "data-digital-portfolio" },
  "Platform Deployment": { label: "Project Portfolio", tab: "project-portfolio" },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function LCInitiativeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const portfolioSearch = (location.state as { portfolioSearch?: string } | null)?.portfolioSearch ?? "";
  const portfolioLink = { pathname: "/marketplaces/initiative-portfolio", search: portfolioSearch };

  const initiative = useMemo(
    () => getInitiatives().find((i) => i.id === id) ?? null,
    [id]
  );

  // ── See Insights ────────────────────────────────────────────────────────────
  const [drawerRole, setDrawerRole] = useState<LifecycleInsightsRole | null>(() => getLifecycleRole());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const openSeeInsights = () => {
    if (!isUserAuthenticated()) {
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

    setRoleModalOpen(true);
  };

  const handleLoginSuccess = (role: LifecycleInsightsRole) => {
    setDrawerRole(role);
    setLoginModalOpen(false);
    setDrawerOpen(true);
  };

  const closeSeeInsights = () => {
    setDrawerOpen(false);
  };

  const handleChangeRole = () => {
    setDrawerOpen(false);
    setRoleModalOpen(true);
  };

  const handleRoleSelected = (role: LifecycleInsightsRole) => {
    setDrawerRole(role);
    setRoleModalOpen(false);
    setDrawerOpen(true);
  };

  // ── Derived data ────────────────────────────────────────────────────────────
  const allProjects = useMemo(() => getProjects(), []);
  const initiativeProjects = useMemo(
    () => (initiative ? allProjects.filter((p) => initiative.projects.includes(p.id)) : []),
    [allProjects, initiative]
  );
  const applications = useMemo(() => (initiative ? getApplications(initiative) : []), [initiative]);
  const complianceChecks = useMemo(() => (initiative ? getComplianceChecks(initiative) : []), [initiative]);
  const products = useMemo(() => (initiative ? getProducts(initiative) : []), [initiative]);
  const retirements = useMemo(() => (initiative ? getRetirements(initiative) : []), [initiative]);
  const activityEvents = useMemo(() => (initiative ? getActivityEvents(initiative.id) : []), [initiative]);
  const requests = useMemo(() => (initiative ? getLCRequestsByInitiative(initiative.id) : []), [initiative]);

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!initiative) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Initiative not found</h1>
          <Button onClick={() => navigate(portfolioLink)} className="bg-orange-600 hover:bg-orange-700 text-white">
            Back to Initiative Portfolio
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isActive = initiative.status === "Active" || initiative.status === "At Risk";
  const openRisks = initiativeProjects.flatMap((project) => project.risks).filter((risk) => risk.status === "Open").length;
  const openBlockers = initiativeProjects.flatMap((project) => project.blockers).filter((blocker) => !blocker.resolved).length;
  const totalMilestones = initiativeProjects.flatMap((project) => project.milestones).length;
  const completedMilestones = initiativeProjects.flatMap((project) => project.milestones).filter((milestone) => milestone.status === "Complete").length;
  const resolvedBlockers = initiativeProjects.flatMap((project) => project.blockers).filter((blocker) => blocker.resolved).length;
  const openRequests = requests.filter((request) => !["Delivered", "Completed"].includes(request.status)).length;
  const completedRequests = requests.filter((request) => ["Delivered", "Completed"].includes(request.status)).length;
  const isCompleted = initiative.status === "Completed";
  const capabilityLink = INITIATIVE_CAPABILITY_LINKS[initiative.type];
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center text-sm text-muted-foreground flex-wrap gap-1">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/marketplaces" className="hover:text-foreground transition-colors">Marketplaces</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={portfolioLink} className="hover:text-foreground transition-colors">Initiative & Programme Portfolio</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-foreground line-clamp-1">{initiative.name}</span>
          </nav>
        </div>
      </div>

      {/* Page header */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${STATUS_BADGE[initiative.status]} border text-xs`}>
                {initiative.status}
              </Badge>
              <span className="text-gray-500 text-sm">{initiative.division}</span>
              {initiative.fromPortfolio && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                  Derived from portfolio gap
                </Badge>
              )}
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
              {initiative.name}
            </h1>
            <p className="text-muted-foreground text-base max-w-3xl leading-relaxed">
              {initiative.description}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-xs">
                {initiative.type}
              </Badge>
              {initiative.eaAlignmentScore !== null && (
                <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-xs">
                  EA: {initiative.eaAlignmentScore}%
                </Badge>
              )}
              <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-xs">
                {initiativeProjects.length} Projects
              </Badge>
              {isCompleted && (
                <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs">
                  Closure Evidence Available
                </Badge>
              )}
            </div>
            {capabilityLink && (
              <button
                onClick={() => navigate("/marketplaces/asset-capability", { state: { tab: capabilityLink.tab } })}
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                View linked capability domain: {capabilityLink.label}
              </button>
            )}
            {initiative.fromPortfolio && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Portfolio Provenance</p>
                <p className="text-sm text-blue-900 mt-1">
                  This initiative was raised from Portfolio Management and now acts as the governed execution response.
                </p>
                {initiative.portfolioCardId && (
                  <button
                    onClick={() =>
                      navigate("/marketplaces/asset-capability", {
                        state: { tab: "ot-asset-portfolio", highlightCardId: initiative.portfolioCardId },
                      })
                    }
                    className="mt-2 text-sm font-medium text-blue-800 hover:text-blue-900 underline underline-offset-2"
                  >
                    View portfolio source
                  </button>
                )}
              </div>
            )}

            {isCompleted && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Outcome Summary</p>
                    <h2 className="text-lg font-semibold text-emerald-950 mt-1">This initiative has reached governed closure.</h2>
                    <p className="text-sm text-emerald-900 mt-1">
                      Closure indicates that delivery completed, major issues were resolved, and the initiative can be evidenced as an executed outcome rather than an active intervention case.
                    </p>
                  </div>
                  <Badge className="bg-white text-emerald-700 border border-emerald-200 text-xs">
                    Verified Outcome
                  </Badge>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatTile label="Milestones Closed" value={completedMilestones} />
                  <StatTile label="Blockers Resolved" value={resolvedBlockers} />
                  <StatTile label="Support Requests Closed" value={completedRequests} />
                  <StatTile label="Governance Events" value={activityEvents.length} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: "Delivery complete", done: initiative.progress >= 100 || completedMilestones === totalMilestones },
                    { label: "Key milestones closed", done: totalMilestones > 0 && completedMilestones === totalMilestones },
                    { label: "Major blockers resolved", done: openBlockers === 0 },
                    { label: "Support workflow closed", done: openRequests === 0 },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-lg border px-3 py-2 ${item.done ? "bg-white border-emerald-200 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
                      <p className="text-xs font-semibold">{item.done ? "Confirmed" : "Review Required"}</p>
                      <p className="text-sm mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── Left: tab content ──────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-8">

              {/* Overview */}
              <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Initiative Overview</h2>
                <p className="text-base text-muted-foreground leading-relaxed">{initiative.description}</p>
              </div>

              <AIInitiativeRecommender initiative={initiative} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Metric label="Owner" value={initiative.owner} />
                    <Metric label="Division" value={initiative.division} />
                    <Metric label="Budget" value={fmtBudget(initiative.budget)} />
                    <Metric label="Target Date" value={initiative.targetDate} />
                    <Metric label="EA Alignment" value={initiative.eaAlignmentScore === null ? "Not Assessed" : `${initiative.eaAlignmentScore}%`} />
                    <Metric label="Projects" value={String(initiativeProjects.length)} />
                  </div>

                  {isActive && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Overall Progress</span>
                        <span className="font-semibold text-gray-900">{initiative.progress}%</span>
                      </div>
                      <Progress value={initiative.progress} className="h-2" />
                    </div>
                  )}

              </section>

              <Separator />

              {/* Projects */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground mb-5">Linked Projects</h2>
                <div className="space-y-4">
                  {initiativeProjects.length === 0 ? (
                    <EmptyState icon={FolderKanban} message="No projects linked to this initiative yet." />
                  ) : (
                    initiativeProjects.map((p) => <ProjectCard key={p.id} project={p} />)
                  )}
                </div>
              </section>

              <Separator />

              {/* Applications */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground mb-5">Applications in Scope</h2>
                <div className="space-y-3">
                  {applications.map((app, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-900">{app.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{app.type}</span>
                          <Badge className={`${APP_STATUS_BADGE[app.status]} border text-xs`}>{app.status}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{app.note}</p>
                      <p className="text-xs text-gray-400">Owner: {app.owner}</p>
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              {/* Compliance */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground mb-5">Compliance & Governance</h2>
                <div className="space-y-3">
                  {complianceChecks.map((check, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-900">{check.framework}</span>
                        </div>
                        <Badge className={`${COMPLIANCE_BADGE[check.status]} border text-xs`}>
                          {check.status === "Passed" && <CheckCircle className="w-3 h-3 mr-1 inline" />}
                          {check.status === "Action Required" && <AlertTriangle className="w-3 h-3 mr-1 inline" />}
                          {check.status === "In Review" && <Clock className="w-3 h-3 mr-1 inline" />}
                          {check.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">{check.note}</p>
                      <p className="text-xs text-gray-400">Due: {check.dueDate}</p>
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              {/* Products */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground mb-5">Products & Capabilities</h2>
                <div className="space-y-3">
                  {products.map((prod, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-900">{prod.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{prod.type}</span>
                          <Badge className={`${PRODUCT_STATUS_BADGE[prod.status]} border text-xs`}>{prod.status}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Owner: {prod.owner} · Expected: {prod.expectedDate}</p>
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              {/* Retirement */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground mb-5">Asset Retirement Plan</h2>
                <div className="space-y-3">
                  {retirements.map((ret, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Archive className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-900">{ret.assetName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ret.assetType}</span>
                          <Badge className={`${RETIREMENT_STATUS_BADGE[ret.status]} border text-xs`}>{ret.status}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{ret.reason}</p>
                      <p className="text-xs text-gray-400">Owner: {ret.owner} · Target: {ret.targetDate}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ── Right sidebar ──────────────────────────────────────────── */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-foreground">Initiative Details</h3>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(portfolioLink)}
                >
                  Back to Portfolio
                </Button>

                {/* Key facts table */}
                <table className="w-full">
                  <tbody>
                    {[
                      { label: "Status", value: <Badge className={`${STATUS_BADGE[initiative.status]} border text-xs`}>{initiative.status}</Badge> },
                      { label: "Division", value: initiative.division },
                      { label: "Owner", value: initiative.owner },
                      { label: "Type", value: initiative.type },
                      { label: "Budget", value: fmtBudget(initiative.budget) },
                      { label: "Target Date", value: initiative.targetDate },
                      { label: "EA Alignment", value: initiative.eaAlignmentScore === null ? "Not Assessed" : `${initiative.eaAlignmentScore}%` },
                    ].map(({ label, value }) => (
                      <tr key={label} className="border-b border-gray-100 last:border-0">
                        <td className="text-xs text-muted-foreground py-2.5 pr-3 w-28">{label}</td>
                        <td className="text-xs font-medium text-foreground py-2.5">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Progress bar */}
                {isActive && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Progress</span>
                      <span className="font-semibold text-foreground">{initiative.progress}%</span>
                    </div>
                    <Progress value={initiative.progress} className="h-2" />
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  {isUserAuthenticated() && (
                    <Button
                      className="w-full bg-orange-600 text-white hover:bg-orange-700"
                      onClick={() => navigate(`/stage2/lifecycle-management/${initiative.id}`)}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      View in Workspace
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                    onClick={openSeeInsights}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    See Insights
                  </Button>
                  {capabilityLink && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/marketplaces/asset-capability", { state: { tab: capabilityLink.tab } })}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Capability Canvas
                    </Button>
                  )}
                  {initiative.fromPortfolio && initiative.portfolioCardId && (
                    <Button
                      variant="outline"
                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() =>
                        navigate("/marketplaces/asset-capability", {
                          state: { tab: "ot-asset-portfolio", highlightCardId: initiative.portfolioCardId },
                        })
                      }
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in Portfolio
                    </Button>
                  )}
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Last updated: {new Date(initiative.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </aside>
          </div>
        </div>
      <Footer />

      {/* Insights login modal */}
      {loginModalOpen && (
        <LCInsightsLoginModal
          onSuccess={handleLoginSuccess}
          onClose={() => setLoginModalOpen(false)}
        />
      )}

      {roleModalOpen && createPortal(
        <RoleSelectorModal
          onClose={() => setRoleModalOpen(false)}
          onRoleSelected={handleRoleSelected}
        />,
        document.body
      )}

      {drawerOpen && drawerRole && createPortal(
        <SeeInsightsDrawer
          initiative={initiative}
          role={drawerRole}
          onClose={closeSeeInsights}
          onChangeRole={handleChangeRole}
        />,
        document.body
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.FC<{ className?: string }>; message: string }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const completedMs = project.milestones.filter((m) => m.status === "Completed").length;
  const spentPct = project.budget > 0 ? Math.round((project.budgetSpent / project.budget) * 100) : 0;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${RAG_COLOR[project.rag] ?? "bg-gray-400"}`} />
          <span className="text-sm font-semibold text-gray-900">{project.name}</span>
        </div>
        <span className="text-xs text-gray-400">{project.division}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg py-2">
          <p className="text-sm font-bold text-gray-900">{project.progress}%</p>
          <p className="text-xs text-gray-500">Progress</p>
        </div>
        <div className="bg-gray-50 rounded-lg py-2">
          <p className="text-sm font-bold text-gray-900">{completedMs}/{project.milestones.length}</p>
          <p className="text-xs text-gray-500">Milestones</p>
        </div>
        <div className="bg-gray-50 rounded-lg py-2">
          <p className="text-sm font-bold text-gray-900">{spentPct}%</p>
          <p className="text-xs text-gray-500">Budget Used</p>
        </div>
      </div>
      <Progress value={project.progress} className="h-1.5" />
    </div>
  );
}
