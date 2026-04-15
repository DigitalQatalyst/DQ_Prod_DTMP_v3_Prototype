 export interface SystemsPortfolioService {
   id: string;
   title: string;
   description: string;
   icon: string;
   analyticsType: string;
   systemScope: string;
   dataSource: string;
   aiPowered: boolean;
   aiCapabilities: string[];
   updateFrequency: string;
   visualizationType: string;
   complexity: "Low" | "Medium" | "High";
   accuracy: string;
   keyInsights: string[];
  businessValue: string[];
 }
 
 export const systemsPortfolio: SystemsPortfolioService[] = [
   {
     id: "system-health-analytics",
     title: "System Health Analytics Dashboard",
     description: "Real-time health monitoring across all enterprise systems with AI-powered anomaly detection",
     icon: "Activity",
     analyticsType: "Health Analytics",
     systemScope: "Enterprise-wide",
     dataSource: "APM Tools",
     aiPowered: true,
     aiCapabilities: ["Anomaly Detection", "Predictive Alerts"],
     updateFrequency: "Real-time",
     visualizationType: "Dashboard",
     complexity: "Medium",
     accuracy: "95% Accuracy",
     keyInsights: ["System uptime trends", "Performance bottlenecks", "Health score by domain"],
    businessValue: [
      "Reduce system downtime with predictive failure alerts before incidents escalate",
      "Prioritise infrastructure investment using data-backed health scores across the entire estate",
      "Demonstrate platform reliability to executive stakeholders with verifiable uptime metrics",
      "Decrease incident response time by surfacing root-cause signals before user impact is felt"
    ]
   },
   {
     id: "predictive-maintenance",
     title: "Predictive Maintenance Intelligence",
     description: "AI-powered predictions of system failures and maintenance needs before they occur",
     icon: "AlertTriangle",
     analyticsType: "Predictive Analytics",
     systemScope: "Enterprise-wide",
     dataSource: "Monitoring Systems",
     aiPowered: true,
     aiCapabilities: ["Failure Prediction", "Maintenance Scheduling"],
     updateFrequency: "Hourly",
     visualizationType: "Alert",
     complexity: "High",
     accuracy: "88% Accuracy",
     keyInsights: ["Failure probability", "Optimal maintenance windows", "Cost impact"],
    businessValue: [
      "Enable data-driven decision making for predictive maintenance intelligence",
      "Identify key risks and opportunities early to optimize outcomes",
      "Maximize return on investment through actionable insights"
    ]
   },
   {
     id: "performance-trending",
     title: "Performance Trend Analysis",
     description: "Long-term performance trends with forecasting for capacity planning",
     icon: "TrendingUp",
     analyticsType: "Performance Monitoring",
     systemScope: "Enterprise-wide",
     dataSource: "APM Tools",
     aiPowered: true,
     aiCapabilities: ["Trend Analysis", "Forecasting"],
     updateFrequency: "Daily",
     visualizationType: "Trend Chart",
     complexity: "Medium",
     accuracy: "92% Accuracy",
     keyInsights: ["Performance degradation patterns", "Capacity forecasts", "Peak usage prediction"],
    businessValue: [
      "Enable data-driven decision making for performance trend analysis",
      "Identify key risks and opportunities early to optimize outcomes",
      "Maximize return on investment through actionable insights"
    ]
   },
   {
     id: "lifecycle-optimization",
     title: "System Lifecycle Optimization",
     description: "Optimize system refresh cycles and end-of-life planning with predictive analytics",
     icon: "RefreshCw",
     analyticsType: "Lifecycle Management",
     systemScope: "Enterprise-wide",
     dataSource: "CMDB",
     aiPowered: true,
     aiCapabilities: ["Lifecycle Prediction", "Replacement Optimization"],
     updateFrequency: "Weekly",
     visualizationType: "Dashboard",
     complexity: "High",
     accuracy: "90% Accuracy",
     keyInsights: ["Optimal refresh timing", "EOL risk analysis", "TCO impact"],
    businessValue: [
      "Enable data-driven decision making for system lifecycle optimization",
      "Identify key risks and opportunities early to optimize outcomes",
      "Maximize return on investment through actionable insights"
    ]
   },
   {
    id: "cost-analytics",
    title: "System Cost Analytics & Optimization",
    description: "Comprehensive cost analysis with AI-driven optimization recommendations",
    icon: "DollarSign",
    analyticsType: "Cost Analytics",
    systemScope: "Enterprise-wide",
    dataSource: "All Sources",
    aiPowered: true,
    aiCapabilities: ["Cost Optimization", "Waste Detection"],
    updateFrequency: "Daily",
    visualizationType: "Dashboard",
    complexity: "Medium",
    accuracy: "91% Accuracy",
     keyInsights: ["Cost per system", "Optimization opportunities", "Waste identification"],
    businessValue: [
      "Enable data-driven decision making for system cost analytics & optimization",
      "Identify key risks and opportunities early to optimize outcomes",
      "Maximize return on investment through actionable insights"
    ]
   },
   {
     id: "security-intelligence",
     title: "Security & Vulnerability Intelligence",
     description: "AI-powered security analytics identifying vulnerabilities and threats across systems",
     icon: "Shield",
     analyticsType: "Security Analytics",
     systemScope: "Enterprise-wide",
     dataSource: "Monitoring Systems",
     aiPowered: true,
     aiCapabilities: ["Threat Detection", "Vulnerability Prediction"],
     updateFrequency: "Real-time",
     visualizationType: "Dashboard",
     complexity: "High",
     accuracy: "94% Accuracy",
     keyInsights: ["Threat landscape", "Vulnerability trends", "Risk exposure"],
    businessValue: [
      "Enable data-driven decision making for security & vulnerability intelligence",
      "Identify key risks and opportunities early to optimize outcomes",
      "Maximize return on investment through actionable insights"
    ]
   },
   {
    id: "availability-tracking",
    title: "System Availability Tracking",
    description: "Track system availability and SLA compliance with automated reporting",
    icon: "CheckCircle",
    analyticsType: "Performance Monitoring",
    systemScope: "Enterprise-wide",
    dataSource: "APM Tools",
    aiPowered: false,
    aiCapabilities: [],
    updateFrequency: "Real-time",
    visualizationType: "Dashboard",
    complexity: "Medium",
    accuracy: "97% Accuracy",
     keyInsights: ["Uptime percentage", "SLA compliance", "Downtime patterns"],
    businessValue: [
      "Enable data-driven decision making for system availability tracking",
      "Identify key risks and opportunities early to optimize outcomes",
      "Maximize return on investment through actionable insights"
    ]
   },
   {
     id: "dependency-intelligence",
     title: "System Dependency Intelligence",
     description: "Map and analyze system dependencies with impact prediction",
     icon: "Network",
     analyticsType: "Health Analytics",
     systemScope: "Enterprise-wide",
     dataSource: "CMDB",
     aiPowered: true,
     aiCapabilities: ["Impact Analysis", "Cascade Prediction"],
     updateFrequency: "Daily",
     visualizationType: "Heatmap",
     complexity: "High",
     accuracy: "87% Accuracy",
     keyInsights: ["Dependency maps", "Failure impact radius", "Critical systems"],
    businessValue: [
      "Enable data-driven decision making for system dependency intelligence",
      "Identify key risks and opportunities early to optimize outcomes",
      "Maximize return on investment through actionable insights"
    ]
   },
   {
     id: "capacity-forecasting",
     title: "Capacity Forecasting Analytics",
     description: "AI-driven capacity forecasting to prevent resource bottlenecks",
     icon: "Gauge",
     analyticsType: "Predictive Analytics",
     systemScope: "Enterprise-wide",
     dataSource: "Monitoring Systems",
     aiPowered: true,
     aiCapabilities: ["Demand Forecasting", "Capacity Planning"],
     updateFrequency: "Weekly",
     visualizationType: "Forecast Chart",
     complexity: "High",
     accuracy: "91% Accuracy",
     keyInsights: ["Capacity thresholds", "Growth projections", "Scaling recommendations"],
    businessValue: [
      "Enable data-driven decision making for capacity forecasting analytics",
      "Identify key risks and opportunities early to optimize outcomes",
      "Maximize return on investment through actionable insights"
    ]
   },
   {
    id: "usage-analytics",
    title: "System Usage Analytics",
    description: "Detailed usage patterns and adoption metrics across enterprise systems",
    icon: "Users",
    analyticsType: "Performance Monitoring",
    systemScope: "Enterprise-wide",
    dataSource: "Log Analytics",
    aiPowered: false,
    aiCapabilities: [],
    updateFrequency: "Daily",
    visualizationType: "Dashboard",
    complexity: "Medium",
    accuracy: "96% Accuracy",
     keyInsights: ["User adoption rates", "Feature usage", "Access patterns"],
    businessValue: [
      "Enable data-driven decision making for system usage analytics",
      "Identify key risks and opportunities early to optimize outcomes",
      "Maximize return on investment through actionable insights"
    ]
   },
   {
     id: "incident-intelligence",
     title: "Incident Pattern Intelligence",
     description: "AI analysis of incident patterns to identify root causes and prevent recurrence",
     icon: "AlertCircle",
     analyticsType: "Predictive Analytics",
     systemScope: "Enterprise-wide",
     dataSource: "All Sources",
     aiPowered: true,
     aiCapabilities: ["Pattern Recognition", "Root Cause Analysis"],
     updateFrequency: "Real-time",
     visualizationType: "Dashboard",
     complexity: "High",
     accuracy: "89% Accuracy",
     keyInsights: ["Incident patterns", "Root causes", "Prevention strategies"],
    businessValue: [
      "Enable data-driven decision making for incident pattern intelligence",
      "Identify key risks and opportunities early to optimize outcomes",
      "Maximize return on investment through actionable insights"
    ]
   },
   {
     id: "integration-health",
     title: "Integration Health Monitoring",
     description: "Monitor health and performance of all system integrations and APIs",
     icon: "Link",
     analyticsType: "Health Analytics",
     systemScope: "Enterprise-wide",
     dataSource: "APM Tools",
     aiPowered: true,
     aiCapabilities: ["Anomaly Detection", "Performance Prediction"],
     updateFrequency: "Real-time",
     visualizationType: "Dashboard",
     complexity: "Medium",
     accuracy: "93% Accuracy",
     keyInsights: ["Integration uptime", "API latency trends", "Error rate patterns"],
    businessValue: [
      "Enable data-driven decision making for integration health monitoring",
      "Identify key risks and opportunities early to optimize outcomes",
      "Maximize return on investment through actionable insights"
    ]
   }
 ];