import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  FileText,
  FolderKanban,
  Package,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RoleSelectorModal } from "@/components/lifecycle/RoleSelectorModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { toast } from "@/hooks/use-toast";
import {
  getInitiatives,
  getProjects,
  type Division,
  type Initiative,
  type InitiativeType,
  type Project,
} from "@/data/shared/lifecyclePortfolioStore";
import {
  getDemoAccount,
  getLifecycleRole,
  type LifecycleInsightsRole,
  LIFECYCLE_ROLE_LABELS,
} from "@/data/shared/lifecycleRole";
import {
  INITIATIVE_LEVEL_SERVICES,
  LC_SERVICE_SLA,
  addLCRequest,
  type LCServiceType,
} from "@/data/lifecycle/serviceRequestState";

// ── Types ──────────────────────────────────────────────────────────────────────

type DetailTab = "overview" | "projects" | "applications" | "compliance" | "products" | "retirement";

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

const PRIORITY_OPTIONS = ["Critical", "High", "Medium", "Low"] as const;

const TABS: { id: DetailTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: Briefcase },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "applications", label: "Applications", icon: Server },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "products", label: "Products", icon: Package },
  { id: "retirement", label: "Retirement", icon: Archive },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function LCInitiativeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const initiative = useMemo(
    () => getInitiatives().find((i) => i.id === id) ?? null,
    [id]
  );

  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  // ── See Insights ────────────────────────────────────────────────────────────
  const [drawerRole, setDrawerRole] = useState<LifecycleInsightsRole | null>(() => getLifecycleRole());
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const openSeeInsights = () => {
    const currentRole = getLifecycleRole();
    if (currentRole) {
      setDrawerRole(currentRole);
      navigate(`/marketplaces/lifecycle-management/initiative/${id}/insights`);
    } else {
      setRoleModalOpen(true);
    }
  };

  const handleRoleSelected = (role: LifecycleInsightsRole) => {
    setDrawerRole(role);
    setRoleModalOpen(false);
    navigate(`/marketplaces/lifecycle-management/initiative/${id}/insights`);
  };

  // ── Request Service ─────────────────────────────────────────────────────────
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceType, setServiceType] = useState<LCServiceType>(INITIATIVE_LEVEL_SERVICES[0]);
  const [servicePriority, setServicePriority] = useState<(typeof PRIORITY_OPTIONS)[number]>("Medium");
  const [serviceNotes, setServiceNotes] = useState("");

  const openRequestService = () => {
    setServiceType(INITIATIVE_LEVEL_SERVICES[0]);
    setServicePriority("Medium");
    setServiceNotes("");
    setServiceModalOpen(true);
  };

  const submitServiceRequest = () => {
    if (!initiative) return;
    const role = drawerRole ?? "initiative-owner";
    const account = getDemoAccount(role);
    addLCRequest({
      serviceType,
      initiativeId: initiative.id,
      initiativeName: initiative.name,
      submittedBy: account.name,
      submittedByRole: LIFECYCLE_ROLE_LABELS[role],
      status: "Submitted",
      priority: servicePriority,
      notes: serviceNotes.trim() || undefined,
      slaHours: LC_SERVICE_SLA[serviceType],
    });
    setServiceModalOpen(false);
    toast({ title: "Service request submitted", description: "Saved for the Stage 2 tracker." });
    navigate("/stage2/lifecycle-management");
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

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!initiative) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Initiative not found</h1>
          <Button onClick={() => navigate("/marketplaces/lifecycle-management")} className="bg-orange-600 hover:bg-orange-700 text-white">
            Back to Lifecycle Management
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isActive = initiative.status === "Active" || initiative.status === "At Risk";

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
            <Link to="/marketplaces/lifecycle-management" className="hover:text-foreground transition-colors">Lifecycle Management</Link>
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
                  Portfolio Cross-Link
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
              <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-xs">
                EA: {initiative.eaAlignmentScore === null ? "TBD" : `${initiative.eaAlignmentScore}%`}
              </Badge>
              <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-xs">
                {initiativeProjects.length} Projects
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs + two-column layout */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DetailTab)} className="w-full">
        <div className="bg-white border-b-2 border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <TabsList className="h-auto bg-transparent p-0 gap-1 overflow-x-auto flex justify-start">
              {TABS.map(({ id: tabId, label, icon: Icon }) => (
                <TabsTrigger
                  key={tabId}
                  value={tabId}
                  className="flex items-center gap-1.5 px-5 py-4 text-muted-foreground hover:text-foreground font-medium transition-colors relative rounded-none border-b-2 border-transparent data-[state=active]:border-orange-600 data-[state=active]:text-primary-navy bg-transparent"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── Left: tab content ──────────────────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* Overview */}
              <TabsContent value="overview" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Initiative Overview</h2>
                    <p className="text-base text-muted-foreground leading-relaxed">{initiative.description}</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <Metric label="Owner" value={initiative.owner} />
                    <Metric label="Division" value={initiative.division} />
                    <Metric label="Budget" value={fmtBudget(initiative.budget)} />
                    <Metric label="Budget Spent" value={fmtBudget(initiative.budgetSpent)} />
                    <Metric label="Target Date" value={initiative.targetDate} />
                    <Metric label="EA Alignment" value={initiative.eaAlignmentScore === null ? "TBD" : `${initiative.eaAlignmentScore}%`} />
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

                  <Separator />

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <StatTile label="Projects" value={initiativeProjects.length} />
                    <StatTile label="Applications" value={applications.length} />
                    <StatTile label="Compliance Checks" value={complianceChecks.filter((c) => c.status !== "Not Assessed").length} />
                  </div>
                </div>
              </TabsContent>

              {/* Projects */}
              <TabsContent value="projects" className="mt-0">
                <h2 className="text-2xl font-bold text-foreground mb-5">Linked Projects</h2>
                <div className="space-y-4">
                  {initiativeProjects.length === 0 ? (
                    <EmptyState icon={FolderKanban} message="No projects linked to this initiative yet." />
                  ) : (
                    initiativeProjects.map((p) => <ProjectCard key={p.id} project={p} />)
                  )}
                </div>
              </TabsContent>

              {/* Applications */}
              <TabsContent value="applications" className="mt-0">
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
              </TabsContent>

              {/* Compliance */}
              <TabsContent value="compliance" className="mt-0">
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
              </TabsContent>

              {/* Products */}
              <TabsContent value="products" className="mt-0">
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
              </TabsContent>

              {/* Retirement */}
              <TabsContent value="retirement" className="mt-0">
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
              </TabsContent>
            </div>

            {/* ── Right sidebar ──────────────────────────────────────────── */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-foreground">Initiative Details</h3>

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
                      { label: "EA Alignment", value: initiative.eaAlignmentScore === null ? "TBD" : `${initiative.eaAlignmentScore}%` },
                    ].map(({ label, value }) => (
                      <tr key={label} className="border-b border-gray-100 last:border-0">
                        <td className="text-xs text-muted-foreground py-2.5 pr-3 w-28">{label}</td>
                        <td className="text-xs font-medium text-foreground py-2.5">
                          {typeof value === "string" ? value : value}
                        </td>
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

                {/* CTA buttons */}
                <div className="space-y-2">
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={openRequestService}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Request Service
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                    onClick={openSeeInsights}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    See Insights
                  </Button>
                  {initiative.fromPortfolio && initiative.portfolioCardId && (
                    <Button
                      variant="outline"
                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() =>
                        navigate("/marketplaces/portfolio-management", {
                          state: { tab: "operational-asset-digitisation", highlightCardId: initiative.portfolioCardId },
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
      </Tabs>

      <Footer />

      {/* Role selector modal */}
      {roleModalOpen && (
        <RoleSelectorModal
          onSelect={handleRoleSelected}
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
                    {PRIORITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">SLA (hours)</label>
                <Input value={String(LC_SERVICE_SLA[serviceType])} readOnly />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Notes (optional)</label>
                <Textarea value={serviceNotes} onChange={(e) => setServiceNotes(e.target.value)} placeholder="What do you need from the TO team?" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceModalOpen(false)}>Cancel</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submitServiceRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl py-3">
      <p className="text-xl font-bold text-orange-700">{value}</p>
      <p className="text-xs text-orange-600 mt-0.5">{label}</p>
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
