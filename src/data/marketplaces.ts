import {
  GraduationCap,
  BookOpen,
  FileText,
  Layout,
  Hammer,
  RefreshCw,
  Briefcase,
  BarChart3,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

export type Phase = "Discern" | "Design" | "Deploy" | "Drive";

export interface Marketplace {
  id: string;
  phase: Phase;
  icon: LucideIcon;
  name: string;
  description: string;
  features: string[];
  serviceCount: number;
  route: string;
}

export const marketplaces: Marketplace[] = [
  // DISCERN
  {
    id: "learning",
    phase: "Discern",
    icon: GraduationCap,
    name: "Transformation Methodology & Learning",
    description:
      "Structured pathways for EA literacy, digital transformation fundamentals, and DEWA architecture standards across all divisions.",
    features: ["Courses & Curricula", "Learning Tracks", "Certificates"],
    serviceCount: 25,
    route: "/marketplaces/learning",
  },
  {
    id: "knowledge",
    phase: "Discern",
    icon: BookOpen,
    name: "Knowledge & Best Practices",
    description:
      "DEWA-specific architecture knowledge, governance references, strategy documents, standards, and published design outputs accessible enterprise-wide.",
    features: ["Best Practices", "Design Reports", "Architecture Standards", "Governance Frameworks"],
    serviceCount: 89,
    route: "/marketplaces/knowledge",
  },

  // DESIGN
  {
    id: "document-studio",
    phase: "Design",
    icon: FileText,
    name: "Transformation Artefacts (Document Studio)",
    description:
      "AI-powered document generation fulfilled by the Corporate EA Office with defined SLAs for all DEWA divisions.",
    features: [
      "Application Profiles",
      "Assessments",
    ],
    serviceCount: 8,
    route: "/marketplaces/document-studio",
  },
  {
    id: "solution-specs",
    phase: "Design",
    icon: Layout,
    name: "Solution Specifications",
    description:
      "Standardised architecture blueprints and solution specifications applicable across all DEWA divisions.",
    features: ["Solution Specifications", "Architecture Diagrams", "Component Details"],
    serviceCount: 30,
    route: "/marketplaces/solution-specs",
  },

  // DEPLOY
  {
    id: "solution-build",
    phase: "Deploy",
    icon: Hammer,
    name: "Solution Build",
    description:
      "Build resources, delivery capacity, and implementation support for projects across all DEWA divisions.",
    features: ["Implementation Resources", "Code Samples", "Integration Patterns"],
    serviceCount: 14,
    route: "/marketplaces/solution-build",
  },

  // DRIVE
  {
    id: "initiative-portfolio",
    phase: "Drive",
    icon: RefreshCw,
    name: "Initiative & Programme Portfolio",
    description:
      "Govern initiatives through stage gates, compliance checkpoints, and architecture reviews across enterprise programmes.",
    features: ["Application Lifecycle", "Project Lifecycle", "Compliance Tracking"],
    serviceCount: 12,
    route: "/marketplaces/initiative-portfolio",
  },
  {
    id: "asset-capability",
    phase: "Drive",
    icon: Briefcase,
    name: "Asset & Capability Portfolio",
    description: "Centralised oversight for IT and OT asset portfolios mapped to EA capability domains.",
    features: ["Capability Canvas", "Asset Landscape", "OT/IT Coverage"],
    serviceCount: 11,
    route: "/marketplaces/asset-capability",
  },
  {
    id: "intelligence",
    phase: "Drive",
    icon: BarChart3,
    name: "Transformation Intelligence",
    description:
      "Standing intelligence views and on-demand reports for programme health, maturity progression, and EA data quality.",
    features: [
      "Programme Intelligence",
      "Digital Maturity",
      "On-Demand Reports",
    ],
    serviceCount: 7,
    route: "/marketplaces/intelligence",
  },
  {
    id: "support",
    phase: "Drive",
    icon: HelpCircle,
    name: "Support & Expert Services",
    description: "Platform support, data corrections, expert consultancy, and EA advisory services.",
    features: ["Platform Support", "Data Corrections", "Expert Consultancy"],
    serviceCount: 14,
    route: "/marketplaces/support",
  },
];

export const getMarketplacesByPhase = (phase: Phase): Marketplace[] => {
  return marketplaces.filter((m) => m.phase === phase);
};

export const phases: Phase[] = ["Discern", "Design", "Deploy", "Drive"];

export const phaseColors: Record<Phase, { bg: string; text: string; badge: string }> = {
  Discern: {
    bg: "bg-phase-discern-bg",
    text: "text-phase-discern",
    badge: "badge-discern",
  },
  Design: {
    bg: "bg-phase-design-bg",
    text: "text-phase-design",
    badge: "badge-design",
  },
  Deploy: {
    bg: "bg-phase-deploy-bg",
    text: "text-phase-deploy",
    badge: "badge-deploy",
  },
  Drive: {
    bg: "bg-phase-drive-bg",
    text: "text-phase-drive",
    badge: "badge-drive",
  },
};
