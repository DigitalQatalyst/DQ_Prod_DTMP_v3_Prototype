# System Asset Data Alignment

**Date:** April 20, 2026  
**Status:** Implemented  
**Recommendation:** R6 from Digital Intelligence Gap Analysis

---

## Overview

This document describes the implementation of shared system asset data between Portfolio Management and Digital Intelligence marketplaces. Both marketplaces now draw from the same canonical data source, ensuring consistency and eliminating data duplication.

## Problem Statement

Previously, Portfolio Management and Digital Intelligence maintained separate data structures for systems/applications:
- Portfolio Management had `applicationPortfolio` with portfolio-specific fields
- Digital Intelligence had `systemsPortfolio` with analytics-specific fields
- No shared entity IDs or synchronized health metrics
- Risk of data inconsistency and duplication

## Solution

### Canonical Data Model

Created a shared `SystemAsset` interface in `src/data/shared/assets.ts` that serves as the single source of truth for all system/application data across the platform.

```typescript
interface SystemAsset {
  // Core identification
  id: string;
  name: string;
  type: "application" | "platform" | "infrastructure";
  owner: string;
  
  // Health & Status
  healthScore: number; // 0-100
  timeClassification: "core" | "invest" | "tolerate" | "eliminate";
  lastUpdated: string;
  
  // Portfolio Management fields
  projectCount?: number;
  budget?: number;
  businessValue?: number;
  technicalDebt?: number;
  
  // Digital Intelligence fields
  uptimePercent?: number;
  incidentCount?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  performanceScore?: number;
  securityScore?: number;
  
  // Shared metadata
  domain?: string;
  criticality?: "low" | "medium" | "high" | "critical";
  cloudReady?: boolean;
  cloudProvider?: "aws" | "azure" | "gcp" | "on-premise" | "hybrid";
}
```

### Sample Data

Created 10 canonical system assets representing the enterprise portfolio:

| System ID | Name | Type | Health Score | TIME | Risk Level |
|-----------|------|------|--------------|------|------------|
| SYS-CRM-001 | Customer Relationship Management System | application | 85 | invest | low |
| SYS-ERP-001 | Enterprise Resource Planning System | application | 72 | tolerate | medium |
| SYS-HCM-001 | Human Capital Management System | application | 91 | core | low |
| SYS-SCM-001 | Supply Chain Management Platform | application | 68 | tolerate | high |
| SYS-BI-001 | Business Intelligence & Analytics Platform | platform | 88 | invest | low |
| SYS-LEGACY-001 | Legacy Inventory Management System | application | 42 | eliminate | critical |
| SYS-COLLAB-001 | Enterprise Collaboration Suite | platform | 94 | core | low |
| SYS-ECOM-001 | E-Commerce Platform | application | 81 | invest | medium |
| SYS-INFRA-001 | Core Infrastructure Monitoring Platform | infrastructure | 89 | core | low |
| SYS-PROJ-001 | Project Management & Collaboration Tool | application | 86 | invest | low |

## File Structure

```
src/data/
├── shared/
│   └── assets.ts                          ← Canonical SystemAsset interface + data
├── portfolio/
│   ├── index.ts                           ← Imports and re-exports systemAssets
│   └── dataAlignment.ts                   ← Existing alignment utilities
└── digitalIntelligence/
    ├── index.ts                           ← Exports systemAssetMapping
    ├── systemsPortfolio.ts                ← Imports and re-exports systemAssets
    └── systemAssetMapping.ts              ← NEW: DI-specific mapping utilities
```

## Integration Points

### Portfolio Management

Portfolio Management now imports `systemAssets` from the shared source:

```typescript
// src/data/portfolio/index.ts
import { systemAssets, getSystemAssetStats, type SystemAsset } from "@/data/shared/assets";

export { systemAssets, getSystemAssetStats, type SystemAsset };
```

Portfolio Management can use system assets for:
- Application portfolio health dashboards
- Risk and compliance monitoring
- TCO analysis and optimization
- Technical debt assessment
- Cloud readiness assessment

### Digital Intelligence

Digital Intelligence imports the same `systemAssets` and provides mapping utilities:

```typescript
// src/data/digitalIntelligence/systemsPortfolio.ts
import { systemAssets, getSystemAssetStats, type SystemAsset } from "@/data/shared/assets";

export { systemAssets, getSystemAssetStats, type SystemAsset };
```

Digital Intelligence provides specialized mapping utilities in `systemAssetMapping.ts`:
- `getSystemHealthDistribution()` - Health score distribution for dashboards
- `getTimeClassificationDistribution()` - TIME classification breakdown
- `getRiskLevelDistribution()` - Risk level analysis
- `getUptimePerformanceData()` - Uptime metrics for monitoring
- `getIncidentCountBySystem()` - Incident tracking
- `getSystemsByDomain()` - Domain-level analytics
- `getCloudReadinessMetrics()` - Cloud migration readiness
- `getPerformanceScoreDistribution()` - Performance analytics
- `getSecurityScoreDistribution()` - Security posture
- `getSystemsRequiringAttention()` - Systems needing immediate attention
- `getBudgetAllocationByDomain()` - Financial analytics
- `getUserCountBySystemType()` - User adoption metrics

## Benefits

### Data Consistency
- Single source of truth for all system/application data
- Shared entity IDs across marketplaces
- Synchronized health metrics and status

### Cross-Marketplace Navigation
- Users can click a system in DI's "System Health Analytics" dashboard
- Navigate to Portfolio Management's detailed application view
- See the same system with consistent data

### Reduced Maintenance
- Update system data in one place
- Changes automatically reflected in both marketplaces
- No risk of data drift or inconsistency

### Enhanced Analytics
- Digital Intelligence can analyze portfolio management data
- Portfolio Management can leverage DI's operational metrics
- Combined insights across strategic and operational dimensions

## Usage Examples

### Example 1: Portfolio Management Dashboard

```typescript
import { systemAssets, getSystemAssetStats } from "@/data/portfolio";

const PortfolioHealthDashboard = () => {
  const stats = getSystemAssetStats();
  const unhealthySystems = systemAssets.filter(s => s.healthScore < 70);
  
  return (
    <div>
      <h2>Portfolio Health: {stats.avgHealthScore}/100</h2>
      <p>Total Systems: {stats.total}</p>
      <p>Cloud Ready: {stats.cloudReadyPercent}%</p>
      <SystemList systems={unhealthySystems} />
    </div>
  );
};
```

### Example 2: Digital Intelligence Analytics

```typescript
import { 
  getSystemHealthDistribution, 
  getSystemsRequiringAttention,
  getCloudReadinessMetrics 
} from "@/data/digitalIntelligence";

const SystemHealthDashboard = () => {
  const healthDist = getSystemHealthDistribution();
  const attentionSystems = getSystemsRequiringAttention();
  const cloudMetrics = getCloudReadinessMetrics();
  
  return (
    <div>
      <HealthDistributionChart data={healthDist} />
      <AlertList systems={attentionSystems} />
      <CloudReadinessWidget metrics={cloudMetrics} />
    </div>
  );
};
```

### Example 3: Cross-Marketplace Navigation

```typescript
import { systemAssets } from "@/data/shared/assets";
import { useNavigate } from "react-router-dom";

const SystemCard = ({ systemId }: { systemId: string }) => {
  const navigate = useNavigate();
  const system = systemAssets.find(s => s.id === systemId);
  
  const viewInPortfolio = () => {
    navigate(`/marketplaces/portfolio-management/application/${systemId}`);
  };
  
  const viewInDI = () => {
    navigate(`/stage2/intelligence/system-health-analytics?system=${systemId}`);
  };
  
  return (
    <div>
      <h3>{system?.name}</h3>
      <p>Health: {system?.healthScore}/100</p>
      <button onClick={viewInPortfolio}>View in Portfolio</button>
      <button onClick={viewInDI}>View Analytics</button>
    </div>
  );
};
```

## Helper Functions

The shared assets module provides several helper functions:

```typescript
// Query by ID
const system = getSystemAssetById("SYS-CRM-001");

// Filter by type
const applications = getSystemAssetsByType("application");
const platforms = getSystemAssetsByType("platform");

// Filter by TIME classification
const eliminateCandidates = getSystemAssetsByTimeClassification("eliminate");

// Filter by risk
const criticalRiskSystems = getSystemAssetsByRiskLevel("critical");

// Filter by domain
const financeSystems = getSystemAssetsByDomain("Finance");

// Filter by health
const healthySystems = getHealthySystemAssets(80); // >= 80
const unhealthySystems = getUnhealthySystemAssets(60); // < 60

// Get critical systems
const criticalSystems = getCriticalSystemAssets();

// Get cloud-ready systems
const cloudReadySystems = getCloudReadySystemAssets();

// Get aggregate statistics
const stats = getSystemAssetStats();
```

## Migration Notes

### Existing Code

Existing code that references `applicationPortfolio` or `systemsPortfolio` services (dashboard definitions) continues to work unchanged. Those are service/dashboard metadata, not the actual system data.

### New Code

New code should:
1. Import `systemAssets` from `@/data/shared/assets` for the canonical data
2. Use helper functions to filter and query system data
3. Use mapping utilities in `systemAssetMapping.ts` for DI-specific analytics
4. Reference systems by their canonical ID (e.g., `SYS-CRM-001`)

## Future Enhancements

### Phase 2: Backend Integration
- Connect to actual CMDB/APM data sources
- Real-time data synchronization
- Historical trend data storage

### Phase 3: Expanded Asset Types
- Add databases, APIs, microservices
- Infrastructure components (servers, networks)
- Cloud resources (S3 buckets, Lambda functions)

### Phase 4: Advanced Analytics
- Predictive health scoring using ML
- Automated anomaly detection
- Cost optimization recommendations
- Dependency impact analysis

## Testing

To verify the alignment:

1. Check that both marketplaces show the same system count:
   ```typescript
   import { systemAssets } from "@/data/portfolio";
   import { systemAssets as diAssets } from "@/data/digitalIntelligence";
   console.log(systemAssets.length === diAssets.length); // Should be true
   ```

2. Verify shared IDs:
   ```typescript
   const portfolioSystem = systemAssets.find(s => s.id === "SYS-CRM-001");
   const diSystem = diAssets.find(s => s.id === "SYS-CRM-001");
   console.log(portfolioSystem === diSystem); // Should be true (same reference)
   ```

3. Check health score consistency:
   ```typescript
   systemAssets.forEach(system => {
     console.log(`${system.name}: Health ${system.healthScore}, Risk ${system.riskLevel}`);
   });
   ```

## Conclusion

The system asset data alignment successfully unifies Portfolio Management and Digital Intelligence data sources, providing a consistent view of enterprise systems across both marketplaces. This foundation enables powerful cross-marketplace analytics and navigation while reducing maintenance overhead.

---

**Implementation Status:** ✅ Complete  
**Files Modified:** 4  
**Files Created:** 3  
**Breaking Changes:** None
