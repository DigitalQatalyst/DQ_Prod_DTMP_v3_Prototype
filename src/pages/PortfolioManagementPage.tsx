import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  X,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  LayoutGrid,
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
  BarChart3,
  Layers,
  Bookmark,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  allITCards,
  allOTCards,
  dataDigitalCards,
  projectCards,
  initiativeCards,
  rationalisationCards,
  governanceCards,
  getPublishedContentCards,
  mapContentCardToRationalisationCard,
  mapContentCardToOTCard,
  PM_TAB_CONFIG,
  PM_REPORT_TYPES,
  PM_SLA_MAP,
  DIVISION_COLORS,
  DIVISION_GRADIENT,
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
  getSessionPMRole,
  setSessionPMRole,
  clearSessionPMRole,
  type PMRole,
  PM_ROLES,
} from "@/data/shared/portfolioRole";

// ── Icon map per asset type ───────────────────────────────────────────────

function getCardIcon(tab: PMTab, assetType?: string): React.ReactNode {
  if (tab === "it-asset-portfolio") {
    if (assetType === "Infrastructure & Cloud") return <Server className="w-10 h-10 text-white/35" />;
    if (assetType === "Integration Platform") return <GitMerge className="w-10 h-10 text-white/35" />;
    if (assetType === "Security & Identity") return <Shield className="w-10 h-10 text-white/35" />;
    return <Monitor className="w-10 h-10 text-white/35" />;
  }
  if (tab === "ot-asset-portfolio") {
    if (assetType === "Smart Metering") return <Zap className="w-10 h-10 text-white/35" />;
    if (assetType === "IoT & Field Sensors") return <Wifi className="w-10 h-10 text-white/35" />;
    if (assetType === "Industrial Equipment") return <Settings className="w-10 h-10 text-white/35" />;
    return <Cpu className="w-10 h-10 text-white/35" />;
  }
  if (tab === "data-digital-portfolio") {
    if (assetType === "AI & ML Model") return <Brain className="w-10 h-10 text-white/35" />;
    if (assetType === "Digital Customer Product") return <Smartphone className="w-10 h-10 text-white/35" />;
    if (assetType === "External API") return <Globe className="w-10 h-10 text-white/35" />;
    return <Database className="w-10 h-10 text-white/35" />;
  }
  if (tab === "project-portfolio") return <Briefcase className="w-10 h-10 text-white/35" />;
  if (tab === "transformation-initiatives") return <TrendingUp className="w-10 h-10 text-white/35" />;
  if (tab === "technology-rationalisation") return <Layers className="w-10 h-10 text-white/35" />;
  return <BarChart3 className="w-10 h-10 text-white/35" />;
}

// ── Helper functions ──────────────────────────────────────────────────────

function healthColor(score: number): string {
  if (score >= 90) return "text-green-700 bg-green-100";
  if (score >= 70) return "text-amber-700 bg-amber-100";
  return "text-red-700 bg-red-100";
}

function ragColor(rag: string): string {
  if (rag === "Green") return "bg-green-500";
  if (rag === "Amber") return "bg-amber-400";
  return "bg-red-500";
}

function govScoreColor(score: number): string {
  if (score >= 85) return "text-green-700 bg-green-100";
  if (score >= 70) return "text-amber-700 bg-amber-100";
  return "text-red-700 bg-red-100";
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "Improving") return <TrendingUp className="w-3.5 h-3.5 text-green-600" />;
  if (trend === "Declining") return <TrendingDown className="w-3.5 h-3.5 text-red-600" />;
  return <Minus className="w-3.5 h-3.5 text-gray-500" />;
}

// Get card division/name/status/assetType for generic operations
function getCardMeta(card: AnyCardType, tab: PMTab) {
  switch (tab) {
    case "it-asset-portfolio": {
      const c = card as ITCard;
      const name = (c as AppCard).name || "";
      const division = (c as AppCard).division || "All Divisions";
      const assetType = (c as AppCard).assetType || "Application";
      const status = (c as AppCard).status || "On Track";
      const riskFlag = (c as AppCard).riskFlag;
      const isNoInitiative = status === "No Initiative";
      return { name, division, assetType, status, riskFlag, isNoInitiative };
    }
    case "ot-asset-portfolio": {
      const c = card as (OADCard | OTNewCard);
      const isOAD = "assetClassName" in c;
      const name = isOAD ? (c as OADCard).assetClassName : (c as OTNewCard).name;
      const division = c.division;
      const assetType = c.assetType;
      const status = c.status;
      const isNoInitiative = status === "No Initiative" || (isOAD ? (c as OADCard).cardState === "Gap" : (c as OTNewCard).cardState === "Gap");
      return { name, division, assetType, status, riskFlag: undefined, isNoInitiative };
    }
    case "data-digital-portfolio": {
      const c = card as DataDigitalCard;
      const name = c.name;
      const division = c.division;
      const assetType = c.assetType;
      const status = c.status;
      const riskFlag = (c as DataPlatformCard).riskFlag;
      const isNoInitiative = status === "No Initiative";
      return { name, division, assetType, status, riskFlag, isNoInitiative };
    }
    case "project-portfolio": {
      const c = card as ProjectCard;
      return { name: c.name, division: c.division, assetType: undefined, status: c.ragStatus, riskFlag: undefined, isNoInitiative: false };
    }
    case "transformation-initiatives": {
      const c = card as InitiativeCard;
      return { name: c.name, division: c.division, assetType: undefined, status: c.status, riskFlag: undefined, isNoInitiative: false };
    }
    case "technology-rationalisation": {
      const c = card as RationalisationCard;
      return { name: c.overlapTitle, division: c.divisionsAffected, assetType: undefined, status: c.status, riskFlag: undefined, isNoInitiative: false };
    }
    case "governance-health": {
      const c = card as GovernanceCard;
      return { name: `${c.division} — Governance`, division: c.division, assetType: undefined, status: c.trend, riskFlag: undefined, isNoInitiative: false };
    }
  }
}

type AnyCardType = ITCard | OADCard | OTNewCard | DataDigitalCard | ProjectCard | InitiativeCard | RationalisationCard | GovernanceCard;

// ── Request Report Modal ──────────────────────────────────────────────────

function RequestReportModal({
  cardTitle,
  tab,
  onClose,
  onSubmit,
}: {
  cardTitle: string;
  tab: PMTab;
  onClose: () => void;
  onSubmit: (type: string) => void;
}) {
  const [selectedType, setSelectedType] = useState("");
  const [notes, setNotes] = useState("");
  const reportTypes = PM_REPORT_TYPES[tab] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Request Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-medium">{cardTitle}</span>
        </p>
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Report Type</p>
          {reportTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                selectedType === type
                  ? "border-orange-400 bg-orange-50 text-orange-900 font-medium"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{type}</span>
                {PM_SLA_MAP[type] && (
                  <span className="text-xs text-gray-400">{PM_SLA_MAP[type]}</span>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
            Additional Context (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none"
            rows={3}
            placeholder="Any specific focus areas, audience, or deadline..."
          />
        </div>
        <div className="flex gap-2">
          <Button
            disabled={!selectedType}
            onClick={() => onSubmit(selectedType)}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
          >
            Submit Request
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Save View Popover ─────────────────────────────────────────────────────

function SaveViewPopover({
  tab,
  filters,
  onClose,
}: {
  tab: PMTab;
  filters: Record<string, string>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const handleSave = () => {
    if (!name.trim()) return;
    try {
      const key = "dtmp.portfolio.savedViews";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push({
        id: `sv-${Date.now()}`,
        name: name.trim(),
        tab,
        filters,
        createdAt: new Date().toISOString(),
        lastVisited: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}
    onClose();
  };
  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-20">
      <p className="text-xs font-semibold text-gray-700 mb-2">Name this view</p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        placeholder='e.g. "At Risk — Generation"'
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-orange-300"
      />
      <div className="flex gap-1">
        <button onClick={handleSave} className="flex-1 text-xs bg-orange-600 text-white rounded-lg py-1.5 font-medium hover:bg-orange-700">Save</button>
        <button onClick={onClose} className="flex-1 text-xs border border-gray-200 rounded-lg py-1.5 text-gray-600 hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  );
}

// ── Portfolio Health Bar ──────────────────────────────────────────────────

function PortfolioHealthBar({
  onShowNeedsAttention,
  onShowNoInitiative,
  needsAttentionActive,
  noInitiativeActive,
}: {
  onShowNeedsAttention: () => void;
  onShowNoInitiative: () => void;
  needsAttentionActive: boolean;
  noInitiativeActive: boolean;
}) {
  const allCards: { status: string }[] = [
    ...allITCards.map((c) => ({ status: (c as AppCard).status || "On Track" })),
    ...allOTCards.map((c) => ({ status: c.status })),
    ...dataDigitalCards.map((c) => ({ status: c.status })),
    ...projectCards.map((c) => ({ status: c.ragStatus === "Red" ? "Critical" : c.ragStatus === "Amber" ? "At Risk" : "On Track" })),
    ...initiativeCards.map((c) => ({ status: c.status === "At Risk" ? "At Risk" : "On Track" })),
    ...rationalisationCards.map((c) => ({ status: "On Track" })),
    ...governanceCards.map((c) => ({ status: c.trend === "Declining" ? "At Risk" : "On Track" })),
  ];

  const totalAssets = allCards.length;
  const needsAttentionCount = allCards.filter((c) => c.status === "At Risk" || c.status === "Critical").length;
  const noInitiativeCount = [
    ...allITCards.filter((c) => (c as AppCard).status === "No Initiative"),
    ...allOTCards.filter((c) => c.status === "No Initiative"),
    ...dataDigitalCards.filter((c) => c.status === "No Initiative"),
  ].length;

  const avgCompliance = Math.round(
    governanceCards.reduce((sum, c) => sum + c.architectureCompliance, 0) / Math.max(governanceCards.length, 1)
  );

  const totalRationalisationSavings = rationalisationCards.reduce((sum, c) => sum + c.savingPotentialNum, 0);
  const savingsLabel = totalRationalisationSavings >= 1000000
    ? `AED ${(totalRationalisationSavings / 1000000).toFixed(1)}M`
    : `AED ${Math.round(totalRationalisationSavings / 1000)}K`;

  const tiles = [
    {
      label: "Assets Governed",
      value: totalAssets.toString(),
      icon: <LayoutGrid className="w-5 h-5 text-blue-600" />,
      color: "text-blue-700",
      onClick: undefined,
      active: false,
    },
    {
      label: "Requiring Attention",
      value: needsAttentionCount.toString(),
      icon: <AlertTriangle className={`w-5 h-5 ${needsAttentionCount > 10 ? "text-red-500" : "text-amber-500"}`} />,
      color: needsAttentionCount > 10 ? "text-red-700" : "text-amber-700",
      onClick: onShowNeedsAttention,
      active: needsAttentionActive,
    },
    {
      label: "No Initiative",
      value: noInitiativeCount.toString(),
      icon: <AlertCircle className={`w-5 h-5 ${noInitiativeCount > 0 ? "text-orange-500" : "text-gray-400"}`} />,
      color: noInitiativeCount > 0 ? "text-orange-700" : "text-gray-600",
      onClick: onShowNoInitiative,
      active: noInitiativeActive,
    },
    {
      label: "Avg. EA Compliance",
      value: `${avgCompliance}%`,
      icon: <Shield className="w-5 h-5 text-teal-600" />,
      color: avgCompliance >= 80 ? "text-teal-700" : "text-amber-700",
      onClick: undefined,
      active: false,
    },
    {
      label: "Rationalisation Savings",
      value: savingsLabel,
      icon: <TrendingUp className="w-5 h-5 text-violet-600" />,
      color: "text-violet-700",
      onClick: undefined,
      active: false,
    },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-4 py-3 mb-4">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {tiles.map((tile) => (
          <button
            key={tile.label}
            onClick={tile.onClick}
            disabled={!tile.onClick}
            className={`flex flex-col items-center text-center p-2 rounded-lg transition-all ${
              tile.active ? "bg-orange-50 ring-1 ring-orange-300" : tile.onClick ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="mb-1">{tile.icon}</div>
            <p className={`text-xl font-bold ${tile.color}`}>{tile.value}</p>
            <p className="text-xs text-gray-500 leading-tight">{tile.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Unified Card Skeleton ─────────────────────────────────────────────────

function PMCard({
  card,
  tab,
  highlighted = false,
  onNavigate,
}: {
  card: AnyCardType;
  tab: PMTab;
  highlighted?: boolean;
  onNavigate: () => void;
}) {
  const meta = getCardMeta(card, tab);
  const divGradient = DIVISION_GRADIENT[meta.division] || "from-gray-500 to-slate-600";
  const assetType = meta.assetType;
  const isNoInit = meta.isNoInitiative;

  const statusBadge = getStatusBadge(card, tab);

  return (
    <div
      onClick={onNavigate}
      className={`bg-white rounded-xl border flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-orange-300 hover:-translate-y-1 ${
        highlighted ? "ring-2 ring-blue-300 border-blue-400 shadow-lg" : isNoInit ? "border-l-4 border-orange-500 border-t border-r border-b border-gray-200" : "border-gray-200"
      }`}
    >
      {/* Gradient header */}
      <div className={`relative bg-gradient-to-br ${divGradient} rounded-t-xl h-28 flex items-center justify-center overflow-hidden`}>
        {getCardIcon(tab, assetType)}
        {/* Asset Type badge top-left */}
        {assetType && (
          <span className="absolute top-2 left-2 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
            {assetType}
          </span>
        )}
        {/* Status badge top-right */}
        <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadge.color}`}>
          {statusBadge.label}
        </span>
        {/* No Initiative alert icon bottom-left */}
        {isNoInit && (
          <AlertCircle className="absolute bottom-2 left-3 w-5 h-5 text-white/70" />
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        {/* Division label */}
        <p className="text-xs text-gray-400">{meta.division}</p>
        {/* Card name */}
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{meta.name}</p>
        {/* Tab-specific metrics */}
        <CardMetrics card={card} tab={tab} />
        {/* No-init or risk banner */}
        {isNoInit && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded px-3 py-2 text-xs flex gap-1.5 items-start">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-orange-500" />
            <span>No active initiative. EA Office action required.</span>
          </div>
        )}
        {!isNoInit && meta.riskFlag && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded px-3 py-2 text-xs flex gap-1.5 items-start">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
            <span className="line-clamp-2">{meta.riskFlag}</span>
          </div>
        )}
        {/* Linked tags */}
        <CardTags card={card} tab={tab} />
      </div>

      {/* Footer */}
      <CardFooter card={card} tab={tab} />
    </div>
  );
}

function getStatusBadge(card: AnyCardType, tab: PMTab): { label: string; color: string } {
  if (tab === "it-asset-portfolio") {
    const c = card as ITCard;
    const status = (c as AppCard).status;
    return { label: status, color: STATUS_COLORS[status] || "bg-gray-100 text-gray-700 border-gray-200" };
  }
  if (tab === "ot-asset-portfolio") {
    const c = card as (OADCard | OTNewCard);
    return { label: c.status, color: STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700 border-gray-200" };
  }
  if (tab === "data-digital-portfolio") {
    const c = card as DataDigitalCard;
    return { label: c.status, color: STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700 border-gray-200" };
  }
  if (tab === "project-portfolio") {
    const c = card as ProjectCard;
    const color = c.ragStatus === "Green" ? "bg-teal-100 text-teal-700 border-teal-200"
      : c.ragStatus === "Amber" ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-red-100 text-red-700 border-red-200";
    return { label: c.ragStatus, color };
  }
  if (tab === "transformation-initiatives") {
    const c = card as InitiativeCard;
    const color = c.status === "Active" ? "bg-teal-100 text-teal-700 border-teal-200"
      : c.status === "Scoping" ? "bg-blue-100 text-blue-700 border-blue-200"
      : c.status === "At Risk" ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-gray-100 text-gray-700 border-gray-200";
    return { label: c.status, color };
  }
  if (tab === "technology-rationalisation") {
    const c = card as RationalisationCard;
    const color = c.status === "Initiative Active" ? "bg-teal-100 text-teal-700 border-teal-200"
      : c.status === "Under Analysis" ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-gray-100 text-gray-700 border-gray-200";
    return { label: c.status, color };
  }
  if (tab === "governance-health") {
    const c = card as GovernanceCard;
    const color = c.trend === "Improving" ? "bg-teal-100 text-teal-700 border-teal-200"
      : c.trend === "Declining" ? "bg-red-100 text-red-700 border-red-200"
      : "bg-gray-100 text-gray-700 border-gray-200";
    return { label: c.trend, color };
  }
  return { label: "—", color: "bg-gray-100 text-gray-700 border-gray-200" };
}

function CardMetrics({ card, tab }: { card: AnyCardType; tab: PMTab }) {
  if (tab === "it-asset-portfolio") {
    const assetType = (card as AppCard).assetType;
    if (assetType === "Application") {
      const c = card as AppCard;
      return (
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div><p className="text-gray-400">Health</p><p className={`font-bold ${c.healthScore >= 80 ? "text-green-700" : c.healthScore >= 65 ? "text-amber-700" : "text-red-700"}`}>{c.healthScore}%</p></div>
          <div><p className="text-gray-400">Debt</p><p className="font-semibold text-gray-800">{c.technicalDebt}</p></div>
          <div><p className="text-gray-400">Stage</p><p className="font-semibold text-gray-800">{c.lifecycleStage}</p></div>
          <div><p className="text-gray-400">TCO</p><p className="font-semibold text-gray-800">{c.annualTCO}</p></div>
        </div>
      );
    }
    if (assetType === "Infrastructure & Cloud") {
      const c = card as InfrastructureCard;
      return (
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div><p className="text-gray-400">Health</p><p className={`font-bold ${c.healthScore >= 80 ? "text-green-700" : c.healthScore >= 65 ? "text-amber-700" : "text-red-700"}`}>{c.healthScore}%</p></div>
          <div><p className="text-gray-400">Provider</p><p className="font-semibold text-gray-800 truncate">{c.cloudProvider}</p></div>
          <div><p className="text-gray-400">Cost</p><p className="font-semibold text-gray-800">{c.annualCost}</p></div>
          <div><p className="text-gray-400">Redundancy</p><p className="font-semibold text-gray-800 truncate">{c.redundancyStatus}</p></div>
        </div>
      );
    }
    if (assetType === "Integration Platform") {
      const c = card as IntegrationCard;
      return (
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div><p className="text-gray-400">Health</p><p className={`font-bold ${c.healthScore >= 80 ? "text-green-700" : c.healthScore >= 65 ? "text-amber-700" : "text-red-700"}`}>{c.healthScore}%</p></div>
          <div><p className="text-gray-400">Uptime</p><p className="font-bold text-gray-800">{c.uptimePercent}%</p></div>
          <div><p className="text-gray-400">Systems</p><p className="font-semibold text-gray-800">{c.connectedSystemsCount}</p></div>
          <div><p className="text-gray-400">Cost</p><p className="font-semibold text-gray-800">{c.annualCost}</p></div>
        </div>
      );
    }
    if (assetType === "Security & Identity") {
      const c = card as SecurityCard;
      return (
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div><p className="text-gray-400">Compliance</p><p className={`font-bold ${c.complianceScore >= 85 ? "text-green-700" : c.complianceScore >= 70 ? "text-amber-700" : "text-red-700"}`}>{c.complianceScore}%</p></div>
          <div><p className="text-gray-400">Vulnerabilities</p><p className={`font-bold ${c.openVulnerabilities > 0 ? "text-red-700" : "text-green-700"}`}>{c.openVulnerabilities} open</p></div>
          <div><p className="text-gray-400">Frameworks</p><p className="font-semibold text-gray-800 truncate">{c.frameworkCoverage.join(", ")}</p></div>
          <div><p className="text-gray-400">Last Audit</p><p className="font-semibold text-gray-800">{c.lastAuditDate}</p></div>
        </div>
      );
    }
  }

  if (tab === "ot-asset-portfolio") {
    const isOAD = "assetClassName" in card;
    const pct = isOAD ? (card as OADCard).digitisedPercentage : (card as OTNewCard).digitisedPercentage;
    const condition = isOAD ? (card as OADCard).assetCondition : (card as OTNewCard).assetCondition;
    const connectivity = isOAD ? (card as OADCard).connectivityStatus : (card as OTNewCard).connectivityStatus;
    return (
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Digitised</span>
          <span className={`font-bold ${pct >= 80 ? "text-green-700" : pct >= 50 ? "text-amber-700" : "text-red-700"}`}>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {condition && <div><p className="text-gray-400">Condition</p><p className="font-semibold text-gray-800">{condition}</p></div>}
          {connectivity && <div><p className="text-gray-400">Connectivity</p><p className="font-semibold text-gray-800 truncate">{connectivity}</p></div>}
        </div>
      </div>
    );
  }

  if (tab === "data-digital-portfolio") {
    const assetType = (card as DataDigitalCard).assetType;
    if (assetType === "Data Platform") {
      const c = card as DataPlatformCard;
      return (
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div><p className="text-gray-400">Health</p><p className={`font-bold ${c.healthScore >= 80 ? "text-green-700" : "text-amber-700"}`}>{c.healthScore}%</p></div>
          <div><p className="text-gray-400">Quality</p><p className={`font-bold ${c.dataQualityScore >= 80 ? "text-green-700" : "text-amber-700"}`}>{c.dataQualityScore}%</p></div>
          <div><p className="text-gray-400">Volume</p><p className="font-semibold text-gray-800">{c.dataVolumeTB.toLocaleString()} TB</p></div>
          <div><p className="text-gray-400">Pipelines</p><p className="font-semibold text-gray-800">{c.activePipelines}</p></div>
        </div>
      );
    }
    if (assetType === "AI & ML Model") {
      const c = card as AIModelCard;
      return (
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div><p className="text-gray-400">Accuracy</p><p className={`font-bold ${c.modelAccuracy >= 85 ? "text-green-700" : "text-amber-700"}`}>{c.modelAccuracy}%</p></div>
          <div><p className="text-gray-400">Status</p><p className="font-semibold text-gray-800">{c.modelStatus}</p></div>
          <div><p className="text-gray-400">Bias Review</p><p className={`font-semibold ${c.biasReview === "Passed" ? "text-green-700" : "text-amber-700"}`}>{c.biasReview}</p></div>
          <div><p className="text-gray-400">Freshness</p><p className="font-semibold text-gray-800 truncate">{c.trainingDataFreshness}</p></div>
        </div>
      );
    }
    if (assetType === "Digital Customer Product") {
      const c = card as DigitalProductCard;
      return (
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div><p className="text-gray-400">Health</p><p className={`font-bold ${c.healthScore >= 80 ? "text-green-700" : "text-amber-700"}`}>{c.healthScore}%</p></div>
          <div><p className="text-gray-400">CSAT</p><p className={`font-bold ${c.csatScore >= 4.0 ? "text-green-700" : "text-amber-700"}`}>{c.csatScore}/5.0</p></div>
          <div><p className="text-gray-400">MAU</p><p className="font-semibold text-gray-800">{c.monthlyActiveUsers >= 1000000 ? `${(c.monthlyActiveUsers / 1000000).toFixed(1)}M` : `${Math.round(c.monthlyActiveUsers / 1000)}K`}</p></div>
          <div><p className="text-gray-400">Accessibility</p><p className={`font-semibold ${c.accessibilityCompliance === "Passed" ? "text-green-700" : c.accessibilityCompliance === "Partial" ? "text-amber-700" : "text-red-700"}`}>{c.accessibilityCompliance}</p></div>
        </div>
      );
    }
    if (assetType === "External API") {
      const c = card as ExternalAPICard;
      return (
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div><p className="text-gray-400">Uptime</p><p className={`font-bold ${c.uptimePercent >= 99 ? "text-green-700" : "text-amber-700"}`}>{c.uptimePercent}%</p></div>
          <div><p className="text-gray-400">Consumers</p><p className="font-semibold text-gray-800">{c.activeConsumers}</p></div>
          <div><p className="text-gray-400">Type</p><p className="font-semibold text-gray-800">{c.apiType}</p></div>
          {c.deprecationDate && <div><p className="text-gray-400">Deprecation</p><p className="font-semibold text-red-700">{c.deprecationDate}</p></div>}
        </div>
      );
    }
  }

  if (tab === "project-portfolio") {
    const c = card as ProjectCard;
    return (
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${c.ragStatus === "Green" ? "bg-green-500" : c.ragStatus === "Amber" ? "bg-amber-400" : "bg-red-500"}`} />
          <span className="text-gray-700 font-medium truncate">{c.ragLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${c.progress}%` }} />
          </div>
          <span className="font-bold text-gray-900">{c.progress}%</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div><p className="text-gray-400">Budget</p><p className={`font-semibold ${c.budgetHealth === "On Track" ? "text-green-700" : "text-red-700"}`}>{c.budgetHealth}</p></div>
          <div><p className="text-gray-400">EA Alignment</p><p className="font-semibold text-gray-800">{c.eaAlignment}%</p></div>
        </div>
      </div>
    );
  }

  if (tab === "transformation-initiatives") {
    const c = card as InitiativeCard;
    return (
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <div><p className="text-gray-400">EA Score</p><p className={`font-bold ${c.eaAlignmentScore >= 80 ? "text-green-700" : "text-amber-700"}`}>{c.eaAlignmentScore}%</p></div>
        <div><p className="text-gray-400">Projects</p><p className="font-semibold text-gray-800">{c.projectsCount}</p></div>
        <div><p className="text-gray-400">Budget</p><p className="font-semibold text-gray-800">{c.programmeBudget}</p></div>
        <div><p className="text-gray-400">Target</p><p className="font-semibold text-gray-800">{c.targetCompletion}</p></div>
      </div>
    );
  }

  if (tab === "technology-rationalisation") {
    const c = card as RationalisationCard;
    return (
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <div><p className="text-gray-400">Annual Cost</p><p className="font-bold text-red-700">{c.annualOverlapCost}</p></div>
        <div><p className="text-gray-400">Saving</p><p className="font-bold text-green-700">{c.savingPotential}</p></div>
        <div><p className="text-gray-400">Action</p><p className="font-semibold text-gray-800">{c.recommendation}</p></div>
        <div><p className="text-gray-400">Complexity</p><p className="font-semibold text-gray-800">{c.complexity}</p></div>
      </div>
    );
  }

  if (tab === "governance-health") {
    const c = card as GovernanceCard;
    return (
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <div><p className="text-gray-400">Gov. Score</p><p className={`font-bold ${govScoreColor(c.overallGovernanceScore).split(" ")[0]}`}>{c.overallGovernanceScore}%</p></div>
        <div><p className="text-gray-400">Trend</p><div className="flex items-center gap-1"><TrendIcon trend={c.trend} /><span className="font-semibold text-gray-800">{c.trend}</span></div></div>
        <div><p className="text-gray-400">EA Maturity</p><p className="font-semibold text-gray-800">{c.eaMaturityScore}/5</p></div>
        <div><p className="text-gray-400">Violations</p><p className={`font-bold ${c.criticalViolations > 0 ? "text-red-700" : "text-green-700"}`}>{c.criticalViolations}</p></div>
      </div>
    );
  }

  return null;
}

function CardTags({ card, tab }: { card: AnyCardType; tab: PMTab }) {
  const tags: string[] = [];
  if (tab === "it-asset-portfolio") {
    const ini = (card as AppCard).initiativeTag;
    const proj = (card as AppCard).projectTag;
    if (proj) tags.push(proj);
    if (ini) tags.push(ini);
  } else if (tab === "ot-asset-portfolio") {
    const ini = "initiativeTag" in card ? (card as OADCard).initiativeTag : undefined;
    const proj = "projectTag" in card ? (card as OADCard).projectTag : undefined;
    if (proj) tags.push(proj);
    if (ini) tags.push(ini);
  } else if (tab === "data-digital-portfolio") {
    const ini = (card as DataDigitalCard).initiativeTag;
    if (ini) tags.push(ini);
  } else if (tab === "project-portfolio") {
    tags.push((card as ProjectCard).parentInitiative);
  } else if (tab === "technology-rationalisation") {
    const ini = (card as RationalisationCard).initiativeTag;
    if (ini) tags.push(ini);
  }
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {tags.map((t) => (
        <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{t}</span>
      ))}
    </div>
  );
}

function CardFooter({ card, tab }: { card: AnyCardType; tab: PMTab }) {
  let left = "";
  let right = "";

  if (tab === "it-asset-portfolio") {
    const assetType = (card as AppCard).assetType;
    if (assetType === "Application") {
      const c = card as AppCard;
      left = `Health ${c.healthScore}%`;
      right = c.lifecycleStage;
    } else if (assetType === "Infrastructure & Cloud") {
      const c = card as InfrastructureCard;
      left = `Health ${c.healthScore}%`;
      right = `Renews ${c.contractRenewalDate}`;
    } else if (assetType === "Integration Platform") {
      const c = card as IntegrationCard;
      left = `Health ${c.healthScore}%`;
      right = `${c.connectedSystemsCount} systems`;
    } else if (assetType === "Security & Identity") {
      const c = card as SecurityCard;
      left = `Compliance ${c.complianceScore}%`;
      right = `${c.openVulnerabilities} vulnerabilities`;
    }
  } else if (tab === "ot-asset-portfolio") {
    const isOAD = "assetClassName" in card;
    const pct = isOAD ? (card as OADCard).digitisedPercentage : (card as OTNewCard).digitisedPercentage;
    const digitised = isOAD ? (card as OADCard).digitisedCount : (card as OTNewCard).digitisedCount;
    const total = isOAD ? (card as OADCard).totalAssets : (card as OTNewCard).totalAssets;
    const remaining = isOAD ? (card as OADCard).remainingCount : `${(card as OTNewCard).totalAssets - (card as OTNewCard).digitisedCount} remaining`;
    left = `${pct}% digitised`;
    right = isOAD ? `${remaining} remaining` : `${remaining}`;
  } else if (tab === "data-digital-portfolio") {
    const assetType = (card as DataDigitalCard).assetType;
    if (assetType === "Data Platform") {
      const c = card as DataPlatformCard;
      left = `Health ${c.healthScore}%`;
      right = `Quality ${c.dataQualityScore}%`;
    } else if (assetType === "AI & ML Model") {
      const c = card as AIModelCard;
      left = `Accuracy ${c.modelAccuracy}%`;
      right = `Retrained ${c.lastRetrained}`;
    } else if (assetType === "Digital Customer Product") {
      const c = card as DigitalProductCard;
      left = `CSAT ${c.csatScore}/5.0`;
      right = c.monthlyActiveUsers >= 1000000 ? `${(c.monthlyActiveUsers / 1000000).toFixed(1)}M users` : `${Math.round(c.monthlyActiveUsers / 1000)}K users`;
    } else if (assetType === "External API") {
      const c = card as ExternalAPICard;
      left = `Uptime ${c.uptimePercent}%`;
      right = `${c.activeConsumers} consumers`;
    }
  } else if (tab === "project-portfolio") {
    const c = card as ProjectCard;
    left = `${c.progress}% complete`;
    right = `EA ${c.eaAlignment}%`;
  } else if (tab === "transformation-initiatives") {
    const c = card as InitiativeCard;
    left = `EA ${c.eaAlignmentScore}%`;
    right = c.targetCompletion;
  } else if (tab === "technology-rationalisation") {
    const c = card as RationalisationCard;
    left = `Save ${c.savingPotential}`;
    right = `Complexity: ${c.complexity}`;
  } else if (tab === "governance-health") {
    const c = card as GovernanceCard;
    left = `Score ${c.overallGovernanceScore}%`;
    right = c.trendPercent || c.trend;
  }

  if (!left && !right) return null;
  return (
    <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
      <span className="text-xs font-semibold text-gray-700">{left}</span>
      <span className="text-xs text-gray-500">{right}</span>
    </div>
  );
}

// ── Cross-tab Attention View ───────────────────────────────────────────────

function AttentionView({
  noInitiativeOnly,
  navigate,
}: {
  noInitiativeOnly: boolean;
  navigate: (path: string) => void;
}) {
  const tabGroups: { tab: PMTab; label: string; cards: AnyCardType[] }[] = [
    {
      tab: "it-asset-portfolio",
      label: "IT Assets",
      cards: allITCards.filter((c) => {
        const status = (c as AppCard).status;
        if (noInitiativeOnly) return status === "No Initiative";
        return status === "At Risk" || status === "Critical" || status === "No Initiative";
      }),
    },
    {
      tab: "ot-asset-portfolio",
      label: "OT Assets",
      cards: allOTCards.filter((c) => {
        if (noInitiativeOnly) return c.status === "No Initiative";
        const isGap = "cardState" in c && (c as OADCard).cardState === "Gap";
        return c.status === "At Risk" || c.status === "Critical" || c.status === "No Initiative" || isGap;
      }),
    },
    {
      tab: "data-digital-portfolio",
      label: "Data & Digital",
      cards: dataDigitalCards.filter((c) => {
        if (noInitiativeOnly) return c.status === "No Initiative";
        return c.status === "At Risk" || c.status === "Critical" || c.status === "No Initiative";
      }),
    },
    {
      tab: "project-portfolio",
      label: "Projects",
      cards: noInitiativeOnly ? [] : projectCards.filter((c) => c.ragStatus === "Red"),
    },
  ];

  const hasAny = tabGroups.some((g) => g.cards.length > 0);

  return (
    <div className="space-y-6">
      {!hasAny && (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" />
          <p className="text-sm">No items require attention at this time.</p>
        </div>
      )}
      {tabGroups.filter((g) => g.cards.length > 0).map((group) => (
        <div key={group.tab}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>{group.label}</span>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{group.cards.length}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {group.cards.map((card) => (
              <PMCard
                key={(card as { id: string }).id}
                card={card}
                tab={group.tab}
                onNavigate={() => navigate(`/marketplaces/portfolio-management/${group.tab}/${(card as { id: string }).id}`)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Global Search View ────────────────────────────────────────────────────

function GlobalSearchView({ query, navigate }: { query: string; navigate: (path: string) => void }) {
  const q = query.toLowerCase();

  function matchCard(card: AnyCardType, tab: PMTab): boolean {
    const meta = getCardMeta(card, tab);
    const searchable = [
      meta.name, meta.division, meta.assetType, meta.status, meta.riskFlag,
      "initiativeTag" in card ? (card as AppCard).initiativeTag : undefined,
      "projectTag" in card ? (card as AppCard).projectTag : undefined,
      "parentInitiative" in card ? (card as ProjectCard).parentInitiative : undefined,
    ].filter(Boolean).join(" ").toLowerCase();
    return searchable.includes(q);
  }

  const groups: { tab: PMTab; label: string; cards: AnyCardType[] }[] = [
    { tab: "it-asset-portfolio", label: "IT Assets", cards: allITCards.filter((c) => matchCard(c, "it-asset-portfolio")) },
    { tab: "ot-asset-portfolio", label: "OT Assets", cards: allOTCards.filter((c) => matchCard(c, "ot-asset-portfolio")) },
    { tab: "data-digital-portfolio", label: "Data & Digital", cards: dataDigitalCards.filter((c) => matchCard(c, "data-digital-portfolio")) },
    { tab: "project-portfolio", label: "Projects", cards: projectCards.filter((c) => matchCard(c, "project-portfolio")) },
    { tab: "transformation-initiatives", label: "Initiatives", cards: initiativeCards.filter((c) => matchCard(c, "transformation-initiatives")) },
    { tab: "technology-rationalisation", label: "Rationalisation", cards: rationalisationCards.filter((c) => matchCard(c, "technology-rationalisation")) },
    { tab: "governance-health", label: "Governance", cards: governanceCards.filter((c) => matchCard(c, "governance-health")) },
  ];

  const totalResults = groups.reduce((s, g) => s + g.cards.length, 0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">{totalResults} result{totalResults !== 1 ? "s" : ""} across all portfolio views for "<strong>{query}</strong>"</p>
      {groups.filter((g) => g.cards.length > 0).map((group) => (
        <div key={group.tab}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            {group.label}
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{group.cards.length}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {group.cards.map((card) => (
              <PMCard
                key={(card as { id: string }).id}
                card={card}
                tab={group.tab}
                onNavigate={() => navigate(`/marketplaces/portfolio-management/${group.tab}/${(card as { id: string }).id}`)}
              />
            ))}
          </div>
        </div>
      ))}
      {totalResults === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function PortfolioManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<PMTab>("it-asset-portfolio");
  const [highlightCardId, setHighlightCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("All Divisions");
  const [statusFilter, setStatusFilter] = useState("All");
  const [hasInitiativeFilter, setHasInitiativeFilter] = useState("All");
  const [needsAttentionMode, setNeedsAttentionMode] = useState(false);
  const [noInitiativeMode, setNoInitiativeMode] = useState(false);
  const [showSaveView, setShowSaveView] = useState(false);
  const [reportCard, setReportCard] = useState<{ card: AnyCardType; title: string; tab: PMTab } | null>(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [sessionRole, setSessionRole] = useState<PMRole | null>(() => getSessionPMRole());

  // Restore filters / tab from router state (Saved Views)
  useEffect(() => {
    const state = location.state as {
      tab?: string;
      highlightCardId?: string;
      restoreFilters?: Record<string, string>;
    } | null;
    if (!state) return;
    if (state.tab) setActiveTab(state.tab as PMTab);
    if (state.highlightCardId) {
      setHighlightCardId(state.highlightCardId);
      setTimeout(() => setHighlightCardId(null), 3000);
    }
    if (state.restoreFilters) {
      if (state.restoreFilters.division) setDivisionFilter(state.restoreFilters.division);
      if (state.restoreFilters.status) setStatusFilter(state.restoreFilters.status);
      if (state.restoreFilters.hasInitiative) setHasInitiativeFilter(state.restoreFilters.hasInitiative);
    }
    window.history.replaceState({}, "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Merge in published Stage 3 content cards
  const allRationalisationCards = useMemo(() => {
    const published = getPublishedContentCards();
    const fromStage3 = published.filter((c) => c.type === "rationalisation").map(mapContentCardToRationalisationCard);
    return [...rationalisationCards, ...fromStage3];
  }, []);

  const allOTCardsMerged = useMemo(() => {
    const published = getPublishedContentCards();
    const fromStage3 = published.filter((c) => c.type === "ot-asset").map(mapContentCardToOTCard);
    return [...allOTCards, ...fromStage3];
  }, []);

  const divisions: string[] = [
    "All Divisions", "Generation", "Transmission", "Distribution",
    "Water Services", "Customer Services", "Digital DEWA & Moro Hub", "Corporate EA Office",
  ];

  const tabStatusOptions: Record<PMTab, string[]> = {
    "it-asset-portfolio": ["All", "On Track", "At Risk", "Critical", "No Initiative"],
    "ot-asset-portfolio": ["All", "On Track", "At Risk", "No Initiative", "Completed"],
    "data-digital-portfolio": ["All", "On Track", "At Risk", "Critical", "No Initiative"],
    "project-portfolio": ["All", "Green", "Amber", "Red"],
    "transformation-initiatives": ["All", "Active", "Scoping", "At Risk", "Completed"],
    "technology-rationalisation": ["All", "Identified", "Under Analysis", "Initiative Active", "Resolved"],
    "governance-health": ["All", "Improving", "Stable", "Declining"],
  };

  const filteredCards = useMemo((): AnyCardType[] => {
    let cards: AnyCardType[] = [];
    if (activeTab === "it-asset-portfolio") cards = allITCards;
    else if (activeTab === "ot-asset-portfolio") cards = allOTCardsMerged;
    else if (activeTab === "data-digital-portfolio") cards = dataDigitalCards;
    else if (activeTab === "project-portfolio") cards = projectCards;
    else if (activeTab === "transformation-initiatives") cards = initiativeCards;
    else if (activeTab === "technology-rationalisation") cards = allRationalisationCards;
    else if (activeTab === "governance-health") cards = governanceCards;

    return cards.filter((c) => {
      const meta = getCardMeta(c, activeTab);

      // Division filter
      if (divisionFilter !== "All Divisions") {
        if (meta.division !== divisionFilter && meta.division !== "All Divisions") return false;
      }

      // Status filter
      if (statusFilter !== "All") {
        if (activeTab === "project-portfolio") {
          if ((c as ProjectCard).ragStatus !== statusFilter) return false;
        } else if (activeTab === "governance-health") {
          if ((c as GovernanceCard).trend !== statusFilter) return false;
        } else {
          if (meta.status !== statusFilter) return false;
        }
      }

      // Has initiative filter
      if (hasInitiativeFilter === "Yes") {
        const ini = "initiativeTag" in c ? (c as AppCard).initiativeTag : undefined;
        if (!ini) return false;
      } else if (hasInitiativeFilter === "No") {
        const ini = "initiativeTag" in c ? (c as AppCard).initiativeTag : undefined;
        if (ini) return false;
      }

      return true;
    });
  }, [activeTab, divisionFilter, statusFilter, hasInitiativeFilter, allRationalisationCards, allOTCardsMerged]);

  const tabCfg = PM_TAB_CONFIG[activeTab];
  const assetEstabTabs: PMTab[] = ["it-asset-portfolio", "ot-asset-portfolio", "data-digital-portfolio"];
  const govTabs: PMTab[] = ["project-portfolio", "transformation-initiatives", "technology-rationalisation", "governance-health"];

  const hasActiveFilter = divisionFilter !== "All Divisions" || statusFilter !== "All" || hasInitiativeFilter !== "All";
  const isGlobalSearch = searchQuery.trim().length > 2;
  const isSpecialView = needsAttentionMode || noInitiativeMode;

  const handleChangeRole = () => {
    clearSessionPMRole();
    setSessionRole(null);
  };

  const handleRoleSelect = (role: PMRole) => {
    setSessionPMRole(role);
    setSessionRole(role);
  };

  const handleReportSubmit = (_type: string) => {
    setReportCard(null);
    setReportSubmitted(true);
    setTimeout(() => setReportSubmitted(false), 4000);
    navigate("/stage2/portfolio-management", { state: { cardId: "my-requests" } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-50 to-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-3 py-1 rounded-full uppercase tracking-wide">DRIVE Phase</span>
                <span className="text-xs text-gray-400">Portfolio Management</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio Management</h1>
              <p className="text-gray-600 max-w-2xl text-sm leading-relaxed">
                A single, continuously updated view of DEWA's entire digital estate — applications, infrastructure, operational assets, data platforms, and AI models — under one governance lens. Three dimensions of DEWA's estate. One control tower.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-6">
                {[
                  { label: "Portfolio Views", value: "8" },
                  { label: "EA Office Governed", value: "✓" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Viewing as indicator */}
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                {sessionRole ? (
                  <>
                    <span className="font-medium text-gray-700">Viewing as: {sessionRole}</span>
                    <span>·</span>
                    <button onClick={handleChangeRole} className="text-orange-600 hover:text-orange-800 underline">Change</button>
                  </>
                ) : (
                  <span className="text-gray-400 italic">No role selected — set on detail page</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar with two-tier grouping */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section labels */}
          <div className="flex items-end pt-2 gap-0">
            <div className="flex items-end gap-0">
              <span className="text-xs font-semibold tracking-widest uppercase text-gray-400 pb-1 pr-2 whitespace-nowrap">Asset Estate</span>
              {assetEstabTabs.map((tabKey) => {
                const cfg = PM_TAB_CONFIG[tabKey];
                return (
                  <button
                    key={tabKey}
                    onClick={() => { setActiveTab(tabKey); setStatusFilter("All"); setNeedsAttentionMode(false); setNoInitiativeMode(false); setSearchQuery(""); }}
                    className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tabKey
                        ? `${cfg.tabColor} text-gray-900`
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {cfg.shortLabel}
                  </button>
                );
              })}
            </div>
            {/* Vertical separator */}
            <div className="border-r border-gray-300 h-6 mx-2 self-center" />
            <div className="flex items-end gap-0">
              <span className="text-xs font-semibold tracking-widest uppercase text-gray-400 pb-1 pr-2 whitespace-nowrap">Governance Intelligence</span>
              {govTabs.map((tabKey) => {
                const cfg = PM_TAB_CONFIG[tabKey];
                return (
                  <button
                    key={tabKey}
                    onClick={() => { setActiveTab(tabKey); setStatusFilter("All"); setNeedsAttentionMode(false); setNoInitiativeMode(false); setSearchQuery(""); }}
                    className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tabKey
                        ? `${cfg.tabColor} text-gray-900`
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {cfg.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Portfolio Health Bar */}
        <PortfolioHealthBar
          onShowNeedsAttention={() => { setNeedsAttentionMode((v) => !v); setNoInitiativeMode(false); }}
          onShowNoInitiative={() => { setNoInitiativeMode((v) => !v); setNeedsAttentionMode(false); }}
          needsAttentionActive={needsAttentionMode}
          noInitiativeActive={noInitiativeMode}
        />

        {/* Global Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all 8 portfolio views..."
            className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Special view exit banner */}
        {isSpecialView && (
          <div className="mb-4 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-sm text-orange-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{noInitiativeMode ? "Showing all assets with No Active Initiative across all tabs." : "Showing all assets requiring attention (At Risk, Critical, No Initiative) across all tabs."}</span>
            <button
              onClick={() => { setNeedsAttentionMode(false); setNoInitiativeMode(false); }}
              className="ml-auto text-xs font-medium underline hover:no-underline"
            >
              Exit view
            </button>
          </div>
        )}

        {/* Content area */}
        {isGlobalSearch ? (
          <GlobalSearchView query={searchQuery.trim()} navigate={navigate} />
        ) : isSpecialView ? (
          <AttentionView noInitiativeOnly={noInitiativeMode} navigate={navigate} />
        ) : (
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="w-56 flex-shrink-0 hidden lg:block">
              <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-20 relative">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filters</p>

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-1.5">Division</p>
                  <select
                    value={divisionFilter}
                    onChange={(e) => setDivisionFilter(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                  >
                    {divisions.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-1.5">
                    {activeTab === "project-portfolio" ? "RAG Status" : activeTab === "governance-health" ? "Trend" : "Status"}
                  </p>
                  <div className="space-y-1">
                    {tabStatusOptions[activeTab].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors ${statusFilter === s ? "bg-orange-100 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {["it-asset-portfolio", "ot-asset-portfolio", "data-digital-portfolio", "technology-rationalisation"].includes(activeTab) && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-1.5">Has Active Initiative</p>
                    <div className="space-y-1">
                      {["All", "Yes", "No"].map((v) => (
                        <button
                          key={v}
                          onClick={() => setHasInitiativeFilter(v)}
                          className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors ${hasInitiativeFilter === v ? "bg-orange-100 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hasActiveFilter && (
                  <button
                    onClick={() => { setDivisionFilter("All Divisions"); setStatusFilter("All"); setHasInitiativeFilter("All"); }}
                    className="text-xs text-orange-600 hover:text-orange-800 font-medium mb-3 block"
                  >
                    Clear filters
                  </button>
                )}

                {/* Save view */}
                {hasActiveFilter && (
                  <div className="relative mt-1">
                    <button
                      onClick={() => setShowSaveView((v) => !v)}
                      className="w-full text-left text-xs px-2 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 flex items-center gap-1.5"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      Save this view
                    </button>
                    {showSaveView && (
                      <SaveViewPopover
                        tab={activeTab}
                        filters={{ division: divisionFilter, status: statusFilter, hasInitiative: hasInitiativeFilter }}
                        onClose={() => setShowSaveView(false)}
                      />
                    )}
                  </div>
                )}
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Tab description */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-semibold text-gray-900">{tabCfg.label}</h2>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {filteredCards.length} result{filteredCards.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{tabCfg.description}</p>
              </div>

              {/* Card grid */}
              {filteredCards.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No results match your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCards.map((card) => (
                    <PMCard
                      key={(card as { id: string }).id}
                      card={card}
                      tab={activeTab}
                      highlighted={(card as { id: string }).id === highlightCardId}
                      onNavigate={() => navigate(`/marketplaces/portfolio-management/${activeTab}/${(card as { id: string }).id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Report modal portal */}
      {reportCard &&
        createPortal(
          <RequestReportModal
            cardTitle={reportCard.title}
            tab={reportCard.tab}
            onClose={() => setReportCard(null)}
            onSubmit={handleReportSubmit}
          />,
          document.body
        )}
      {reportSubmitted &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Report request submitted — navigating to My Requests
          </div>,
          document.body
        )}
    </div>
  );
}
