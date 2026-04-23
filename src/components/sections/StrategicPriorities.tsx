import { Link } from "react-router-dom";
import {
  Shield,
  Globe,
  Zap,
  BarChart2,
  Brain,
  Star,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { SectionPill, IconBadge } from "@/components/landing/shared";
import { STRATEGIC_PRIORITIES } from "@/data/strategicPriorities";
import { landingColors, landingGradients } from "@/components/landing/theme";

const priorities = [
  { ...STRATEGIC_PRIORITIES[0], icon: Shield },
  { ...STRATEGIC_PRIORITIES[1], icon: BarChart2 },
  { ...STRATEGIC_PRIORITIES[2], icon: Globe },
  { ...STRATEGIC_PRIORITIES[3], icon: Zap },
  { ...STRATEGIC_PRIORITIES[4], icon: Brain },
  { ...STRATEGIC_PRIORITIES[5], icon: Star },
];

export function StrategicPriorities() {
  return (
    <section className="py-20" style={{ background: landingColors.surface }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <SectionPill label="Enterprise Priorities" />
        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 text-center mb-3">
          Enterprise Strategic Priorities
        </h2>
        <p className="text-slate-500 text-center max-w-2xl mx-auto mb-12 text-sm leading-relaxed">
          Measurable outcomes the EA Office governs for DEWA, each with a defined KPI,
          enforced through DTMP, and traceable to an architecture decision.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {priorities.map((priority) => {
            const Icon = priority.icon;

            return (
              <Link
                key={priority.number}
                to={`/marketplaces/initiative-portfolio?priority=${priority.slug}`}
                className="group block bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative transition-all focus:outline-none focus:ring-2 focus:ring-emerald-200"
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "6px 8px 24px rgba(6,95,70,0.16)";
                  const badge = e.currentTarget.querySelector("[data-priority-badge]") as HTMLSpanElement | null;
                  const link = e.currentTarget.querySelector("[data-priority-link]") as HTMLSpanElement | null;
                  if (badge) {
                    badge.style.background = landingColors.teal;
                    badge.style.color = "#ffffff";
                  }
                  if (link) link.style.color = landingColors.teal;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "";
                  const badge = e.currentTarget.querySelector("[data-priority-badge]") as HTMLSpanElement | null;
                  const link = e.currentTarget.querySelector("[data-priority-link]") as HTMLSpanElement | null;
                  if (badge) {
                    badge.style.background = "";
                    badge.style.color = "";
                  }
                  if (link) link.style.color = "";
                }}
              >
                <span
                  data-priority-badge
                  className="absolute top-4 right-4 text-xs text-slate-400 bg-slate-100 rounded-md px-2 py-1 transition-all"
                >
                  {priority.number}
                </span>
                <div className="transition-transform group-hover:scale-110 origin-left w-fit">
                  <IconBadge icon={<Icon size={18} className="text-white" />} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest mt-4 mb-1 text-slate-400">
                  {priority.category}
                </p>
                <h3 className="font-bold text-slate-800 mb-2 text-base">{priority.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{priority.body}</p>
                <p className="text-xs font-semibold mb-3" style={{ color: landingColors.teal }}>
                  {priority.kpi}
                </p>
                <span
                  data-priority-link
                  className="text-xs font-semibold inline-flex items-center gap-1 text-slate-400 transition-colors"
                >
                  View Active Projects <ChevronRight size={12} />
                </span>
              </Link>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/marketplaces/initiative-portfolio"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: landingGradients.secondary }}
          >
            See What&apos;s Being Delivered <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
