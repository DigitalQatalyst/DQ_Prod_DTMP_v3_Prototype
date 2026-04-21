/**
 * System Asset Mapping Utilities for Digital Intelligence
 * 
 * This file provides utilities to map shared SystemAsset data
 * to Digital Intelligence dashboard visualizations and analytics.
 */

import { systemAssets, type SystemAsset } from "@/data/shared/assets";

/**
 * Get system health distribution for dashboard visualization
 */
export const getSystemHealthDistribution = () => {
  const excellent = systemAssets.filter(a => a.healthScore >= 90).length;
  const good = systemAssets.filter(a => a.healthScore >= 75 && a.healthScore < 90).length;
  const fair = systemAssets.filter(a => a.healthScore >= 60 && a.healthScore < 75).length;
  const poor = systemAssets.filter(a => a.healthScore >= 40 && a.healthScore < 60).length;
  const critical = systemAssets.filter(a => a.healthScore < 40).length;
  
  return [
    { category: "Excellent", count: excellent, percentage: Math.round((excellent / systemAssets.length) * 100), color: "#10B981" },
    { category: "Good", count: good, percentage: Math.round((good / systemAssets.length) * 100), color: "#84CC16" },
    { category: "Fair", count: fair, percentage: Math.round((fair / systemAssets.length) * 100), color: "#F59E0B" },
    { category: "Poor", count: poor, percentage: Math.round((poor / systemAssets.length) * 100), color: "#FF6600" },
    { category: "Critical", count: critical, percentage: Math.round((critical / systemAssets.length) * 100), color: "#EF4444" }
  ];
};

/**
 * Get TIME classification distribution
 */
export const getTimeClassificationDistribution = () => {
  const core = systemAssets.filter(a => a.timeClassification === "core").length;
  const invest = systemAssets.filter(a => a.timeClassification === "invest").length;
  const tolerate = systemAssets.filter(a => a.timeClassification === "tolerate").length;
  const eliminate = systemAssets.filter(a => a.timeClassification === "eliminate").length;
  
  return [
    { category: "Core", count: core, percentage: Math.round((core / systemAssets.length) * 100) },
    { category: "Invest", count: invest, percentage: Math.round((invest / systemAssets.length) * 100) },
    { category: "Tolerate", count: tolerate, percentage: Math.round((tolerate / systemAssets.length) * 100) },
    { category: "Eliminate", count: eliminate, percentage: Math.round((eliminate / systemAssets.length) * 100) }
  ];
};

/**
 * Get risk level distribution
 */
export const getRiskLevelDistribution = () => {
  const low = systemAssets.filter(a => a.riskLevel === "low").length;
  const medium = systemAssets.filter(a => a.riskLevel === "medium").length;
  const high = systemAssets.filter(a => a.riskLevel === "high").length;
  const critical = systemAssets.filter(a => a.riskLevel === "critical").length;
  
  return [
    { level: "Low", count: low, percentage: Math.round((low / systemAssets.length) * 100), color: "#10B981" },
    { level: "Medium", count: medium, percentage: Math.round((medium / systemAssets.length) * 100), color: "#F59E0B" },
    { level: "High", count: high, percentage: Math.round((high / systemAssets.length) * 100), color: "#FF6600" },
    { level: "Critical", count: critical, percentage: Math.round((critical / systemAssets.length) * 100), color: "#EF4444" }
  ];
};

/**
 * Get uptime performance data for time series visualization
 */
export const getUptimePerformanceData = () => {
  return systemAssets
    .filter(a => a.uptimePercent !== undefined)
    .map(asset => ({
      systemId: asset.id,
      systemName: asset.name,
      uptime: asset.uptimePercent,
      target: 99.5,
      status: (asset.uptimePercent || 0) >= 99.5 ? "meeting" : "below"
    }))
    .sort((a, b) => (b.uptime || 0) - (a.uptime || 0));
};

/**
 * Get incident count by system
 */
export const getIncidentCountBySystem = () => {
  return systemAssets
    .filter(a => a.incidentCount !== undefined && a.incidentCount > 0)
    .map(asset => ({
      systemId: asset.id,
      systemName: asset.name,
      incidents: asset.incidentCount,
      riskLevel: asset.riskLevel
    }))
    .sort((a, b) => (b.incidents || 0) - (a.incidents || 0));
};

/**
 * Get systems by domain for domain-level analytics
 */
export const getSystemsByDomain = () => {
  const domainMap = new Map<string, SystemAsset[]>();
  
  systemAssets.forEach(asset => {
    const domain = asset.domain || "Unassigned";
    if (!domainMap.has(domain)) {
      domainMap.set(domain, []);
    }
    domainMap.get(domain)?.push(asset);
  });
  
  return Array.from(domainMap.entries()).map(([domain, systems]) => ({
    domain,
    systemCount: systems.length,
    avgHealthScore: Math.round(
      systems.reduce((sum, s) => sum + s.healthScore, 0) / systems.length
    ),
    avgUptime: Math.round(
      systems.reduce((sum, s) => sum + (s.uptimePercent || 0), 0) / systems.length * 10
    ) / 10,
    totalIncidents: systems.reduce((sum, s) => sum + (s.incidentCount || 0), 0),
    criticalSystems: systems.filter(s => s.criticality === "critical").length
  }));
};

/**
 * Get cloud readiness metrics
 */
export const getCloudReadinessMetrics = () => {
  const cloudReady = systemAssets.filter(a => a.cloudReady === true).length;
  const notCloudReady = systemAssets.filter(a => a.cloudReady === false).length;
  const cloudReadyPercent = Math.round((cloudReady / systemAssets.length) * 100);
  
  const byProvider = {
    aws: systemAssets.filter(a => a.cloudProvider === "aws").length,
    azure: systemAssets.filter(a => a.cloudProvider === "azure").length,
    gcp: systemAssets.filter(a => a.cloudProvider === "gcp").length,
    hybrid: systemAssets.filter(a => a.cloudProvider === "hybrid").length,
    onPremise: systemAssets.filter(a => a.cloudProvider === "on-premise").length
  };
  
  return {
    cloudReady,
    notCloudReady,
    cloudReadyPercent,
    byProvider,
    migrationCandidates: systemAssets.filter(
      a => a.cloudReady === false && a.timeClassification !== "eliminate"
    ).length
  };
};

/**
 * Get performance score distribution
 */
export const getPerformanceScoreDistribution = () => {
  const systems = systemAssets.filter(a => a.performanceScore !== undefined);
  
  const excellent = systems.filter(a => (a.performanceScore || 0) >= 90).length;
  const good = systems.filter(a => (a.performanceScore || 0) >= 75 && (a.performanceScore || 0) < 90).length;
  const fair = systems.filter(a => (a.performanceScore || 0) >= 60 && (a.performanceScore || 0) < 75).length;
  const poor = systems.filter(a => (a.performanceScore || 0) < 60).length;
  
  return [
    { category: "Excellent (90+)", count: excellent, percentage: Math.round((excellent / systems.length) * 100) },
    { category: "Good (75-89)", count: good, percentage: Math.round((good / systems.length) * 100) },
    { category: "Fair (60-74)", count: fair, percentage: Math.round((fair / systems.length) * 100) },
    { category: "Poor (<60)", count: poor, percentage: Math.round((poor / systems.length) * 100) }
  ];
};

/**
 * Get security score distribution
 */
export const getSecurityScoreDistribution = () => {
  const systems = systemAssets.filter(a => a.securityScore !== undefined);
  
  const excellent = systems.filter(a => (a.securityScore || 0) >= 90).length;
  const good = systems.filter(a => (a.securityScore || 0) >= 75 && (a.securityScore || 0) < 90).length;
  const fair = systems.filter(a => (a.securityScore || 0) >= 60 && (a.securityScore || 0) < 75).length;
  const poor = systems.filter(a => (a.securityScore || 0) < 60).length;
  
  return [
    { category: "Excellent (90+)", count: excellent, percentage: Math.round((excellent / systems.length) * 100) },
    { category: "Good (75-89)", count: good, percentage: Math.round((good / systems.length) * 100) },
    { category: "Fair (60-74)", count: fair, percentage: Math.round((fair / systems.length) * 100) },
    { category: "Poor (<60)", count: poor, percentage: Math.round((poor / systems.length) * 100) }
  ];
};

/**
 * Get top systems by various metrics
 */
export const getTopSystemsByMetric = (metric: keyof SystemAsset, limit: number = 5) => {
  return systemAssets
    .filter(a => a[metric] !== undefined)
    .sort((a, b) => {
      const aVal = a[metric] as number;
      const bVal = b[metric] as number;
      return bVal - aVal;
    })
    .slice(0, limit)
    .map(asset => ({
      id: asset.id,
      name: asset.name,
      value: asset[metric],
      healthScore: asset.healthScore,
      riskLevel: asset.riskLevel
    }));
};

/**
 * Get systems requiring attention (low health, high risk, or high incidents)
 */
export const getSystemsRequiringAttention = () => {
  return systemAssets
    .filter(asset => 
      asset.healthScore < 70 || 
      asset.riskLevel === "high" || 
      asset.riskLevel === "critical" ||
      (asset.incidentCount || 0) > 10
    )
    .map(asset => ({
      id: asset.id,
      name: asset.name,
      healthScore: asset.healthScore,
      riskLevel: asset.riskLevel,
      incidentCount: asset.incidentCount,
      timeClassification: asset.timeClassification,
      reasons: [
        asset.healthScore < 70 ? `Low health score (${asset.healthScore})` : null,
        asset.riskLevel === "high" || asset.riskLevel === "critical" ? `${asset.riskLevel} risk` : null,
        (asset.incidentCount || 0) > 10 ? `High incident count (${asset.incidentCount})` : null
      ].filter(Boolean)
    }))
    .sort((a, b) => a.healthScore - b.healthScore);
};

/**
 * Get budget allocation by domain
 */
export const getBudgetAllocationByDomain = () => {
  const domainMap = new Map<string, number>();
  
  systemAssets.forEach(asset => {
    const domain = asset.domain || "Unassigned";
    const budget = asset.budget || 0;
    domainMap.set(domain, (domainMap.get(domain) || 0) + budget);
  });
  
  return Array.from(domainMap.entries())
    .map(([domain, budget]) => ({ domain, budget }))
    .sort((a, b) => b.budget - a.budget);
};

/**
 * Get user count by system type
 */
export const getUserCountBySystemType = () => {
  const typeMap = new Map<string, number>();
  
  systemAssets.forEach(asset => {
    const type = asset.type;
    const users = asset.userCount || 0;
    typeMap.set(type, (typeMap.get(type) || 0) + users);
  });
  
  return Array.from(typeMap.entries()).map(([type, users]) => ({ type, users }));
};
