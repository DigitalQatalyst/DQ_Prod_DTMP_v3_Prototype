/**
 * Example Component: System Asset Integration
 * 
 * This component demonstrates how to use the aligned system asset data
 * across Portfolio Management and Digital Intelligence marketplaces.
 */

import { 
  systemAssets, 
  getSystemAssetStats,
  getSystemHealthDistribution,
  getSystemsRequiringAttention,
  getCloudReadinessMetrics,
  getRiskLevelDistribution
} from "@/data/digitalIntelligence";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Cloud, Shield } from "lucide-react";

/**
 * Example 1: System Health Overview Dashboard
 */
export const SystemHealthOverview = () => {
  const stats = getSystemAssetStats();
  const healthDist = getSystemHealthDistribution();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Systems</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Avg Health Score</div>
          <div className="text-3xl font-bold">{stats.avgHealthScore}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Avg Uptime</div>
          <div className="text-3xl font-bold">{stats.avgUptimePercent}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Incidents</div>
          <div className="text-3xl font-bold text-orange-600">{stats.totalIncidents}</div>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Health Distribution</h3>
        <div className="space-y-2">
          {healthDist.map(item => (
            <div key={item.category} className="flex items-center gap-4">
              <div className="w-24 text-sm">{item.category}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div 
                  className="h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                  style={{ 
                    width: `${item.percentage}%`, 
                    backgroundColor: item.color 
                  }}
                >
                  {item.percentage}%
                </div>
              </div>
              <div className="w-16 text-sm text-gray-600">{item.count} systems</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

/**
 * Example 2: Systems Requiring Attention
 */
export const SystemsRequiringAttention = () => {
  const systems = getSystemsRequiringAttention();
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold">Systems Requiring Attention</h3>
        <Badge variant="destructive">{systems.length}</Badge>
      </div>
      
      <div className="space-y-3">
        {systems.map(system => (
          <div key={system.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium">{system.name}</div>
                <div className="text-sm text-gray-600">{system.id}</div>
              </div>
              <Badge 
                variant={
                  system.riskLevel === "critical" ? "destructive" : 
                  system.riskLevel === "high" ? "destructive" : 
                  "secondary"
                }
              >
                {system.riskLevel} risk
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div>
                Health: <span className="font-medium">{system.healthScore}/100</span>
              </div>
              <div>
                Incidents: <span className="font-medium">{system.incidentCount}</span>
              </div>
              <div>
                TIME: <span className="font-medium capitalize">{system.timeClassification}</span>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              {system.reasons.join(" • ")}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

/**
 * Example 3: Cloud Readiness Widget
 */
export const CloudReadinessWidget = () => {
  const metrics = getCloudReadinessMetrics();
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Cloud Readiness</h3>
      </div>
      
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600">{metrics.cloudReadyPercent}%</div>
          <div className="text-sm text-gray-600">Cloud Ready</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Cloud Ready</div>
            <div className="text-xl font-semibold text-green-600">{metrics.cloudReady}</div>
          </div>
          <div>
            <div className="text-gray-600">Not Ready</div>
            <div className="text-xl font-semibold text-orange-600">{metrics.notCloudReady}</div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-2">By Provider</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>AWS</span>
              <span className="font-medium">{metrics.byProvider.aws}</span>
            </div>
            <div className="flex justify-between">
              <span>Azure</span>
              <span className="font-medium">{metrics.byProvider.azure}</span>
            </div>
            <div className="flex justify-between">
              <span>GCP</span>
              <span className="font-medium">{metrics.byProvider.gcp}</span>
            </div>
            <div className="flex justify-between">
              <span>Hybrid</span>
              <span className="font-medium">{metrics.byProvider.hybrid}</span>
            </div>
            <div className="flex justify-between">
              <span>On-Premise</span>
              <span className="font-medium">{metrics.byProvider.onPremise}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 text-sm">
          <div className="font-medium text-blue-900">Migration Candidates</div>
          <div className="text-blue-700">{metrics.migrationCandidates} systems ready for cloud migration</div>
        </div>
      </div>
    </Card>
  );
};

/**
 * Example 4: Risk Level Distribution
 */
export const RiskLevelDistribution = () => {
  const riskDist = getRiskLevelDistribution();
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Risk Level Distribution</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {riskDist.map(item => (
          <div key={item.level} className="text-center">
            <div 
              className="text-3xl font-bold mb-1"
              style={{ color: item.color }}
            >
              {item.count}
            </div>
            <div className="text-sm text-gray-600">{item.level} Risk</div>
            <div className="text-xs text-gray-500">{item.percentage}%</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

/**
 * Example 5: System Detail Card with Cross-Marketplace Navigation
 */
export const SystemDetailCard = ({ systemId }: { systemId: string }) => {
  const system = systemAssets.find(s => s.id === systemId);
  
  if (!system) {
    return <div>System not found</div>;
  }
  
  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-lime-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">{system.name}</h3>
          <div className="text-sm text-gray-600">{system.id}</div>
        </div>
        <Badge variant="outline" className="capitalize">
          {system.type}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-600">Health Score</div>
          <div className={`text-2xl font-bold ${getHealthColor(system.healthScore)}`}>
            {system.healthScore}/100
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Uptime</div>
          <div className="text-2xl font-bold text-green-600">
            {system.uptimePercent}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Incidents</div>
          <div className="text-2xl font-bold text-orange-600">
            {system.incidentCount}
          </div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Owner</span>
          <span className="font-medium">{system.owner}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Domain</span>
          <span className="font-medium">{system.domain}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">TIME Classification</span>
          <Badge variant="outline" className="capitalize">{system.timeClassification}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Risk Level</span>
          <Badge 
            variant={system.riskLevel === "critical" || system.riskLevel === "high" ? "destructive" : "secondary"}
            className="capitalize"
          >
            {system.riskLevel}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Cloud Provider</span>
          <span className="font-medium capitalize">{system.cloudProvider?.replace("-", " ")}</span>
        </div>
      </div>
      
      <div className="flex gap-2 pt-4 border-t">
        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          View in Portfolio Management
        </button>
        <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          View Analytics Dashboard
        </button>
      </div>
    </Card>
  );
};

/**
 * Example 6: Complete Dashboard Page
 */
export const SystemAssetDashboard = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Asset Intelligence</h1>
        <p className="text-gray-600">
          Unified view of enterprise systems across Portfolio Management and Digital Intelligence
        </p>
      </div>
      
      <SystemHealthOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CloudReadinessWidget />
        <RiskLevelDistribution />
      </div>
      
      <SystemsRequiringAttention />
    </div>
  );
};
