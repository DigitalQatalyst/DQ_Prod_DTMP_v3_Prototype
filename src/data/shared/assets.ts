/**
 * Canonical System Asset Interface
 * 
 * This interface defines the shared data model for systems/applications
 * across both Portfolio Management and Digital Intelligence marketplaces.
 * 
 * A system appearing in DI's "System Health & Performance Analytics" dashboard
 * is the same entity as an application in Portfolio Management's application portfolio,
 * sharing the same ID, name, and health metrics.
 */

export interface SystemAsset {
  // Core identification
  id: string;
  name: string;
  type: "application" | "platform" | "infrastructure";
  owner: string;
  
  // Health & Status
  healthScore: number; // 0-100
  timeClassification: "core" | "invest" | "tolerate" | "eliminate";
  lastUpdated: string; // ISO date string
  
  // Portfolio Management specific fields
  projectCount?: number;
  budget?: number;
  businessValue?: number; // 0-100 score
  technicalDebt?: number; // 0-100 score
  licenseCount?: number;
  userCount?: number;
  
  // Digital Intelligence specific fields
  uptimePercent?: number; // 0-100
  incidentCount?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  performanceScore?: number; // 0-100
  securityScore?: number; // 0-100
  availabilityScore?: number; // 0-100
  
  // Shared metadata
  domain?: string;
  department?: string;
  criticality?: "low" | "medium" | "high" | "critical";
  environment?: "production" | "staging" | "development";
  vendor?: string;
  version?: string;
  cloudReady?: boolean;
  cloudProvider?: "aws" | "azure" | "gcp" | "on-premise" | "hybrid";
}

/**
 * Sample system assets for the enterprise portfolio
 * This is the single source of truth for system/application data
 */
export const systemAssets: SystemAsset[] = [
  {
    id: "SYS-CRM-001",
    name: "Customer Relationship Management System",
    type: "application",
    owner: "Sales & Marketing",
    healthScore: 85,
    timeClassification: "invest",
    lastUpdated: "2026-04-20T08:00:00Z",
    projectCount: 3,
    budget: 450000,
    businessValue: 92,
    technicalDebt: 25,
    licenseCount: 250,
    userCount: 847,
    uptimePercent: 99.7,
    incidentCount: 2,
    riskLevel: "low",
    performanceScore: 88,
    securityScore: 91,
    availabilityScore: 99,
    domain: "Customer Experience",
    department: "Sales",
    criticality: "critical",
    environment: "production",
    vendor: "Salesforce",
    version: "Enterprise v2024.1",
    cloudReady: true,
    cloudProvider: "aws"
  },
  {
    id: "SYS-ERP-001",
    name: "Enterprise Resource Planning System",
    type: "application",
    owner: "Finance & Operations",
    healthScore: 72,
    timeClassification: "tolerate",
    lastUpdated: "2026-04-20T07:30:00Z",
    projectCount: 5,
    budget: 1200000,
    businessValue: 95,
    technicalDebt: 68,
    licenseCount: 500,
    userCount: 1243,
    uptimePercent: 98.2,
    incidentCount: 8,
    riskLevel: "medium",
    performanceScore: 65,
    securityScore: 78,
    availabilityScore: 98,
    domain: "Finance",
    department: "Finance",
    criticality: "critical",
    environment: "production",
    vendor: "SAP",
    version: "S/4HANA 2023",
    cloudReady: false,
    cloudProvider: "on-premise"
  },
  {
    id: "SYS-HCM-001",
    name: "Human Capital Management System",
    type: "application",
    owner: "Human Resources",
    healthScore: 91,
    timeClassification: "core",
    lastUpdated: "2026-04-20T08:15:00Z",
    projectCount: 2,
    budget: 280000,
    businessValue: 88,
    technicalDebt: 15,
    licenseCount: 150,
    userCount: 456,
    uptimePercent: 99.9,
    incidentCount: 1,
    riskLevel: "low",
    performanceScore: 94,
    securityScore: 96,
    availabilityScore: 99,
    domain: "People & Culture",
    department: "HR",
    criticality: "high",
    environment: "production",
    vendor: "Workday",
    version: "2024 R1",
    cloudReady: true,
    cloudProvider: "aws"
  },
  {
    id: "SYS-SCM-001",
    name: "Supply Chain Management Platform",
    type: "application",
    owner: "Supply Chain",
    healthScore: 68,
    timeClassification: "tolerate",
    lastUpdated: "2026-04-20T06:45:00Z",
    projectCount: 4,
    budget: 650000,
    businessValue: 82,
    technicalDebt: 72,
    licenseCount: 180,
    userCount: 324,
    uptimePercent: 96.5,
    incidentCount: 15,
    riskLevel: "high",
    performanceScore: 58,
    securityScore: 71,
    availabilityScore: 96,
    domain: "Operations",
    department: "Supply Chain",
    criticality: "high",
    environment: "production",
    vendor: "Oracle",
    version: "12.2.8",
    cloudReady: false,
    cloudProvider: "on-premise"
  },
  {
    id: "SYS-BI-001",
    name: "Business Intelligence & Analytics Platform",
    type: "platform",
    owner: "Data & Analytics",
    healthScore: 88,
    timeClassification: "invest",
    lastUpdated: "2026-04-20T08:30:00Z",
    projectCount: 6,
    budget: 520000,
    businessValue: 90,
    technicalDebt: 22,
    licenseCount: 300,
    userCount: 678,
    uptimePercent: 99.5,
    incidentCount: 3,
    riskLevel: "low",
    performanceScore: 91,
    securityScore: 89,
    availabilityScore: 99,
    domain: "Data & Analytics",
    department: "IT",
    criticality: "high",
    environment: "production",
    vendor: "Microsoft",
    version: "Power BI Premium",
    cloudReady: true,
    cloudProvider: "azure"
  },
  {
    id: "SYS-LEGACY-001",
    name: "Legacy Inventory Management System",
    type: "application",
    owner: "Warehouse Operations",
    healthScore: 42,
    timeClassification: "eliminate",
    lastUpdated: "2026-04-19T14:20:00Z",
    projectCount: 1,
    budget: 85000,
    businessValue: 45,
    technicalDebt: 92,
    licenseCount: 45,
    userCount: 89,
    uptimePercent: 94.2,
    incidentCount: 28,
    riskLevel: "critical",
    performanceScore: 38,
    securityScore: 52,
    availabilityScore: 94,
    domain: "Operations",
    department: "Warehouse",
    criticality: "medium",
    environment: "production",
    vendor: "Custom Built",
    version: "v3.2 (2015)",
    cloudReady: false,
    cloudProvider: "on-premise"
  },
  {
    id: "SYS-COLLAB-001",
    name: "Enterprise Collaboration Suite",
    type: "platform",
    owner: "IT Services",
    healthScore: 94,
    timeClassification: "core",
    lastUpdated: "2026-04-20T08:45:00Z",
    projectCount: 1,
    budget: 380000,
    businessValue: 87,
    technicalDebt: 8,
    licenseCount: 1500,
    userCount: 2847,
    uptimePercent: 99.95,
    incidentCount: 1,
    riskLevel: "low",
    performanceScore: 96,
    securityScore: 98,
    availabilityScore: 99,
    domain: "Productivity",
    department: "IT",
    criticality: "critical",
    environment: "production",
    vendor: "Microsoft",
    version: "Microsoft 365 E5",
    cloudReady: true,
    cloudProvider: "azure"
  },
  {
    id: "SYS-ECOM-001",
    name: "E-Commerce Platform",
    type: "application",
    owner: "Digital Commerce",
    healthScore: 81,
    timeClassification: "invest",
    lastUpdated: "2026-04-20T07:00:00Z",
    projectCount: 7,
    budget: 890000,
    businessValue: 96,
    technicalDebt: 35,
    licenseCount: 100,
    userCount: 15234,
    uptimePercent: 99.3,
    incidentCount: 5,
    riskLevel: "medium",
    performanceScore: 84,
    securityScore: 86,
    availabilityScore: 99,
    domain: "Customer Experience",
    department: "Digital",
    criticality: "critical",
    environment: "production",
    vendor: "Shopify",
    version: "Plus 2024",
    cloudReady: true,
    cloudProvider: "gcp"
  },
  {
    id: "SYS-INFRA-001",
    name: "Core Infrastructure Monitoring Platform",
    type: "infrastructure",
    owner: "Infrastructure & Operations",
    healthScore: 89,
    timeClassification: "core",
    lastUpdated: "2026-04-20T08:50:00Z",
    projectCount: 2,
    budget: 420000,
    businessValue: 85,
    technicalDebt: 18,
    licenseCount: 50,
    userCount: 125,
    uptimePercent: 99.8,
    incidentCount: 2,
    riskLevel: "low",
    performanceScore: 92,
    securityScore: 94,
    availabilityScore: 99,
    domain: "Infrastructure",
    department: "IT",
    criticality: "critical",
    environment: "production",
    vendor: "Datadog",
    version: "Enterprise",
    cloudReady: true,
    cloudProvider: "hybrid"
  },
  {
    id: "SYS-PROJ-001",
    name: "Project Management & Collaboration Tool",
    type: "application",
    owner: "PMO",
    healthScore: 86,
    timeClassification: "invest",
    lastUpdated: "2026-04-20T08:20:00Z",
    projectCount: 8,
    budget: 195000,
    businessValue: 79,
    technicalDebt: 20,
    licenseCount: 400,
    userCount: 892,
    uptimePercent: 99.6,
    incidentCount: 3,
    riskLevel: "low",
    performanceScore: 87,
    securityScore: 88,
    availabilityScore: 99,
    domain: "Project Delivery",
    department: "PMO",
    criticality: "high",
    environment: "production",
    vendor: "Atlassian",
    version: "Jira Premium",
    cloudReady: true,
    cloudProvider: "aws"
  }
];

/**
 * Helper functions to filter and query system assets
 */

export const getSystemAssetById = (id: string): SystemAsset | undefined => {
  return systemAssets.find(asset => asset.id === id);
};

export const getSystemAssetsByType = (type: SystemAsset["type"]): SystemAsset[] => {
  return systemAssets.filter(asset => asset.type === type);
};

export const getSystemAssetsByTimeClassification = (
  classification: SystemAsset["timeClassification"]
): SystemAsset[] => {
  return systemAssets.filter(asset => asset.timeClassification === classification);
};

export const getSystemAssetsByRiskLevel = (
  riskLevel: SystemAsset["riskLevel"]
): SystemAsset[] => {
  return systemAssets.filter(asset => asset.riskLevel === riskLevel);
};

export const getSystemAssetsByDomain = (domain: string): SystemAsset[] => {
  return systemAssets.filter(asset => asset.domain === domain);
};

export const getSystemAssetsByOwner = (owner: string): SystemAsset[] => {
  return systemAssets.filter(asset => asset.owner === owner);
};

export const getHealthySystemAssets = (threshold: number = 80): SystemAsset[] => {
  return systemAssets.filter(asset => asset.healthScore >= threshold);
};

export const getUnhealthySystemAssets = (threshold: number = 60): SystemAsset[] => {
  return systemAssets.filter(asset => asset.healthScore < threshold);
};

export const getCriticalSystemAssets = (): SystemAsset[] => {
  return systemAssets.filter(asset => asset.criticality === "critical");
};

export const getCloudReadySystemAssets = (): SystemAsset[] => {
  return systemAssets.filter(asset => asset.cloudReady === true);
};

/**
 * Calculate aggregate statistics across all system assets
 */
export const getSystemAssetStats = () => {
  const total = systemAssets.length;
  const applications = systemAssets.filter(a => a.type === "application").length;
  const platforms = systemAssets.filter(a => a.type === "platform").length;
  const infrastructure = systemAssets.filter(a => a.type === "infrastructure").length;
  
  const avgHealthScore = Math.round(
    systemAssets.reduce((sum, asset) => sum + asset.healthScore, 0) / total
  );
  
  const avgUptimePercent = Math.round(
    systemAssets.reduce((sum, asset) => sum + (asset.uptimePercent || 0), 0) / total * 10
  ) / 10;
  
  const totalIncidents = systemAssets.reduce((sum, asset) => sum + (asset.incidentCount || 0), 0);
  
  const criticalRisk = systemAssets.filter(a => a.riskLevel === "critical").length;
  const highRisk = systemAssets.filter(a => a.riskLevel === "high").length;
  
  const cloudReady = systemAssets.filter(a => a.cloudReady === true).length;
  const cloudReadyPercent = Math.round((cloudReady / total) * 100);
  
  const totalBudget = systemAssets.reduce((sum, asset) => sum + (asset.budget || 0), 0);
  const totalUsers = systemAssets.reduce((sum, asset) => sum + (asset.userCount || 0), 0);
  
  return {
    total,
    applications,
    platforms,
    infrastructure,
    avgHealthScore,
    avgUptimePercent,
    totalIncidents,
    criticalRisk,
    highRisk,
    cloudReady,
    cloudReadyPercent,
    totalBudget,
    totalUsers,
    byTimeClassification: {
      core: systemAssets.filter(a => a.timeClassification === "core").length,
      invest: systemAssets.filter(a => a.timeClassification === "invest").length,
      tolerate: systemAssets.filter(a => a.timeClassification === "tolerate").length,
      eliminate: systemAssets.filter(a => a.timeClassification === "eliminate").length
    }
  };
};
