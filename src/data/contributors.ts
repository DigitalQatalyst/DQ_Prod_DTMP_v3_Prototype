import {
  Building2,
  Crown,
  PenTool,
  Bot,
  Users,
  Shield,
  LucideIcon,
} from "lucide-react";

export interface Contributor {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  role: string;
  description: string;
  contributions: string[];
  ctaLabel: string;
  ctaRoute: string;
}

export const contributors: Contributor[] = [
  {
    id: "corporate-ea",
    name: "Enterprise Architect / EA Office",
    icon: Building2,
    color: "text-phase-design",
    role: "Enterprise Governance Owner",
    description:
      "The authority behind DTMP — setting the standards, governing the platform, and ensuring every architecture decision across DEWA is traceable and compliant.",
    contributions: [
      "Set and enforce enterprise EA standards",
      "Manage cross-division architecture repository",
      "Track transformation KPIs enterprise-wide",
      "Report Net-Zero architecture alignment",
    ],
    ctaLabel: "Enter Corporate EA Dashboard",
    ctaRoute: "/stage3/dashboard",
  },
  {
    id: "executive",
    name: "Senior Leadership & Executive Stakeholders",
    icon: Crown,
    color: "text-blue-accent",
    role: "CEO, CDO, CIO, CTO, Strategy Office",
    description:
      "Where architecture decisions become strategic investments — portfolio oversight, cross-division prioritisation, and Net-Zero 2050 milestone governance.",
    contributions: [
      "Enterprise portfolio governance",
      "Cross-division investment prioritisation",
      "Transformation programme oversight",
      "Net-Zero milestone tracking",
    ],
    ctaLabel: "View Transformation Intelligence",
    ctaRoute: "/marketplaces/intelligence",
  },
  {
    id: "division-leads",
    name: "Divisional Transformation Leads",
    icon: PenTool,
    color: "text-green",
    role: "EA Leads and Solution Architects",
    description:
      "The connective tissue between corporate standards and divisional delivery — translating enterprise mandates into governed, reusable architecture at the division level.",
    contributions: [
      "Apply enterprise standards divisionally",
      "Contribute to shared blueprint library",
      "Review and approve divisional solutions",
      "Escalate cross-division dependencies",
    ],
    ctaLabel: "View Programme Portfolio",
    ctaRoute: "/marketplaces/initiative-portfolio",
  },
  {
    id: "project-managers",
    name: "Project Managers & Programme Leads",
    icon: Bot,
    color: "text-phase-drive",
    role: "Programme and Project Management",
    description:
      "Governing DEWA's most critical programmes — from initiative intake through stage-gate governance to delivery and closure, all tracked through DTMP.",
    contributions: [
      "Initiative stage gate governance",
      "Programme milestone tracking",
      "Delivery team coordination",
      "Risk and dependency management",
    ],
    ctaLabel: "View Programme Portfolio",
    ctaRoute: "/marketplaces/initiative-portfolio",
  },
  {
    id: "to-delivery",
    name: "Transformation Office — Delivery & Admin",
    icon: Users,
    color: "text-blue-accent",
    role: "T-Office Delivery and Administration",
    description:
      "The teams that turn architecture decisions into delivered outcomes — governed through DTMP from request to build to lifecycle.",
    contributions: [
      "Request fulfilment and artefact generation",
      "Submit document generation requests",
      "Track initiative progress vs standards",
      "Access build and delivery resources",
    ],
    ctaLabel: "Enter the Transformation Office",
    ctaRoute: "/stage3/dashboard",
  },
  {
    id: "general-staff",
    name: "General Staff",
    icon: Shield,
    color: "text-phase-drive",
    role: "All DEWA Employees",
    description:
      "Access DEWA's transformation knowledge, understand how your division is progressing, and engage with the platform as your transformation literacy grows.",
    contributions: [
      "Access transformation knowledge",
      "Understand divisional programmes",
      "Engage with learning pathways",
      "Submit support requests",
    ],
    ctaLabel: "Browse Knowledge & Best Practices",
    ctaRoute: "/marketplaces/knowledge",
  },
];
