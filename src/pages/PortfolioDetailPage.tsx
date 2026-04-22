import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Monitor,
  Server,
  GitMerge,
  Shield,
  Cpu,
  Zap,
  Wifi,
  Settings,
  Database,
  Brain,
  Smartphone,
  Globe,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  BarChart3,
  Rocket,
  ExternalLink,
  Clock,
  FileText,
  User,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  allITCards,
  allOTCards,
  dataDigitalCards,
  projectCards,
  initiativeCards,
  rationalisationCards,
  governanceCards,
  PM_TAB_CONFIG,
  DIVISION_GRADIENT,
  DIVISION_COLORS,
  STATUS_COLORS,
  type PMTab,
  type AppCard,
  type InfrastructureCard,
  type IntegrationCard,
  type SecurityCard,
  type ITCard,
  type OADCard,
  type OTNewCard,
  type ProjectCard,
  type InitiativeCard,
  type RationalisationCard,
  type GovernanceCard,
  type DataDigitalCard,
  type DataPlatformCard,
  type AIModelCard,
  type DigitalProductCard,
  type ExternalAPICard,
} from "@/data/portfolioManagement";
import {
  type PMRole,
} from "@/data/shared/portfolioRole";

type AnyCard = ITCard | OADCard | OTNewCard | DataDigitalCard | ProjectCard | InitiativeCard | RationalisationCard | GovernanceCard;

// ── Data resolution ───────────────────────────────────────────────────────

function resolveCard(tab: string, cardId: string): AnyCard | null {
  switch (tab) {
    case "it-asset-portfolio":
      return allITCards.find((c) => c.id === cardId) || null;
    case "ot-asset-portfolio":
      return allOTCards.find((c) => c.id === cardId) || null;
    case "data-digital-portfolio":
      return dataDigitalCards.find((c) => c.id === cardId) || null;
    case "project-portfolio":
      return projectCards.find((c) => c.id === cardId) || null;
    case "transformation-initiatives":
      return initiativeCards.find((c) => c.id === cardId) || null;
    case "technology-rationalisation":
      return rationalisationCards.find((c) => c.id === cardId) || null;
    case "governance-health":
      return governanceCards.find((c) => c.id === cardId) || null;
    default:
      return null;
  }
}

// ── Card meta helpers ─────────────────────────────────────────────────────

function getCardName(card: AnyCard, tab: string): string {
  switch (tab) {
    case "it-asset-portfolio": return (card as AppCard).name || "";
    case "ot-asset-portfolio": return "assetClassName" in card ? (card as OADCard).assetClassName : (card as OTNewCard).name;
    case "data-digital-portfolio": return (card as DataDigitalCard).name;
    case "project-portfolio": return (card as ProjectCard).name;
    case "transformation-initiatives": return (card as InitiativeCard).name;
    case "technology-rationalisation": return (card as RationalisationCard).overlapTitle;
    case "governance-health": return `${(card as GovernanceCard).division} — Governance Health`;
    default: return card.id;
  }
}

function getCardDivision(card: AnyCard, tab: string): string {
  switch (tab) {
    case "technology-rationalisation": return (card as RationalisationCard).divisionsAffected;
    default: return (card as AppCard).division || "—";
  }
}

function getCardStatus(card: AnyCard, tab: string): string {
  switch (tab) {
    case "project-portfolio": return (card as ProjectCard).ragStatus;
    case "transformation-initiatives": return (card as InitiativeCard).status;
    case "technology-rationalisation": return (card as RationalisationCard).status;
    case "governance-health": return (card as GovernanceCard).trend;
    default: return (card as AppCard).status || "—";
  }
}

function getCardAssetType(card: AnyCard, tab: string): string | undefined {
  if (tab === "it-asset-portfolio") return (card as AppCard).assetType;
  if (tab === "ot-asset-portfolio") return (card as OADCard).assetType;
  if (tab === "data-digital-portfolio") return (card as DataDigitalCard).assetType;
  return undefined;
}

function getCardRiskFlag(card: AnyCard, tab: string): string | undefined | null {
  if (tab === "it-asset-portfolio") return (card as AppCard).riskFlag;
  if (tab === "data-digital-portfolio") return (card as DataPlatformCard).riskFlag;
  if (tab === "ot-asset-portfolio" && "stateDetail" in card) return (card as OADCard).stateDetail;
  return undefined;
}

function needsInitiative(card: AnyCard, tab: string): boolean {
  const status = getCardStatus(card, tab);
  if (status === "Critical" || status === "At Risk" || status === "No Initiative") return true;
  if (tab === "it-asset-portfolio") {
    const lc = (card as AppCard).lifecycleStage;
    if (lc === "Replace" || lc === "Retire") return true;
  }
  if (tab === "ot-asset-portfolio") {
    const cs = "cardState" in card ? (card as OADCard).cardState : (card as OTNewCard).cardState;
    if (cs === "Gap") return true;
  }
  if (tab === "data-digital-portfolio") {
    if ((card as AIModelCard).modelStatus === "Deprecated") return true;
  }
  if (getCardRiskFlag(card, tab)) return true;
  return false;
}

// ── Icon per tab/assetType ────────────────────────────────────────────────

function getIcon(tab: string, assetType?: string): React.ReactNode {
  if (tab === "it-asset-portfolio") {
    if (assetType === "Infrastructure & Cloud") return <Server className="w-16 h-16 text-white/30" />;
    if (assetType === "Integration Platform") return <GitMerge className="w-16 h-16 text-white/30" />;
    if (assetType === "Security & Identity") return <Shield className="w-16 h-16 text-white/30" />;
    return <Monitor className="w-16 h-16 text-white/30" />;
  }
  if (tab === "ot-asset-portfolio") {
    if (assetType === "Smart Metering") return <Zap className="w-16 h-16 text-white/30" />;
    if (assetType === "IoT & Field Sensors") return <Wifi className="w-16 h-16 text-white/30" />;
    if (assetType === "Industrial Equipment") return <Settings className="w-16 h-16 text-white/30" />;
    return <Cpu className="w-16 h-16 text-white/30" />;
  }
  if (tab === "data-digital-portfolio") {
    if (assetType === "AI & ML Model") return <Brain className="w-16 h-16 text-white/30" />;
    if (assetType === "Digital Customer Product") return <Smartphone className="w-16 h-16 text-white/30" />;
    if (assetType === "External API") return <Globe className="w-16 h-16 text-white/30" />;
    return <Database className="w-16 h-16 text-white/30" />;
  }
  if (tab === "project-portfolio") return <Briefcase className="w-16 h-16 text-white/30" />;
  if (tab === "transformation-initiatives") return <TrendingUp className="w-16 h-16 text-white/30" />;
  if (tab === "technology-rationalisation") return <Layers className="w-16 h-16 text-white/30" />;
  return <BarChart3 className="w-16 h-16 text-white/30" />;
}

// ── Relationship resolution ───────────────────────────────────────────────

interface RelatedItem {
  id: string;
  name: string;
  tab: PMTab;
  status: string;
  division: string;
  tabLabel: string;
}

function resolveRelationships(card: AnyCard, tab: string): { group: string; items: RelatedItem[] }[] {
  const groups: { group: string; items: RelatedItem[] }[] = [];

  if (tab === "it-asset-portfolio") {
    const c = card as AppCard;
    // Linked initiative
    if (c.initiativeTag) {
      const ini = initiativeCards.filter((i) => i.name === c.initiativeTag);
      if (ini.length) groups.push({ group: "Parent Initiative", items: ini.map((i) => ({ id: i.id, name: i.name, tab: "transformation-initiatives", status: i.status, division: i.division, tabLabel: "Initiatives" })) });
    }
    // Linked project
    if (c.projectTag) {
      const prj = projectCards.filter((p) => p.name === c.projectTag);
      if (prj.length) groups.push({ group: "Linked Project", items: prj.map((p) => ({ id: p.id, name: p.name, tab: "project-portfolio", status: p.ragStatus, division: p.division, tabLabel: "Projects" })) });
    }
  }

  if (tab === "ot-asset-portfolio") {
    const isOAD = "assetClassName" in card;
    const ini = isOAD ? (card as OADCard).initiativeTag : (card as OTNewCard).initiativeTag;
    if (ini) {
      const found = initiativeCards.filter((i) => i.name === ini);
      if (found.length) groups.push({ group: "Parent Initiative", items: found.map((i) => ({ id: i.id, name: i.name, tab: "transformation-initiatives", status: i.status, division: i.division, tabLabel: "Initiatives" })) });
    }
    // Linked AI models
    const linkedModels = (dataDigitalCards as AIModelCard[]).filter((m) => m.assetType === "AI & ML Model" && m.linkedOTAsset === card.id);
    if (linkedModels.length) groups.push({ group: "AI Models Operating on This Asset", items: linkedModels.map((m) => ({ id: m.id, name: m.name, tab: "data-digital-portfolio", status: m.status, division: m.division, tabLabel: "Data & Digital" })) });
  }

  if (tab === "data-digital-portfolio") {
    const c = card as DataDigitalCard;
    if (c.initiativeTag) {
      const ini = initiativeCards.filter((i) => i.name === c.initiativeTag);
      if (ini.length) groups.push({ group: "Parent Initiative", items: ini.map((i) => ({ id: i.id, name: i.name, tab: "transformation-initiatives", status: i.status, division: i.division, tabLabel: "Initiatives" })) });
    }
    if ((c as AIModelCard).linkedOTAsset) {
      const otCard = allOTCards.find((o) => o.id === (c as AIModelCard).linkedOTAsset);
      if (otCard) {
        const name = "assetClassName" in otCard ? (otCard as OADCard).assetClassName : (otCard as OTNewCard).name;
        groups.push({ group: "Linked OT Asset", items: [{ id: otCard.id, name, tab: "ot-asset-portfolio", status: otCard.status, division: otCard.division, tabLabel: "OT Assets" }] });
      }
    }
  }

  if (tab === "project-portfolio") {
    const c = card as ProjectCard;
    const parent = initiativeCards.filter((i) => i.name === c.parentInitiative);
    if (parent.length) groups.push({ group: "Parent Initiative", items: parent.map((i) => ({ id: i.id, name: i.name, tab: "transformation-initiatives", status: i.status, division: i.division, tabLabel: "Initiatives" })) });
    const relApps = allITCards.filter((a) => (a as AppCard).projectTag === c.name);
    if (relApps.length) groups.push({ group: "Related IT Assets", items: relApps.map((a) => ({ id: a.id, name: (a as AppCard).name, tab: "it-asset-portfolio", status: (a as AppCard).status, division: (a as AppCard).division, tabLabel: "IT Assets" })) });
  }

  if (tab === "transformation-initiatives") {
    const c = card as InitiativeCard;
    const relProjects = projectCards.filter((p) => p.parentInitiative === c.name);
    if (relProjects.length) groups.push({ group: "Related Projects", items: relProjects.map((p) => ({ id: p.id, name: p.name, tab: "project-portfolio", status: p.ragStatus, division: p.division, tabLabel: "Projects" })) });
    const relApps = allITCards.filter((a) => (a as AppCard).initiativeTag === c.name);
    if (relApps.length) groups.push({ group: "Related IT Assets", items: relApps.map((a) => ({ id: a.id, name: (a as AppCard).name, tab: "it-asset-portfolio", status: (a as AppCard).status, division: (a as AppCard).division, tabLabel: "IT Assets" })) });
    const relOT = allOTCards.filter((o) => o.initiativeTag === c.name);
    if (relOT.length) groups.push({ group: "Related OT Assets", items: relOT.map((o) => { const name = "assetClassName" in o ? (o as OADCard).assetClassName : (o as OTNewCard).name; return { id: o.id, name, tab: "ot-asset-portfolio" as PMTab, status: o.status, division: o.division, tabLabel: "OT Assets" }; }) });
  }

  return groups;
}

// ── Status badge helper ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "bg-gray-100 text-gray-700 border-gray-200";
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>{status}</span>;
}

// ── Quick Stats ───────────────────────────────────────────────────────────

function QuickStats({ card, tab }: { card: AnyCard; tab: string }) {
  const stats: { label: string; value: string; sub?: string }[] = [];

  if (tab === "it-asset-portfolio") {
    const assetType = (card as AppCard).assetType;
    if (assetType === "Application") {
      const c = card as AppCard;
      stats.push({ label: "Health Score", value: `${c.healthScore}%` });
      stats.push({ label: "Technical Debt", value: c.technicalDebt });
      stats.push({ label: "Lifecycle Stage", value: c.lifecycleStage });
      stats.push({ label: "Annual TCO", value: c.annualTCO });
    } else if (assetType === "Infrastructure & Cloud") {
      const c = card as InfrastructureCard;
      stats.push({ label: "Health Score", value: `${c.healthScore}%` });
      stats.push({ label: "Cloud Provider", value: c.cloudProvider });
      stats.push({ label: "Annual Cost", value: c.annualCost });
      stats.push({ label: "Redundancy", value: c.redundancyStatus });
    } else if (assetType === "Integration Platform") {
      const c = card as IntegrationCard;
      stats.push({ label: "Health Score", value: `${c.healthScore}%` });
      stats.push({ label: "Uptime", value: `${c.uptimePercent}%` });
      stats.push({ label: "Connected Systems", value: c.connectedSystemsCount.toString() });
      stats.push({ label: "Annual Cost", value: c.annualCost });
    } else if (assetType === "Security & Identity") {
      const c = card as SecurityCard;
      stats.push({ label: "Compliance Score", value: `${c.complianceScore}%` });
      stats.push({ label: "Open Vulnerabilities", value: c.openVulnerabilities.toString() });
      stats.push({ label: "Last Audit", value: c.lastAuditDate });
      stats.push({ label: "Licence Expiry", value: c.licenceExpiry });
    }
  } else if (tab === "ot-asset-portfolio") {
    const isOAD = "assetClassName" in card;
    const pct = isOAD ? (card as OADCard).digitisedPercentage : (card as OTNewCard).digitisedPercentage;
    const condition = isOAD ? (card as OADCard).assetCondition : (card as OTNewCard).assetCondition;
    const connectivity = isOAD ? (card as OADCard).connectivityStatus : (card as OTNewCard).connectivityStatus;
    const inspection = isOAD ? (card as OADCard).lastInspectionDate : (card as OTNewCard).lastInspectionDate;
    stats.push({ label: "Digitised", value: `${pct}%` });
    if (condition) stats.push({ label: "Asset Condition", value: condition });
    if (connectivity) stats.push({ label: "Connectivity", value: connectivity });
    if (inspection) stats.push({ label: "Last Inspection", value: inspection });
  } else if (tab === "data-digital-portfolio") {
    const assetType = (card as DataDigitalCard).assetType;
    if (assetType === "Data Platform") {
      const c = card as DataPlatformCard;
      stats.push({ label: "Health Score", value: `${c.healthScore}%` });
      stats.push({ label: "Data Quality", value: `${c.dataQualityScore}%` });
      stats.push({ label: "Data Volume", value: `${c.dataVolumeTB.toLocaleString()} TB` });
      stats.push({ label: "Active Pipelines", value: c.activePipelines.toString() });
    } else if (assetType === "AI & ML Model") {
      const c = card as AIModelCard;
      stats.push({ label: "Accuracy", value: `${c.modelAccuracy}%` });
      stats.push({ label: "Model Status", value: c.modelStatus });
      stats.push({ label: "Last Retrained", value: c.lastRetrained });
      stats.push({ label: "Bias Review", value: c.biasReview });
    } else if (assetType === "Digital Customer Product") {
      const c = card as DigitalProductCard;
      stats.push({ label: "Health Score", value: `${c.healthScore}%` });
      stats.push({ label: "CSAT", value: `${c.csatScore}/5.0` });
      stats.push({ label: "Monthly Active Users", value: c.monthlyActiveUsers >= 1000000 ? `${(c.monthlyActiveUsers / 1000000).toFixed(2)}M` : `${Math.round(c.monthlyActiveUsers / 1000)}K` });
      stats.push({ label: "Accessibility", value: c.accessibilityCompliance });
    } else if (assetType === "External API") {
      const c = card as ExternalAPICard;
      stats.push({ label: "Health Score", value: `${c.healthScore}%` });
      stats.push({ label: "Uptime", value: `${c.uptimePercent}%` });
      stats.push({ label: "Active Consumers", value: c.activeConsumers.toString() });
      stats.push({ label: "Deprecation", value: c.deprecationDate || "None scheduled" });
    }
  } else if (tab === "project-portfolio") {
    const c = card as ProjectCard;
    stats.push({ label: "Progress", value: `${c.progress}%` });
    stats.push({ label: "RAG Status", value: c.ragStatus });
    stats.push({ label: "Budget Health", value: c.budgetHealth });
    stats.push({ label: "EA Alignment", value: `${c.eaAlignment}%` });
  } else if (tab === "transformation-initiatives") {
    const c = card as InitiativeCard;
    stats.push({ label: "EA Alignment", value: `${c.eaAlignmentScore}%` });
    stats.push({ label: "Projects", value: c.projectsCount.toString() });
    stats.push({ label: "Budget", value: c.programmeBudget });
    stats.push({ label: "Target", value: c.targetCompletion });
  } else if (tab === "technology-rationalisation") {
    const c = card as RationalisationCard;
    stats.push({ label: "Annual Overlap Cost", value: c.annualOverlapCost });
    stats.push({ label: "Saving Potential", value: c.savingPotential });
    stats.push({ label: "Recommendation", value: c.recommendation });
    stats.push({ label: "Complexity", value: c.complexity });
  } else if (tab === "governance-health") {
    const c = card as GovernanceCard;
    stats.push({ label: "Governance Score", value: `${c.overallGovernanceScore}%` });
    stats.push({ label: "EA Maturity", value: `${c.eaMaturityScore}/5.0` });
    stats.push({ label: "Arch. Compliance", value: `${c.architectureCompliance}%` });
    stats.push({ label: "Critical Violations", value: c.criticalViolations.toString() });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
          <p className="text-xl font-bold text-gray-900">{stat.value}</p>
          {stat.sub && <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>}
        </div>
      ))}
    </div>
  );
}

// ── Main Detail Page ──────────────────────────────────────────────────────

const PortfolioDetailPage = () => {
  const { tab, cardId } = useParams<{ tab: string; cardId: string }>();
  const navigate = useNavigate();
  const [activeDetailTab, setActiveDetailTab] = useState("overview");
  const role: PMRole = "EA Office / Portfolio Manager";

  const pmTab = tab as PMTab | undefined;
  const card = tab && cardId ? resolveCard(tab, cardId) : null;

  if (!card || !tab || !pmTab) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Asset Not Found</h1>
          <p className="text-gray-500 mb-6">The requested portfolio asset could not be found.</p>
          <Button onClick={() => navigate("/marketplaces/asset-capability")}>
            Back to Asset & Capability Portfolio
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const name = getCardName(card, tab);
  const division = getCardDivision(card, tab);
  const status = getCardStatus(card, tab);
  const assetType = getCardAssetType(card, tab);
  const riskFlag = getCardRiskFlag(card, tab);
  const tabCfg = PM_TAB_CONFIG[pmTab];
  const divGradient = DIVISION_GRADIENT[division] || DIVISION_GRADIENT["All Divisions"];
  const showInitiateCTA = needsInitiative(card, tab);
  const relationships = resolveRelationships(card, tab);

  const isEA = true;

  const handleInitiateInLifecycle = () => {
    const prefill = {
      name: `Govern: ${name}`,
      division,
      objective: riskFlag || `No active initiative for ${name}. EA Office action required.`,
      scope: name,
      portfolioCardId: card.id,
      portfolioTab: tab,
    };
    navigate("/marketplaces/initiative-portfolio", {
      state: { openStartInitiative: true, fromPortfolio: true, prefill },
    });
  };

  const isAssetTab = ["it-asset-portfolio", "ot-asset-portfolio", "data-digital-portfolio"].includes(tab);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <nav className="flex items-center text-sm text-gray-500 flex-wrap gap-1">
            <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/marketplaces" className="hover:text-gray-900 transition-colors">Marketplaces</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/marketplaces/asset-capability" className="hover:text-gray-900 transition-colors">Asset & Capability Portfolio</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-400">{tabCfg.shortLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium truncate max-w-xs">{name}</span>
          </nav>
          <span className="inline-flex items-center gap-1.5 bg-green-700 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
            Digital DEWA 2035
          </span>
        </div>
      </div>

      {/* Gradient page header */}
      <div className={`relative bg-gradient-to-br ${divGradient} h-32 overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          {getIcon(tab, assetType)}
        </div>
        {assetType && (
          <span className="absolute top-4 left-6 text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium backdrop-blur-sm">
            {assetType}
          </span>
        )}
        <span className={`absolute top-4 right-6 text-xs px-3 py-1 rounded-full border font-medium ${STATUS_COLORS[status] || "bg-white/20 text-white border-white/30"}`}>
          {status}
        </span>
        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-bold text-white leading-tight max-w-3xl">{name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIVISION_COLORS[division] || "bg-white/20 text-white"}`}>
            {division}
          </span>
        </div>
      </div>

      {/* Back navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <button
          onClick={() => navigate(`/marketplaces/asset-capability`, { state: { tab } })}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio Management
        </button>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 max-w-3xl">
                Portfolio context for <strong>{name}</strong>, with related governance signals and direct handoff into Lifecycle when intervention is required.
              </p>
              <p className="text-xs uppercase tracking-wide text-gray-400">Portfolio Manager view</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {showInitiateCTA && (
                <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleInitiateInLifecycle}>
                  <Rocket className="w-4 h-4 mr-2" />
                  Initiate in Lifecycle
                </Button>
              )}
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Request Report
              </Button>
            </div>
          </div>
        </div>

        {/* Inner tab bar */}
        <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab}>
          <div className="border-b border-gray-200 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <TabsList className="flex gap-0 bg-transparent p-0 h-auto">
              <TabsTrigger
                value="overview"
                className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent rounded-none bg-transparent shadow-none data-[state=active]:border-orange-600 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-colors whitespace-nowrap"
              >Overview</TabsTrigger>
              {isAssetTab && (
                <>
                  <TabsTrigger
                    value="insights"
                    className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent rounded-none bg-transparent shadow-none data-[state=active]:border-orange-600 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-colors whitespace-nowrap"
                  >Insights</TabsTrigger>
                  <TabsTrigger
                    value="linked"
                    className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent rounded-none bg-transparent shadow-none data-[state=active]:border-orange-600 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-colors whitespace-nowrap"
                  >Linked Assets</TabsTrigger>
                  <TabsTrigger
                    value="lifecycle"
                    className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent rounded-none bg-transparent shadow-none data-[state=active]:border-orange-600 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-colors whitespace-nowrap"
                  >Initiate in Lifecycle</TabsTrigger>
                  <TabsTrigger
                    value="actions"
                    className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent rounded-none bg-transparent shadow-none data-[state=active]:border-orange-600 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-colors whitespace-nowrap"
                  >Actions</TabsTrigger>
                </>
              )}
              {!isAssetTab && (
                <>
                  <TabsTrigger
                    value="metrics"
                    className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent rounded-none bg-transparent shadow-none data-[state=active]:border-orange-600 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-colors whitespace-nowrap"
                  >Metrics</TabsTrigger>
                  <TabsTrigger
                    value="linked"
                    className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent rounded-none bg-transparent shadow-none data-[state=active]:border-orange-600 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-colors whitespace-nowrap"
                  >Related Portfolio Items</TabsTrigger>
                  <TabsTrigger
                    value="actions"
                    className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent rounded-none bg-transparent shadow-none data-[state=active]:border-orange-600 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-colors whitespace-nowrap"
                  >Actions</TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Portfolio Snapshot</h3>
              <QuickStats card={card} tab={tab} />
            </div>

            {riskFlag && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-0.5">Risk Flag</p>
                  <p className="text-sm text-amber-800">{riskFlag}</p>
                </div>
              </div>
            )}

            <>
                {/* EA Office full view */}
                {isEA && (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">EA Office View — Full Detail</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        {tab === "it-asset-portfolio" && (card as AppCard).assetType === "Application" && (
                          <>
                            <div><p className="text-gray-400 mb-1">Vendor</p><p className="font-medium text-gray-900">{(card as AppCard).vendor || "—"}</p></div>
                            <div><p className="text-gray-400 mb-1">Hosting</p><p className="font-medium text-gray-900">{(card as AppCard).hostingModel || "—"}</p></div>
                            <div><p className="text-gray-400 mb-1">Deployed</p><p className="font-medium text-gray-900">{(card as AppCard).deploymentDate || "—"}</p></div>
                          </>
                        )}
                      </div>
                      {tab === "it-asset-portfolio" && (card as AppCard).eaAlignment && (
                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-900 mb-1">EA Alignment</p>
                          <p className="text-xs text-blue-700">{(card as AppCard).eaAlignment}</p>
                        </div>
                      )}
                      {tab === "it-asset-portfolio" && (card as AppCard).lifecycleRecommendation && (
                        <div className="mt-3 bg-orange-50 border border-orange-100 rounded-lg p-3">
                          <p className="text-xs font-semibold text-orange-900 mb-1">EA Recommendation</p>
                          <p className="text-xs text-orange-700">{(card as AppCard).lifecycleRecommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Health breakdown for applications (EA only) */}
                {isEA && tab === "it-asset-portfolio" && (card as AppCard).insightsBreakdown && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Health Breakdown</h3>
                    {Object.entries((card as AppCard).insightsBreakdown!).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-3 mb-2.5">
                        <span className="text-xs text-gray-500 w-24 capitalize">{k}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${v >= 80 ? "bg-green-500" : v >= 65 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${v}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-8 text-right">{v}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* OT progress detail */}
                {tab === "ot-asset-portfolio" && (() => {
                  const isOAD = "assetClassName" in card;
                  const pct = isOAD ? (card as OADCard).digitisedPercentage : (card as OTNewCard).digitisedPercentage;
                  const total = isOAD ? (card as OADCard).totalAssets : (card as OTNewCard).totalAssets;
                  const digitised = isOAD ? (card as OADCard).digitisedCount : (card as OTNewCard).digitisedCount;
                  const stateDetail = isOAD ? (card as OADCard).stateDetail : (card as OTNewCard).stateDetail;
                  return (
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Digitisation Progress</h3>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-gray-600">Total: {String(total)}</span>
                        <span className={`font-bold ${pct >= 80 ? "text-green-700" : pct >= 50 ? "text-amber-700" : "text-red-700"}`}>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
                        <div className={`h-3 rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-500">Digitised: {String(digitised)}</p>
                      {stateDetail && <p className="text-xs text-orange-700 mt-2 bg-orange-50 rounded p-2">{stateDetail}</p>}
                    </div>
                  );
                })()}
            </>
          </TabsContent>

          {/* Insights Tab */}
          {isAssetTab && (
            <TabsContent value="insights" className="space-y-5">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Technical Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  {tab === "it-asset-portfolio" && (() => {
                    const assetType = (card as AppCard).assetType;
                    if (assetType === "Application") {
                      const c = card as AppCard;
                      return (
                        <>
                          <div><p className="text-gray-400 mb-1">Health Score</p><p className="font-bold text-lg text-gray-900">{c.healthScore}%</p></div>
                          <div><p className="text-gray-400 mb-1">Technical Debt</p><p className="font-medium text-gray-900">{c.technicalDebt}</p></div>
                          <div><p className="text-gray-400 mb-1">Lifecycle Stage</p><p className="font-medium text-gray-900">{c.lifecycleStage}</p></div>
                          <div><p className="text-gray-400 mb-1">Annual TCO</p><p className="font-medium text-gray-900">{c.annualTCO}</p></div>
                          <div><p className="text-gray-400 mb-1">Vendor</p><p className="font-medium text-gray-900">{c.vendor || "—"}</p></div>
                          <div><p className="text-gray-400 mb-1">Hosting Model</p><p className="font-medium text-gray-900">{c.hostingModel || "—"}</p></div>
                          <div><p className="text-gray-400 mb-1">Deployment Year</p><p className="font-medium text-gray-900">{c.deploymentDate || "—"}</p></div>
                        </>
                      );
                    }
                    if (assetType === "Infrastructure & Cloud") {
                      const c = card as InfrastructureCard;
                      return (
                        <>
                          <div><p className="text-gray-400 mb-1">Health Score</p><p className="font-bold text-lg text-gray-900">{c.healthScore}%</p></div>
                          <div><p className="text-gray-400 mb-1">Cloud Provider</p><p className="font-medium text-gray-900">{c.cloudProvider}</p></div>
                          <div><p className="text-gray-400 mb-1">Annual Cost</p><p className="font-medium text-gray-900">{c.annualCost}</p></div>
                          <div><p className="text-gray-400 mb-1">Contract Renewal</p><p className="font-medium text-gray-900">{c.contractRenewalDate}</p></div>
                          <div><p className="text-gray-400 mb-1">Redundancy</p><p className="font-medium text-gray-900">{c.redundancyStatus}</p></div>
                        </>
                      );
                    }
                    if (assetType === "Integration Platform") {
                      const c = card as IntegrationCard;
                      return (
                        <>
                          <div><p className="text-gray-400 mb-1">Health Score</p><p className="font-bold text-lg text-gray-900">{c.healthScore}%</p></div>
                          <div><p className="text-gray-400 mb-1">Integration Type</p><p className="font-medium text-gray-900">{c.integrationType}</p></div>
                          <div><p className="text-gray-400 mb-1">Connected Systems</p><p className="font-medium text-gray-900">{c.connectedSystemsCount}</p></div>
                          <div><p className="text-gray-400 mb-1">Uptime %</p><p className="font-medium text-gray-900">{c.uptimePercent}%</p></div>
                          <div><p className="text-gray-400 mb-1">Annual Cost</p><p className="font-medium text-gray-900">{c.annualCost}</p></div>
                        </>
                      );
                    }
                    if (assetType === "Security & Identity") {
                      const c = card as SecurityCard;
                      return (
                        <>
                          <div><p className="text-gray-400 mb-1">Compliance Score</p><p className="font-bold text-lg text-gray-900">{c.complianceScore}%</p></div>
                          <div><p className="text-gray-400 mb-1">Open Vulnerabilities</p><p className={`font-bold text-lg ${c.openVulnerabilities > 0 ? "text-red-700" : "text-green-700"}`}>{c.openVulnerabilities}</p></div>
                          <div><p className="text-gray-400 mb-1">Last Audit</p><p className="font-medium text-gray-900">{c.lastAuditDate}</p></div>
                          <div><p className="text-gray-400 mb-1">Licence Expiry</p><p className="font-medium text-gray-900">{c.licenceExpiry}</p></div>
                          <div><p className="text-gray-400 mb-1">Frameworks</p><p className="font-medium text-gray-900">{c.frameworkCoverage.join(", ")}</p></div>
                        </>
                      );
                    }
                    return null;
                  })()}
                  {tab === "data-digital-portfolio" && (() => {
                    const assetType = (card as DataDigitalCard).assetType;
                    if (assetType === "Data Platform") {
                      const c = card as DataPlatformCard;
                      return (
                        <>
                          <div><p className="text-gray-400 mb-1">Platform Type</p><p className="font-medium text-gray-900">{c.platformType}</p></div>
                          <div><p className="text-gray-400 mb-1">Data Volume</p><p className="font-medium text-gray-900">{c.dataVolumeTB.toLocaleString()} TB</p></div>
                          <div><p className="text-gray-400 mb-1">Active Pipelines</p><p className="font-medium text-gray-900">{c.activePipelines}</p></div>
                          <div><p className="text-gray-400 mb-1">Data Quality</p><p className="font-medium text-gray-900">{c.dataQualityScore}%</p></div>
                          <div className="col-span-2"><p className="text-gray-400 mb-1">Governed Domains</p><p className="font-medium text-gray-900">{c.governedDomains.join(", ")}</p></div>
                        </>
                      );
                    }
                    if (assetType === "AI & ML Model") {
                      const c = card as AIModelCard;
                      return (
                        <>
                          <div><p className="text-gray-400 mb-1">Model Status</p><p className="font-medium text-gray-900">{c.modelStatus}</p></div>
                          <div><p className="text-gray-400 mb-1">Accuracy</p><p className="font-medium text-gray-900">{c.modelAccuracy}%</p></div>
                          <div><p className="text-gray-400 mb-1">Last Retrained</p><p className="font-medium text-gray-900">{c.lastRetrained}</p></div>
                          <div><p className="text-gray-400 mb-1">Data Freshness</p><p className="font-medium text-gray-900">{c.trainingDataFreshness}</p></div>
                          <div><p className="text-gray-400 mb-1">Bias Review</p><p className="font-medium text-gray-900">{c.biasReview}</p></div>
                          <div className="col-span-2"><p className="text-gray-400 mb-1">Use Case</p><p className="font-medium text-gray-900">{c.useCase}</p></div>
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* EA Recommendations */}
              {tab === "it-asset-portfolio" && ((card as AppCard).lifecycleRecommendation || (card as AppCard).eaAlignment) && (
                <div className="space-y-3">
                  {(card as AppCard).eaAlignment && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1.5">EA Alignment</p>
                      <p className="text-sm text-blue-800">{(card as AppCard).eaAlignment}</p>
                    </div>
                  )}
                  {(card as AppCard).lifecycleRecommendation && (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide mb-1.5">EA Lifecycle Recommendation</p>
                      <p className="text-sm text-orange-800">{(card as AppCard).lifecycleRecommendation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Digital DEWA 2035 alignment */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-700 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Digital DEWA 2035</span>
                  <span className="text-xs text-green-700 font-medium">Programme Context</span>
                </div>
                <p className="text-sm text-green-800">
                  {division === "Customer Services"
                    ? "This asset contributes to the Customer Experience Transformation initiative under Digital DEWA 2035 — targeting CSAT improvement and Arabic-first digital service delivery."
                    : division === "Transmission" || division === "Generation" || division === "Distribution"
                    ? "This asset is in scope for the Smart Grid Modernisation Programme and OT Cybersecurity Enhancement initiative under Digital DEWA 2035."
                    : division === "Digital DEWA & Moro Hub"
                    ? "This asset is a core component of the Digital DEWA Programme — cloud-native platform modernisation and Moro Hub expansion under the 2035 roadmap."
                    : division === "Water Services"
                    ? "This asset supports DEWA's water infrastructure digitisation goals under the Digital DEWA 2035 operational excellence pillar."
                    : "This asset falls under EA Office governance as part of the DEWA Enterprise Data Strategy and Digital DEWA 2035 estate rationalisation roadmap."
                  }
                </p>
              </div>
            </TabsContent>
          )}

          {/* Linked Assets Tab */}
          <TabsContent value="linked" className="space-y-5">
            {relationships.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
                No cross-portfolio links found for this asset. If this asset has related projects or initiatives, link them by updating the relevant portfolio cards.
              </div>
            ) : (
              relationships.map((group) => (
                <div key={group.group}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{group.group}</h3>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-orange-300 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.tabLabel} · {item.division}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={item.status} />
                          <button
                            onClick={() => navigate(`/marketplaces/asset-capability/${item.tab}/${item.id}`)}
                            className="text-xs text-orange-600 hover:text-orange-800 flex items-center gap-1"
                          >
                            View detail <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Initiate in Lifecycle Tab (asset tabs only) */}
          {isAssetTab && (
            <TabsContent value="lifecycle" className="space-y-5">

              {/* Why this asset needs intervention */}
              {showInitiateCTA ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">EA Office Action Required</p>
                      <p className="text-sm text-amber-800">
                        {riskFlag
                          ? riskFlag
                          : status === "Critical"
                          ? `${name} is in a Critical state with no active governing initiative. Immediate EA escalation is required.`
                          : status === "No Initiative"
                          ? `${name} has no active initiative and is not covered under any Digital DEWA 2035 programme workstream.`
                          : `${name} is At Risk. A governing initiative should be raised to protect delivery continuity.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-100 rounded-xl p-5 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-900 mb-1">Initiative Coverage Active</p>
                    <p className="text-sm text-green-800">
                      This asset is already governed under an active Digital DEWA 2035 initiative. Use the Linked Assets tab to navigate to the parent initiative.
                    </p>
                  </div>
                </div>
              )}

              {/* Pre-fill preview card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Proposed Initiative — Pre-filled Context</h3>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Draft</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-5">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Initiative Name</p>
                    <p className="font-medium text-gray-900">Govern: {name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Owning Division</p>
                    <p className="font-medium text-gray-900">{division}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Scope</p>
                    <p className="font-medium text-gray-900">{name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Asset Type</p>
                    <p className="font-medium text-gray-900">{assetType || tabCfg.shortLabel}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Objective</p>
                    <p className="font-medium text-gray-900">
                      {riskFlag || `No active initiative covers ${name}. EA Office action required to bring this asset under governed delivery.`}
                    </p>
                  </div>
                </div>

                {/* 2035 programme alignment */}
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-green-700 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Digital DEWA 2035</span>
                  </div>
                  <p className="text-xs text-green-800">
                    {division === "Customer Services"
                      ? "Aligns to: Customer Experience Transformation · Rammas AI Enhancement"
                      : division === "Transmission" || division === "Generation" || division === "Distribution"
                      ? "Aligns to: Smart Grid Modernisation · OT Cybersecurity Enhancement"
                      : division === "Digital DEWA & Moro Hub"
                      ? "Aligns to: Digital DEWA Programme · Moro Hub Cloud Expansion"
                      : "Aligns to: DEWA Enterprise Data Strategy · EA Office Governance Roadmap"
                    }
                  </p>
                </div>

                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={handleInitiateInLifecycle}
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Launch in Lifecycle Management
                </Button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  You will be taken to Lifecycle Management with this context pre-filled.
                </p>
              </div>

              {/* Governance links */}
              {relationships.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Existing Governance Links</h3>
                  <div className="space-y-2">
                    {relationships.flatMap((g) => g.items).map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.tabLabel} · {item.division}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/marketplaces/asset-capability/${item.tab}/${item.id}`)}
                          className="text-xs text-orange-600 hover:text-orange-800 flex items-center gap-1 flex-shrink-0"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          )}

          {/* Actions Tab — for non-asset governance tabs (shown outside isAssetTab block) */}
          {!isAssetTab && (
            <TabsContent value="actions" className="space-y-5">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Available Actions</h3>
                <div className="space-y-2">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" onClick={handleInitiateInLifecycle}>
                    <Rocket className="w-4 h-4 mr-2" /> Initiate in Lifecycle
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" /> Request Report
                  </Button>
                  <Button variant="outline" className="w-full">
                    <User className="w-4 h-4 mr-2" /> Contact EA Office
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Metrics Tab (for governance tabs) */}
          {!isAssetTab && (
            <TabsContent value="metrics" className="space-y-5">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Full Metrics</h3>
                <QuickStats card={card} tab={tab} />
              </div>
            </TabsContent>
          )}

          {/* Actions Tab (asset cards) */}
          {isAssetTab && (
            <TabsContent value="actions" className="space-y-5">

              {/* Primary actions */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Available Actions</h3>
                <div className="space-y-2">
                  {showInitiateCTA && (
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" onClick={handleInitiateInLifecycle}>
                      <Rocket className="w-4 h-4 mr-2" /> Initiate in Lifecycle Management
                    </Button>
                  )}
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" /> Request Assessment Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="w-4 h-4 mr-2" /> Schedule EA Review
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" /> Contact Asset Owner
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-gray-400" disabled>
                    <ExternalLink className="w-4 h-4 mr-2" /> Export to PDF — coming soon
                  </Button>
                </div>
              </div>

              {/* Asset history timeline */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Asset History</h3>
                <div className="space-y-4">
                  {[
                    { date: "March 2026",   event: "Added to Portfolio Management registry under Digital DEWA 2035 estate audit", icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
                    { date: "February 2026", event: "EA Office governance review completed — status confirmed", icon: <Shield className="w-4 h-4 text-blue-500" /> },
                    ...(getCardRiskFlag(card, tab) ? [{ date: "January 2026", event: "Risk flag raised: " + (getCardRiskFlag(card, tab) || "").slice(0, 80), icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> }] : []),
                    { date: "Q4 2025", event: "Portfolio status reviewed and updated by Corporate EA Office", icon: <Clock className="w-4 h-4 text-gray-400" /> },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                      <div>
                        <p className="text-sm text-gray-900">{item.event}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Footer />

    </div>
  );
};

export default PortfolioDetailPage;
