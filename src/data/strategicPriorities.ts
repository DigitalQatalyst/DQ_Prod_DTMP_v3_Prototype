export const STRATEGIC_PRIORITIES = [
  {
    number: "01",
    category: "Governance",
    title: "One Architecture Standard",
    slug: "one-architecture-standard",
    body: "No division operates outside the enterprise architecture framework. All six divisions, one governance model, no conflicting standards.",
    kpi: "KPI: Cross-Division EA Compliance Rate >=95%",
  },
  {
    number: "02",
    category: "Investment",
    title: "Investment Governed Upfront",
    slug: "investment-governed-upfront",
    body: "No significant technology spend is approved without EA review. Architecture decisions are made before money is committed, not after.",
    kpi: "KPI: 100% of Major Investments Architecture-Reviewed",
  },
  {
    number: "03",
    category: "Alignment",
    title: "Programmes in One Direction",
    slug: "programmes-in-one-direction",
    body: "Smart Grid, Solar Park, AI, and Digital Services are governed as a coherent portfolio. No programme creates architectural debt for another.",
    kpi: "KPI: Programme Architecture Alignment Score >=90%",
  },
  {
    number: "04",
    category: "Sustainability",
    title: "Net-Zero by Design",
    slug: "net-zero-by-design",
    body: "Sustainability is not a constraint added at the end. It is a design parameter assessed at architecture stage for every solution.",
    kpi: "KPI: 100% of Solutions Net-Zero Impact Assessed",
  },
  {
    number: "05",
    category: "Capability",
    title: "AI Readiness First",
    slug: "ai-readiness-first",
    body: "No division deploys AI without a governed architecture in place. No shadow AI. No ungoverned pilots reaching production.",
    kpi: "KPI: AI Readiness Baseline Across All 6 Divisions",
  },
  {
    number: "06",
    category: "Reliability",
    title: "Reliability Never Compromised",
    slug: "reliability-never-compromised",
    body: "Every architecture change is assessed against service continuity. Reliability is protected at design stage, not recovered after failure.",
    kpi: "KPI: Architecture-Linked Service Continuity >=99.9%",
  },
] as const;

export type StrategicPriority = (typeof STRATEGIC_PRIORITIES)[number];
export type StrategicPrioritySlug = StrategicPriority["slug"];

export const STRATEGIC_PRIORITY_BY_SLUG: Record<StrategicPrioritySlug, StrategicPriority> =
  STRATEGIC_PRIORITIES.reduce((acc, priority) => {
    acc[priority.slug] = priority;
    return acc;
  }, {} as Record<StrategicPrioritySlug, StrategicPriority>);

export function isStrategicPrioritySlug(value: string | null | undefined): value is StrategicPrioritySlug {
  if (!value) return false;
  return value in STRATEGIC_PRIORITY_BY_SLUG;
}
