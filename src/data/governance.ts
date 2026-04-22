import {
  BarChart3,
  BookOpen,
  Briefcase,
  FileText,
  GraduationCap,
  Hammer,
  HelpCircle,
  Layout,
  LucideIcon,
  PenTool,
  RefreshCw,
  Rocket,
  Search,
  TrendingUp,
} from "lucide-react";

export interface GovernanceMarketplace {
  name: string;
  route: string;
  icon: LucideIcon;
  reason: string;
}

export interface GovernancePhase {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  subtitle: string;
  description: string;
  deliverables: string[];
  ctaLabel: string;
  route: string;
  whyThisSequence: string;
  whoLeads: string;
  whoParticipates: string[];
  decisions: string[];
  outputs: string[];
  governanceGates: string[];
  marketplaces: GovernanceMarketplace[];
  aeStages: string[];
}

export interface MethodologyStage {
  label: string;
  desc: string;
  phase: string;
  color: string;
}

export interface DetailedMethodologyStep {
  letter: string;
  name: string;
  title: string;
  summary: string;
  whatHappens: string[];
  roles: string[];
  toolsAndMarketplaces: {
    name: string;
    route: string;
    reason: string;
  }[];
  deliverables: string[];
  connectionTo4D: string;
  phaseColor: string;
}

export const governancePhases: GovernancePhase[] = [
  {
    id: "discern",
    name: "Discern",
    icon: Search,
    color: "#6d28d9",
    bgColor: "#f5f3ff",
    borderColor: "#ede9fe",
    subtitle: "Understand & Assess",
    description:
      "Discern is the intelligence phase: the structured effort to understand DEWA's current state before committing to any design decision. Enterprise architects assess capability maturities across all 12 digital domains, document the existing technology landscape, score divisional readiness, and identify the gap set that will drive transformation priorities. Without Discern, every design decision is built on assumption rather than evidence, and the more consequential the assumption, the more expensive the correction.",
    deliverables: [
      "EA maturity assessments per division and domain",
      "Current-state capability register and technology landscape map",
      "Prioritised gap set that becomes the input to capability canvas work",
      "Divisional readiness scores and transformation entry criteria",
    ],
    ctaLabel: "Explore Discern Marketplaces",
    route: "/marketplaces#discern",
    whyThisSequence:
      "Discern must come first because you cannot define a target state without an honest understanding of the current one. Skipping it produces capability canvases that miss real gaps, initiatives that duplicate existing assets, and investment directed at the wrong priorities. Every phase that follows depends on the baseline Discern establishes.",
    whoLeads: "Corporate EA Office",
    whoParticipates: [
      "Divisional EA Liaison Officers execute assessments across divisions",
      "Divisional Transformation Leads provide domain context and validate findings",
      "Senior Architects define scoring frameworks and gap analysis methodology",
    ],
    decisions: [
      "What is DEWA's EA maturity level across each of the 12 capability domains?",
      "Which capability gaps are critical versus acceptable risk?",
      "What is the priority order for addressing those gaps?",
      "Which divisions are ready to enter the Design phase?",
    ],
    outputs: [
      "EA maturity assessments per division and domain",
      "Current-state capability register and technology landscape map",
      "Prioritised gap set that becomes the input to capability canvas work",
      "Divisional readiness scores and transformation entry criteria",
    ],
    governanceGates: [
      "All 12 capability domains assessed across target divisions",
      "Gap prioritisation reviewed and signed off by the Corporate EA Office",
      "Assessment outputs published to the Knowledge marketplace",
      "Divisional readiness confirmed before Design work begins",
    ],
    marketplaces: [
      {
        name: "Transformation Methodology & Learning",
        route: "/marketplaces/learning",
        icon: GraduationCap,
        reason:
          "EA teams use this to access the assessment frameworks, scoring templates, and methodology guidance needed to run structured Discern work across divisions.",
      },
      {
        name: "Knowledge & Best Practices",
        route: "/marketplaces/knowledge",
        icon: BookOpen,
        reason:
          "It houses the reference architectures, governance standards, and precedent decisions that inform how gaps are identified and what good looks like.",
      },
    ],
    aeStages: [
      "A - Strategy: Vision, goals, and strategic commitments",
      "B - Assets: Current state - applications, data, governance assets",
    ],
  },
  {
    id: "design",
    name: "Design",
    icon: PenTool,
    color: "#0369A1",
    bgColor: "#f0f9ff",
    borderColor: "#bae6fd",
    subtitle: "Define & Architect",
    description:
      "Design translates Discern's gap intelligence into architecture. Enterprise architects build the capability canvas across DEWA's 12-domain model, defining what the target state looks like for each domain at the required maturity level. Architecture standards are set, solution blueprints are produced, and transformation artefacts, from assessment reports to design reports, are generated and published. Design is where aspiration becomes architecture: specific, governed, and traceable.",
    deliverables: [
      "Division-specific capability canvas with 12-domain, L0-L5 maturity targets",
      "Architecture blueprints and solution specifications",
      "Transformation artefacts including assessment reports, design reports, and Technology Application Profiles",
      "Published architecture standards that become the compliance baseline for Deploy",
    ],
    ctaLabel: "Explore Design Marketplaces",
    route: "/marketplaces#design",
    whyThisSequence:
      "Design can only be honest if it is grounded in an accurate Discern baseline. Without knowing the current state, you cannot define a meaningful gap. Without the gap, initiative scope cannot be correctly set. Design after Discern ensures every architecture decision is evidence-led, which directly determines the quality of everything built in Deploy.",
    whoLeads: "Enterprise Architects (Corporate EA Office)",
    whoParticipates: [
      "Solution Architects produce blueprints and solution specifications per domain",
      "EA Office Delivery Staff govern artefact generation, quality review, and publication",
      "Divisional Transformation Leads validate relevance of target architectures to divisional context",
    ],
    decisions: [
      "What is the target capability level for each of the 12 domains for this division?",
      "Which architecture standards apply, and are they new or existing?",
      "What artefacts need to be produced and in what order?",
      "Which solution specifications are required before deployment can begin?",
    ],
    outputs: [
      "Division-specific capability canvas with 12-domain, L0-L5 maturity targets",
      "Architecture blueprints and solution specifications",
      "Transformation artefacts including assessment reports, design reports, and Technology Application Profiles",
      "Published architecture standards that become the compliance baseline for Deploy",
    ],
    governanceGates: [
      "Capability canvas approved by the Corporate EA Office",
      "Required architecture standards confirmed and published",
      "All mandated artefacts reviewed, signed off, and published to the marketplace",
      "No deployment work begins without a signed-off target architecture for that domain",
    ],
    marketplaces: [
      {
        name: "Transformation Artefacts (Document Studio)",
        route: "/marketplaces/document-studio",
        icon: FileText,
        reason:
          "This is the primary production and governance mechanism for all artefacts generated in Design, from initial requests through EA Office review to published output.",
      },
      {
        name: "Solution Specifications",
        route: "/marketplaces/solution-specs",
        icon: Layout,
        reason:
          "It houses the architecture blueprints that serve as the technical authority for deployment teams, specifying what must be built, to what standard, and with what integration requirements.",
      },
    ],
    aeStages: ["C - Target: Capability canvas and maturity model - 12 domains, L0-L5"],
  },
  {
    id: "deploy",
    name: "Deploy",
    icon: Rocket,
    color: "#16A34A",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    subtitle: "Build & Activate",
    description:
      "Deploy activates what Design has defined, converting architecture blueprints into operational capabilities, deploying solutions division by division, and governing implementation against the target state. Every deployment is initiated through the EA Office intake process, tracked through defined stage gates, and confirmed as architecture-compliant before progression. Deploy is where the blueprint becomes the building, and where governance disciplines determine whether transformation delivers or drifts.",
    deliverables: [
      "Deployed solutions and activated capabilities across the growing portfolio",
      "Stage-gate completion records with architecture compliance evidence",
      "Integration confirmation across affected systems and divisions",
      "Deployment outcomes documented and traceable to the target capability canvas",
    ],
    ctaLabel: "Explore Deploy Marketplaces",
    route: "/marketplaces#deploy",
    whyThisSequence:
      "Deploying without a Design baseline produces uncoordinated delivery: each project solves its own problem in isolation, accumulates technical debt, creates integration complexity, and wastes investment on capabilities that do not align. Deploy follows Design specifically to ensure every implementation decision is traceable to the approved architecture and deviations are caught at stage gates, not after go-live.",
    whoLeads: "Delivery Teams (divisional and specialist)",
    whoParticipates: [
      "Project Managers govern delivery timelines and stage-gate progression",
      "EA Office Delivery Staff provide architecture oversight, review, and sign-off at each gate",
      "Division Leads confirm operational readiness and divisional acceptance",
      "QA and integration teams validate compliance and integration points",
    ],
    decisions: [
      "Is this solution deployment aligned to the target architecture established in Design?",
      "Has the EA Office reviewed and signed off the deployment approach?",
      "Are all integration points addressed and tested?",
      "Is this deployment ready to progress through each defined stage gate?",
    ],
    outputs: [
      "Deployed solutions and activated capabilities across the growing portfolio",
      "Stage-gate completion records with architecture compliance evidence",
      "Integration confirmation across affected systems and divisions",
      "Deployment outcomes documented and traceable to the target capability canvas",
    ],
    governanceGates: [
      "Architecture sign-off from the EA Office before any deployment begins",
      "Stage-gate completion confirmed at each defined checkpoint with no bypassing",
      "Integration testing completed and evidenced",
      "Deployment outcomes documented and published to the portfolio",
    ],
    marketplaces: [
      {
        name: "Solution Build",
        route: "/marketplaces/solution-build",
        icon: Hammer,
        reason:
          "This is the primary marketplace for initiating and governing build requests, managed through the EA Office intake process with stage-gate tracking throughout the deployment lifecycle.",
      },
    ],
    aeStages: ["D - Initiatives: Gap-derived programmes across People, Process, Technology, Data, Services"],
  },
  {
    id: "drive",
    name: "Drive",
    icon: TrendingUp,
    color: "#D97706",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    subtitle: "Govern & Optimise",
    description:
      "Drive is the continuous governance layer that sustains transformation momentum once programmes are active. It manages the portfolio of live initiatives through stage-gate governance, enforces architecture compliance across all divisions, tracks investment performance against strategic commitments, and produces the transformation intelligence that informs senior leadership decisions. Unlike the other phases, Drive does not complete; it operates continuously, feeding findings back into Discern to re-assess and into Design to refine standards as the enterprise evolves.",
    deliverables: [
      "Programme portfolio governance records across all active initiatives",
      "Architecture compliance reports flagging and resolving deviations across divisions",
      "Transformation intelligence dashboards covering maturity, investment, and KPIs",
      "Updated maturity baseline data re-entered into Discern for the next assessment cycle",
    ],
    ctaLabel: "Explore Drive Marketplaces",
    route: "/marketplaces#drive",
    whyThisSequence:
      "Drive cannot start without a portfolio of initiatives to govern or architecture standards to enforce. But once active, it functions as the feedback loop of the entire 4D model, surfacing compliance risks, performance shortfalls, and strategic drift before they compound. It is the phase that ensures transformation does not stall after initial deployment enthusiasm fades. Drive is intentionally broader than the other phases because enterprise governance has to span portfolio, capability, intelligence, and support.",
    whoLeads: "Corporate EA Office (portfolio governance and intelligence)",
    whoParticipates: [
      "Programme Leads manage initiative delivery and report on milestone progress",
      "Divisional Transformation Leads provide divisional status and flag emerging risks",
      "Senior Leadership consumes intelligence dashboards and makes investment decisions",
      "Support & Expert Services teams provide on-demand advisory and operational assistance to all divisions",
    ],
    decisions: [
      "Are active initiatives performing against architecture and strategy targets?",
      "Which investments should be accelerated, paused, or descoped?",
      "Where are architecture compliance risks emerging, and how are they being resolved?",
      "What does the maturity trajectory look like, and is DEWA on track to EA 4.0?",
    ],
    outputs: [
      "Programme portfolio governance records across all active initiatives",
      "Architecture compliance reports flagging and resolving deviations across divisions",
      "Transformation intelligence dashboards covering maturity, investment, and KPIs",
      "Updated maturity baseline data re-entered into Discern for the next assessment cycle",
    ],
    governanceGates: [
      "Portfolio review cadence maintained so no initiative operates outside the governance rhythm",
      "Stage-gate compliance tracked for all active deployments with deviations escalated",
      "Intelligence dashboards current and accessible to Senior Leadership",
      "Architecture violations identified, logged, and resolved within defined SLA",
    ],
    marketplaces: [
      {
        name: "Initiative & Programme Portfolio",
        route: "/marketplaces/initiative-portfolio",
        icon: RefreshCw,
        reason:
          "This is the core governance mechanism: all active transformation programmes are tracked through stage gates, with investment alignment and architecture compliance visible in one place.",
      },
      {
        name: "Asset & Capability Portfolio",
        route: "/marketplaces/asset-capability",
        icon: Briefcase,
        reason:
          "It tracks the growing catalogue of deployed capabilities against the target canvas, giving leadership a live view of what has been delivered versus what remains.",
      },
      {
        name: "Transformation Intelligence",
        route: "/marketplaces/intelligence",
        icon: BarChart3,
        reason:
          "It surfaces EA maturity progress, initiative performance, and compliance data, turning DTMP governance activity into decision-ready intelligence for leadership.",
      },
      {
        name: "Support & Expert Services",
        route: "/marketplaces/support",
        icon: HelpCircle,
        reason:
          "This is the operational safety net, ensuring divisions across all four phases receive expert EA guidance, technical support, and advisory services throughout the transformation lifecycle.",
      },
    ],
    aeStages: ["E - Deploy: Execution tracking, governance, and performance measurement"],
  },
];

export const methodologyStages: MethodologyStage[] = [
  {
    label: "A - Strategy",
    desc: "Vision, goals, and strategic commitments",
    phase: "Discern",
    color: "#6d28d9",
  },
  {
    label: "B - Assets",
    desc: "Current state - applications, data, governance assets",
    phase: "Discern",
    color: "#6d28d9",
  },
  {
    label: "C - Target",
    desc: "Capability canvas and maturity model - 12 domains, L0-L5",
    phase: "Design",
    color: "#0369A1",
  },
  {
    label: "D - Initiatives",
    desc: "Gap-derived programmes across People, Process, Technology, Data, Services",
    phase: "Deploy",
    color: "#16A34A",
  },
  {
    label: "E - Deploy",
    desc: "Execution tracking, governance, and performance",
    phase: "Drive",
    color: "#D97706",
  },
];

export const detailedMethodologySteps: DetailedMethodologyStep[] = [
  {
    letter: "A",
    name: "Strategy & Context",
    title: "A - Strategy & Context",
    summary:
      "A establishes the mandate for transformation before any architecture work begins. It defines the strategic commitments, executive direction, and enterprise outcomes that the division is expected to support. This is where DTMP work is anchored to Digital DEWA, Smart Grid, Net-Zero 2050, service reliability, and investment priorities, so later delivery decisions are judged against a real strategic frame rather than isolated project demand.",
    whatHappens: [
      "Strategic commitments are translated into architecture questions: what must change, why now, and what business outcomes are non-negotiable.",
      "Executive priorities, divisional context, regulatory pressures, and transformation ambitions are consolidated into a governed starting brief.",
      "Scope boundaries are set early so the programme does not drift into unrelated capability work or duplicate existing initiatives.",
      "Success measures are identified up front so the later portfolio can be evaluated against enterprise value, not only delivery activity.",
    ],
    roles: [
      "Corporate EA Office",
      "Senior Leadership and sponsors",
      "Divisional Transformation Leads",
      "Strategy and planning stakeholders",
    ],
    toolsAndMarketplaces: [
      {
        name: "Knowledge & Best Practices",
        route: "/marketplaces/knowledge",
        reason:
          "Used to ground strategy in existing standards, EA references, governance precedent, and published architecture direction.",
      },
      {
        name: "Transformation Methodology & Learning",
        route: "/marketplaces/learning",
        reason:
          "Provides the common methodology, assessment approach, and literacy needed for teams to frame the work consistently.",
      },
    ],
    deliverables: [
      "Transformation mandate and strategic context brief",
      "Outcome statements and success criteria",
      "Initial scope boundaries and architecture problem framing",
      "Executive-aligned transformation assumptions for the next step",
    ],
    connectionTo4D: "Discern",
    phaseColor: "#6d28d9",
  },
  {
    letter: "B",
    name: "Assets & Current State",
    title: "B - Assets & Current State",
    summary:
      "B documents the real enterprise baseline: applications, assets, data dependencies, governance artefacts, capability maturity, and divisional constraints. It is the evidence layer that turns strategic intent into measurable architecture understanding. Without B, later target-state work becomes guesswork because the team has not proven what exists, what is duplicated, what is weak, and what is already fit for purpose.",
    whatHappens: [
      "The current technology landscape, capability maturity, and asset inventory are reviewed across the relevant division or domain.",
      "Existing initiatives, standards, and architectural decisions are assessed so the team can reuse what already works and expose where gaps are genuine.",
      "Pain points, duplicated systems, weak controls, and maturity shortfalls are translated into an agreed gap set.",
      "Readiness is assessed so only divisions with sufficiently understood baselines move forward into target-state design.",
    ],
    roles: [
      "Corporate EA Office",
      "EA Liaison Officers",
      "Domain and solution architects",
      "Divisional SMEs and service owners",
    ],
    toolsAndMarketplaces: [
      {
        name: "Asset & Capability Portfolio",
        route: "/marketplaces/asset-capability",
        reason:
          "Provides the capability and asset baseline needed to understand what DEWA already operates and where the true gaps are.",
      },
      {
        name: "Knowledge & Best Practices",
        route: "/marketplaces/knowledge",
        reason:
          "Used to compare the current state against existing standards, approved patterns, and prior architecture outputs.",
      },
    ],
    deliverables: [
      "Current-state asset and capability baseline",
      "Gap analysis with maturity findings",
      "Division readiness view",
      "Evidence set that feeds target-state definition",
    ],
    connectionTo4D: "Discern",
    phaseColor: "#6d28d9",
  },
  {
    letter: "C",
    name: "Target Architecture",
    title: "C - Target Architecture",
    summary:
      "C defines what the future state should be and how DEWA intends to govern its delivery. Here the team converts gap evidence into capability targets, standards, blueprints, and artefacts that specify the architecture to be built. The point of C is not to produce abstract documents; it is to create enough clarity and governance authority that delivery teams can move into execution without inventing their own direction.",
    whatHappens: [
      "Capability targets are set across the relevant domains, including maturity expectations, cross-division dependencies, and required standards.",
      "Solution blueprints, architecture artefacts, and design documents are produced with enough precision to guide implementation and review.",
      "The EA Office determines what is mandatory, what is reusable, and where an exception process may be needed.",
      "Target-state outputs are reviewed and published so they become the official input to initiative planning and build activity.",
    ],
    roles: [
      "Enterprise Architects",
      "Solution Architects",
      "EA Office delivery staff",
      "Divisional Transformation Leads",
    ],
    toolsAndMarketplaces: [
      {
        name: "Transformation Artefacts (Document Studio)",
        route: "/marketplaces/document-studio",
        reason:
          "Used to request, produce, review, and publish the governed architecture artefacts required for target-state definition.",
      },
      {
        name: "Solution Specifications",
        route: "/marketplaces/solution-specs",
        reason:
          "Holds the technical blueprints and specifications that define what delivery teams are expected to implement.",
      },
    ],
    deliverables: [
      "Capability canvas and target maturity positions",
      "Architecture standards and design artefacts",
      "Solution blueprints and specifications",
      "Approved target-state package for initiative mobilisation",
    ],
    connectionTo4D: "Design",
    phaseColor: "#0369A1",
  },
  {
    letter: "D",
    name: "Initiatives & Delivery Planning",
    title: "D - Initiatives & Delivery Planning",
    summary:
      "D converts the approved target state into a governed transformation portfolio. This is where the enterprise decides what initiatives exist, how they are sequenced, what dependencies matter, and which programmes should be funded or staged first. The goal is to ensure delivery is shaped by architecture intent, not by whichever demand item arrives with the most urgency.",
    whatHappens: [
      "Gap-derived work is grouped into initiatives, programmes, and delivery packages that can be governed through stage gates.",
      "Dependencies, sequencing, risk, and investment logic are made explicit so the portfolio can be prioritised coherently.",
      "The initiative structure is aligned back to the approved target-state outputs, ensuring every delivery item has architecture lineage.",
      "Ownership and governance checkpoints are set before build activity starts, reducing drift once implementation begins.",
    ],
    roles: [
      "Programme Leads",
      "Project Managers",
      "Corporate EA Office",
      "Divisional Transformation Leads",
    ],
    toolsAndMarketplaces: [
      {
        name: "Initiative & Programme Portfolio",
        route: "/marketplaces/initiative-portfolio",
        reason:
          "Used to stage, govern, prioritise, and track the portfolio of initiatives derived from the architecture gap set.",
      },
      {
        name: "Solution Specifications",
        route: "/marketplaces/solution-specs",
        reason:
          "Provides the technical authority needed to keep initiative scope anchored to the approved design intent.",
      },
    ],
    deliverables: [
      "Initiative portfolio with stage-gate structure",
      "Sequencing and dependency logic",
      "Architecture-to-initiative traceability",
      "Mobilisation plan for governed execution",
    ],
    connectionTo4D: "Deploy",
    phaseColor: "#16A34A",
  },
  {
    letter: "E",
    name: "Deploy, Govern & Measure",
    title: "E - Deploy, Govern & Measure",
    summary:
      "E is where delivery is executed, governed, and measured as a live enterprise system rather than a one-time launch. Solutions are deployed, initiatives are monitored through governance checkpoints, and compliance, maturity movement, and investment value are tracked. E closes the loop by feeding live performance back into the next round of assessment and design refinement.",
    whatHappens: [
      "Solutions move through governed build and deployment with architecture review, evidence, and stage-gate progression.",
      "Portfolio performance, compliance issues, and delivery exceptions are actively monitored rather than reviewed only after the fact.",
      "Leadership intelligence is generated from live initiative and capability data so investment decisions can be adjusted in-flight.",
      "Operational insight is fed back into Discern and Design, making the methodology iterative instead of linear and forgotten after go-live.",
    ],
    roles: [
      "Delivery teams",
      "Programme governance leads",
      "Corporate EA Office",
      "Senior Leadership",
    ],
    toolsAndMarketplaces: [
      {
        name: "Solution Build",
        route: "/marketplaces/solution-build",
        reason:
          "Used to govern implementation and deployment requests as they move into active execution.",
      },
      {
        name: "Transformation Intelligence",
        route: "/marketplaces/intelligence",
        reason:
          "Turns initiative, maturity, and compliance signals into decision-ready views for leadership and the EA Office.",
      },
      {
        name: "Support & Expert Services",
        route: "/marketplaces/support",
        reason:
          "Provides the operational support, advisory intervention, and corrections needed to keep live transformation moving.",
      },
    ],
    deliverables: [
      "Deployed solutions with governance evidence",
      "Performance, compliance, and maturity reporting",
      "Feedback loop into the next assessment cycle",
      "Live transformation intelligence for leadership decisions",
    ],
    connectionTo4D: "Drive",
    phaseColor: "#D97706",
  },
];
