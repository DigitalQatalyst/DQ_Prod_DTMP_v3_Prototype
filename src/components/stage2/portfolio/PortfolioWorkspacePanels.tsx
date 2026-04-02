import { Activity, DollarSign, Target, TrendingUp, AlertTriangle, Shield, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PortfolioHealthDashboard from "@/components/portfolio/PortfolioHealthDashboard";
import {
  rationalisationCards,
  allITCards,
  type AppCard,
} from "@/data/portfolioManagement";

interface PortfolioSubService {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PortfolioWorkspaceSidebarProps {
  portfolioSubServices: PortfolioSubService[];
  activeSubService: string | null;
  onSelectSubService: (subServiceId: string) => void;
}

export function PortfolioWorkspaceSidebar({
  portfolioSubServices,
  activeSubService,
  onSelectSubService,
}: PortfolioWorkspaceSidebarProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Portfolio Tools</h3>
        <div className="space-y-2">
          {portfolioSubServices.map((subService) => {
            const Icon = subService.icon;
            return (
              <button
                key={subService.id}
                onClick={() => onSelectSubService(subService.id)}
                className={`w-full flex items-start gap-3 p-3 text-sm rounded-lg transition-colors ${
                  activeSubService === subService.id
                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                    : "text-gray-700 hover:bg-gray-50 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{subService.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{subService.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface PortfolioWorkspaceMainProps {
  activeSubService: string;
  portfolioSubServices: PortfolioSubService[];
}

export function PortfolioWorkspaceMain({
  activeSubService,
  portfolioSubServices,
}: PortfolioWorkspaceMainProps) {
  const navigate = useNavigate();

  // Compute real rationalisation metrics
  const totalOverlapCost = rationalisationCards.reduce((s, c) => s + c.annualOverlapCostNum, 0);
  const totalSavings = rationalisationCards.reduce((s, c) => s + c.savingPotentialNum, 0);
  const overlapCount = rationalisationCards.length;
  const overlapLabel = totalOverlapCost >= 1000000 ? `AED ${(totalOverlapCost / 1000000).toFixed(1)}M` : `AED ${Math.round(totalOverlapCost / 1000)}K`;
  const savingsLabel = totalSavings >= 1000000 ? `AED ${(totalSavings / 1000000).toFixed(1)}M` : `AED ${Math.round(totalSavings / 1000)}K`;

  // Compute real IT health metrics
  const appCards = allITCards.filter((c) => (c as AppCard).assetType === "Application") as AppCard[];
  const avgHealth = Math.round(appCards.reduce((s, c) => s + c.healthScore, 0) / Math.max(appCards.length, 1));
  const atRiskIT = allITCards.filter((c) => (c as AppCard).status === "At Risk" || (c as AppCard).status === "Critical").length;
  const noInitIT = allITCards.filter((c) => (c as AppCard).status === "No Initiative").length;

  return (
    <div className="h-full">
      {activeSubService === "portfolio-health-dashboard" && (
        <PortfolioHealthDashboard className="h-full" />
      )}

      {activeSubService === "application-rationalization" && (
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Technology Rationalisation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Identified Overlaps</h3>
                </div>
                <p className="text-2xl font-bold text-amber-900">{overlapCount}</p>
                <p className="text-sm text-amber-700">Technology duplication opportunities</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">Annual Overlap Cost</h3>
                </div>
                <p className="text-2xl font-bold text-red-900">{overlapLabel}</p>
                <p className="text-sm text-red-700">Total cost of identified duplication</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Savings Potential</h3>
                </div>
                <p className="text-2xl font-bold text-green-900">{savingsLabel}</p>
                <p className="text-sm text-green-700">Estimated annual savings if resolved</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{overlapLabel}</strong> in total rationalisation opportunity across <strong>{overlapCount}</strong> identified overlaps.
            </p>
            <button
              onClick={() => navigate("/marketplaces/portfolio-management", { state: { tab: "technology-rationalisation" } })}
              className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-800 font-medium"
            >
              View full rationalisation tab <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {activeSubService === "tco-optimization" && (
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">IT Asset Health Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Average Health</h3>
                </div>
                <p className="text-2xl font-bold text-blue-900">{avgHealth}%</p>
                <p className="text-sm text-blue-700">Across IT asset portfolio</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Assets at Risk</h3>
                </div>
                <p className="text-2xl font-bold text-amber-900">{atRiskIT}</p>
                <p className="text-sm text-amber-700">At Risk or Critical</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">Need Initiative</h3>
                </div>
                <p className="text-2xl font-bold text-orange-900">{noInitIT}</p>
                <p className="text-sm text-orange-700">No active initiative</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Average health <strong>{avgHealth}%</strong> · <strong>{atRiskIT}</strong> assets at risk · <strong>{noInitIT}</strong> need initiative
            </p>
            <button
              onClick={() => navigate("/marketplaces/portfolio-management", { state: { tab: "it-asset-portfolio" } })}
              className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-800 font-medium"
            >
              View IT asset portfolio <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {!["portfolio-health-dashboard", "application-rationalization", "tco-optimization"].includes(
        activeSubService
      ) && (
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {portfolioSubServices.find((s) => s.id === activeSubService)?.name}
              </h3>
              <p className="text-gray-500">
                {portfolioSubServices.find((s) => s.id === activeSubService)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
