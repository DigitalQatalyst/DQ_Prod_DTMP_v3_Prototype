import { Activity, DollarSign, Target, TrendingUp, BarChart3, FileText, Cloud, Users } from "lucide-react";
import PortfolioHealthDashboard from "@/components/portfolio/PortfolioHealthDashboard";

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
                className={`w-full flex items-start gap-3 p-3 text-sm rounded-lg transition-colors ${activeSubService === subService.id
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
  return (
    <div className="h-full">
      {/* Legacy portfolio-health-dashboard */}
      {activeSubService === "portfolio-health-dashboard" && (
        <PortfolioHealthDashboard className="h-full" />
      )}

      {activeSubService === "application-rationalization" && (
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">Redundant Apps</h3>
                </div>
                <p className="text-2xl font-bold text-red-900">23</p>
                <p className="text-sm text-red-700">Candidates for retirement</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">Potential Savings</h3>
                </div>
                <p className="text-2xl font-bold text-orange-900">$1.2M</p>
                <p className="text-sm text-orange-700">Annual cost reduction</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Rationalization Score</h3>
                </div>
                <p className="text-2xl font-bold text-green-900">78%</p>
                <p className="text-sm text-green-700">Portfolio efficiency</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 bg-red-50 p-4">
                <h4 className="font-semibold text-red-900 mb-2">High Priority Retirements</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Legacy CRM System - Replaced by Salesforce</li>
                  <li>• Old Reporting Tool - Functionality in Power BI</li>
                  <li>• Duplicate Project Management Tools (3 instances)</li>
                </ul>
              </div>
              <div className="border-l-4 border-orange-500 bg-orange-50 p-4">
                <h4 className="font-semibold text-orange-900 mb-2">Consolidation Opportunities</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• 5 Communication Tools → Consolidate to 2</li>
                  <li>• 4 File Storage Solutions → Migrate to OneDrive</li>
                  <li>• 3 Analytics Platforms → Standardize on one</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubService === "tco-optimization" && (
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Total TCO</h3>
                </div>
                <p className="text-2xl font-bold text-blue-900">$42.3M</p>
                <p className="text-sm text-blue-700">Annual portfolio cost</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Cost per App</h3>
                </div>
                <p className="text-2xl font-bold text-green-900">$171K</p>
                <p className="text-sm text-green-700">Average annually</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">License Savings</h3>
                </div>
                <p className="text-2xl font-bold text-purple-900">$3.2M</p>
                <p className="text-sm text-purple-700">Optimization potential</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Cloud className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">Cloud Savings</h3>
                </div>
                <p className="text-2xl font-bold text-orange-900">$1.8M</p>
                <p className="text-sm text-orange-700">Migration benefits</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Software Licenses</span>
                    <span className="font-semibold">$18.5M (44%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Infrastructure</span>
                    <span className="font-semibold">$12.3M (29%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Support & Maintenance</span>
                    <span className="font-semibold">$8.1M (19%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Personnel</span>
                    <span className="font-semibold">$3.4M (8%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add content for remaining application services */}
      {activeSubService === "application-lifecycle-tracking" && (
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-900">45</p>
                <p className="text-sm text-blue-700">Active</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-900">89</p>
                <p className="text-sm text-green-700">Production</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-yellow-900">23</p>
                <p className="text-sm text-yellow-700">Retiring</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-purple-900">90</p>
                <p className="text-sm text-purple-700">Retired</p>
              </div>
            </div>
            <div className="text-center py-8">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Lifecycle Tracking</h3>
              <p className="text-gray-500">Track applications through their complete lifecycle with automated workflows</p>
            </div>
          </div>
        </div>
      )}

      {activeSubService === "technical-debt-assessment" && (
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-900 mb-2">High Debt</h3>
                <p className="text-3xl font-bold text-red-900">34</p>
                <p className="text-sm text-red-700">Applications</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">Remediation Cost</h3>
                <p className="text-3xl font-bold text-orange-900">$4.2M</p>
                <p className="text-sm text-orange-700">Estimated effort</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Avg Debt Score</h3>
                <p className="text-3xl font-bold text-blue-900">62%</p>
                <p className="text-sm text-blue-700">Portfolio average</p>
              </div>
            </div>
            <div className="text-center py-8">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Debt Assessment</h3>
              <p className="text-gray-500">Quantify and prioritize technical debt with remediation roadmaps</p>
            </div>
          </div>
        </div>
      )}

      {/* Project Portfolio Services */}
      {activeSubService === "portfolio-dashboard" && (
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-900">23</p>
                <p className="text-sm text-blue-700">Active Projects</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-900">82%</p>
                <p className="text-sm text-green-700">On-time Delivery</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-purple-900">$12.4M</p>
                <p className="text-sm text-purple-700">Total Budget</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-orange-900">156</p>
                <p className="text-sm text-orange-700">Resources</p>
              </div>
            </div>
            <div className="text-center py-8">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Executive Portfolio Dashboard</h3>
              <p className="text-gray-500">Comprehensive real-time view of all transformation and IT projects</p>
            </div>
          </div>
        </div>
      )}

      {activeSubService === "project-health-tracking" && (
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Healthy</h3>
                <p className="text-3xl font-bold text-green-900">15</p>
                <p className="text-sm text-green-700">Projects on track</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">At Risk</h3>
                <p className="text-3xl font-bold text-yellow-900">6</p>
                <p className="text-sm text-yellow-700">Need attention</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-900 mb-2">Critical</h3>
                <p className="text-3xl font-bold text-red-900">2</p>
                <p className="text-sm text-red-700">Immediate action</p>
              </div>
            </div>
            <div className="text-center py-8">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Health Tracking</h3>
              <p className="text-gray-500">Monitor project health across multiple dimensions with predictive alerts</p>
            </div>
          </div>
        </div>
      )}

      {activeSubService === "resource-capacity-planning" && (
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-900">156</p>
                <p className="text-sm text-blue-700">Total Resources</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-900">78%</p>
                <p className="text-sm text-green-700">Utilization</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-orange-900">23</p>
                <p className="text-sm text-orange-700">Skill Gaps</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-purple-900">12</p>
                <p className="text-sm text-purple-700">Conflicts</p>
              </div>
            </div>
            <div className="text-center py-8">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resource Capacity Planning</h3>
              <p className="text-gray-500">Optimize resource allocation with demand forecasting</p>
            </div>
          </div>
        </div>
      )}

      {activeSubService === "budget-variance-analysis" && (
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Total Budget</h3>
                <p className="text-3xl font-bold text-blue-900">$12.4M</p>
                <p className="text-sm text-blue-700">Allocated</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Spent</h3>
                <p className="text-3xl font-bold text-green-900">$8.9M</p>
                <p className="text-sm text-green-700">72% utilized</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">Variance</h3>
                <p className="text-3xl font-bold text-orange-900">-$340K</p>
                <p className="text-sm text-orange-700">Under budget</p>
              </div>
            </div>
            <div className="text-center py-8">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget & Cost Variance Analysis</h3>
              <p className="text-gray-500">Track budget performance and forecast cost variances</p>
            </div>
          </div>
        </div>
      )}

      {!["portfolio-health-dashboard", "application-rationalization", "tco-optimization",
        "application-lifecycle-tracking", "technical-debt-assessment", "portfolio-dashboard",
        "project-health-tracking", "resource-capacity-planning", "budget-variance-analysis"
      ].includes(activeSubService) && (
          <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center py-12">
                <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {portfolioSubServices.find((s) => s.id === activeSubService)?.name ||
                    "Sub-service"}
                </h3>
                <p className="text-gray-500">
                  {portfolioSubServices.find((s) => s.id === activeSubService)?.description ||
                    "Service interface and tools will be displayed here"}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
