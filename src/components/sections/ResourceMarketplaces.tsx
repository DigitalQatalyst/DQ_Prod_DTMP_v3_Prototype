import { useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, BookOpen, FileText, Layout, Hammer,
  RefreshCw, Briefcase, BarChart3, HelpCircle, ChevronRight, ArrowRight,
} from "lucide-react";
import { SectionPill, IconBadge } from "@/components/landing/shared";
import { landingColors, landingGradients } from "@/components/landing/theme";

const phaseColors: Record<string, string> = {
  Discern: "#0f766e",
  Design: "#0369A1",
  Deploy: "#16A34A",
  Drive: "#0f766e",
};

const marketplaces = [
  {
    id: "learning",
    phase: "Discern",
    icon: GraduationCap,
    name: "Transformation Methodology & Learning",
    description: "Structured learning tracks for EA literacy, digital transformation, and DEWA architecture standards - built for every role across all divisions.",
    audience: "All DEWA staff",
    cta: "Explore Learning",
    route: "/marketplaces/learning",
  },
  {
    id: "knowledge",
    phase: "Discern",
    icon: BookOpen,
    name: "Knowledge & Best Practices",
    description: "DEWA-specific architecture references, governance frameworks, strategy documents, and published design standards - accessible enterprise-wide.",
    audience: "Architects, analysts & EA practitioners",
    cta: "Browse Knowledge",
    route: "/marketplaces/knowledge",
  },
  {
    id: "document-studio",
    phase: "Design",
    icon: FileText,
    name: "Transformation Artefacts (Document Studio)",
    description: "AI-powered document generation fulfilled by the Corporate EA Office - architecture assessments, application profiles, and governance documents with defined SLAs.",
    audience: "EA practitioners, project teams",
    cta: "Open Document Studio",
    route: "/marketplaces/document-studio",
  },
  {
    id: "solution-specs",
    phase: "Design",
    icon: Layout,
    name: "Solution Specifications",
    description: "Standardised architecture blueprints and solution specifications - reusable reference designs applicable across all DEWA divisions and programmes.",
    audience: "Solution architects, integration leads",
    cta: "Browse Specifications",
    route: "/marketplaces/solution-specs",
  },
  {
    id: "solution-build",
    phase: "Deploy",
    icon: Hammer,
    name: "Solution Build",
    description: "Build resources, delivery capacity, and implementation support - for projects across all DEWA divisions governed through the EA Office intake process.",
    audience: "Delivery teams, project managers",
    cta: "Request Build Support",
    route: "/marketplaces/solution-build",
  },
  {
    id: "initiative-portfolio",
    phase: "Drive",
    icon: RefreshCw,
    name: "Initiative & Programme Portfolio",
    description: "Govern initiatives through stage gates, compliance checkpoints, and architecture reviews across enterprise programmes.",
    audience: "Programme managers, EA Office",
    cta: "Open Portfolio",
    route: "/marketplaces/initiative-portfolio",
  },
  {
    id: "asset-capability",
    phase: "Drive",
    icon: Briefcase,
    name: "Asset & Capability Portfolio",
    description: "Centralised IT and OT asset landscape mapped to EA capability domains - from SCADA systems and substations to enterprise applications.",
    audience: "Portfolio managers, Division leads",
    cta: "View Asset Portfolio",
    route: "/marketplaces/asset-capability",
  },
  {
    id: "intelligence",
    phase: "Drive",
    icon: BarChart3,
    name: "Transformation Intelligence",
    description: "Standing intelligence views and on-demand reports - programme health, maturity progression, and EA data quality for decision-makers.",
    audience: "EA Office, Leadership, Analysts",
    cta: "View Intelligence",
    route: "/marketplaces/intelligence",
  },
  {
    id: "support",
    phase: "Drive",
    icon: HelpCircle,
    name: "Support & Expert Services",
    description: "Platform support, data corrections, and expert EA consultancy - from architecture queries to hands-on advisory across all DEWA divisions.",
    audience: "All DEWA staff",
    cta: "Get Support",
    route: "/marketplaces/support",
  },
];

const phases = ["All", "Discern", "Design", "Deploy", "Drive"];

export function ResourceMarketplaces() {
  const [activePhase, setActivePhase] = useState("All");

  const filtered =
    activePhase === "All"
      ? marketplaces
      : marketplaces.filter((m) => m.phase === activePhase);

  return (
    <section id="marketplaces" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <SectionPill label="Marketplace" />
        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 text-center mb-3">
          The 4D EA Marketplace Architecture
        </h2>
        <p className="text-slate-500 text-center max-w-2xl mx-auto mb-8 text-sm leading-relaxed">
          A specialised environment for every stage of architecture work - whether you&apos;re
          building capability, designing solutions, or governing delivery.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {phases.map((phase) => (
            <button
              key={phase}
              onClick={() => setActivePhase(phase)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
              style={
                activePhase === phase
                  ? { background: landingGradients.secondary, color: "#fff" }
                  : { background: "#f1f5f9", color: "#64748b" }
              }
            >
              {phase === "All" ? "All Phases" : phase}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {filtered.map((mp) => {
            const Icon = mp.icon;
            return (
              <div
                key={mp.id}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col transition-all"
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "8px 12px 32px rgba(6,95,70,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "")}
              >
                <IconBadge icon={<Icon size={18} className="text-white transition-transform group-hover:scale-110" />} />
                <p
                  className="text-xs font-bold uppercase tracking-widest mt-4 mb-1"
                  style={{ color: phaseColors[mp.phase] }}
                >
                  {mp.phase}
                </p>
                <h3 className="font-bold text-slate-800 mb-2 text-base leading-tight">{mp.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-2">{mp.description}</p>
                <p className="text-xs text-slate-400 mb-4">For: {mp.audience}</p>
                <Link
                  to={mp.route}
                  className="text-sm font-semibold inline-flex items-center gap-1 transition-colors"
                  style={{ color: landingColors.teal }}
                >
                  {mp.cta} <ChevronRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            to="/marketplaces"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: landingGradients.secondary }}
          >
            Explore All Marketplaces <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
