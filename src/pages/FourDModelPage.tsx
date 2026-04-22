import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SectionPill } from "@/components/landing/shared";
import { landingColors, landingGradients } from "@/components/landing/theme";
import { governancePhases } from "@/data/governance";

export default function FourDModelPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section
          className="relative py-14 lg:py-20 overflow-hidden"
          style={{ background: landingGradients.hero }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
          <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10 text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#a7f3d0" }} />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                Governance Framework
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
              The 4D Governance Model
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
              Discern. Design. Deploy. Drive. The four-phase framework that structures DEWA&apos;s
              enterprise architecture governance and organises every DTMP marketplace.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-14">
              <SectionPill label="The Four Phases" />
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
                Phase-by-Phase Explanation
              </h2>
              <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
                Each phase explains what happens, why it sits where it does in the sequence, who
                governs it, what decisions are made, what leaves it, and which marketplaces are
                active and why.
              </p>
            </div>

            <div className="space-y-12">
              {governancePhases.map((phase) => {
                const Icon = phase.icon;

                return (
                  <div
                    key={phase.id}
                    className="rounded-2xl border overflow-hidden"
                    style={{ borderColor: phase.borderColor, background: phase.bgColor }}
                  >
                    <div
                      className="px-8 py-5 flex items-center gap-4"
                      style={{ borderBottom: `1px solid ${phase.borderColor}` }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: phase.color }}
                      >
                        <Icon size={22} className="text-white" />
                      </div>
                      <div>
                        <p
                          className="text-xs font-bold uppercase tracking-widest mb-0.5"
                          style={{ color: phase.color }}
                        >
                          {phase.name}
                        </p>
                        <h3 className="text-xl font-bold text-slate-900">{phase.subtitle}</h3>
                      </div>
                    </div>

                    <div
                      className="px-8 pt-6 pb-4"
                      style={{ borderBottom: `1px solid ${phase.borderColor}` }}
                    >
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-2"
                        style={{ color: phase.color }}
                      >
                        What This Phase Is
                      </p>
                      <p className="text-slate-700 text-sm leading-relaxed">{phase.description}</p>
                    </div>

                    <div
                      className="px-8 py-4 bg-white/50"
                      style={{ borderBottom: `1px solid ${phase.borderColor}` }}
                    >
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                        Why It Sits Here in the Sequence
                      </p>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {phase.whyThisSequence}
                      </p>
                    </div>

                    <div
                      className="px-8 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6"
                      style={{ borderBottom: `1px solid ${phase.borderColor}` }}
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                          Decisions Made Here
                        </p>
                        <ul className="space-y-1.5">
                          {phase.decisions.map((decision) => (
                            <li
                              key={decision}
                              className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                style={{ background: phase.color }}
                              />
                              {decision}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                          What the Outputs Are
                        </p>
                        <ul className="space-y-1.5">
                          {phase.outputs.map((output) => (
                            <li
                              key={output}
                              className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                style={{ background: phase.color }}
                              />
                              {output}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div
                      className="px-8 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6"
                      style={{ borderBottom: `1px solid ${phase.borderColor}` }}
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                          Who Leads
                        </p>
                        <p className="text-sm font-semibold mb-2" style={{ color: phase.color }}>
                          {phase.whoLeads}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          Who Participates
                        </p>
                        <ul className="space-y-1">
                          {phase.whoParticipates.map((participant) => (
                            <li
                              key={participant}
                              className="text-xs text-slate-500 leading-relaxed flex items-start gap-1.5"
                            >
                              <span className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                              {participant}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                          Governance Gates
                        </p>
                        <ul className="space-y-1.5">
                          {phase.governanceGates.map((gate) => (
                            <li
                              key={gate}
                              className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                                style={{ background: phase.color }}
                              />
                              {gate}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="px-8 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                          Active Marketplaces
                        </p>
                        <div className="space-y-3">
                          {phase.marketplaces.map((marketplace) => {
                            const MarketplaceIcon = marketplace.icon;

                            return (
                              <div key={marketplace.route}>
                                <Link
                                  to={marketplace.route}
                                  className="flex items-center gap-2 text-sm font-semibold hover:underline transition-colors"
                                  style={{ color: phase.color }}
                                >
                                  <MarketplaceIcon size={14} />
                                  {marketplace.name}
                                </Link>
                                <p className="text-xs text-slate-400 mt-0.5 ml-5 leading-relaxed">
                                  {marketplace.reason}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                          A-E Stage Mapping
                        </p>
                        {phase.aeStages.map((stage) => (
                          <p key={stage} className="text-xs text-slate-500 leading-relaxed mb-1">
                            {stage}
                          </p>
                        ))}
                        <div className="mt-4">
                          <Link
                            to={phase.route}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline transition-colors"
                            style={{ color: phase.color }}
                          >
                            {phase.ctaLabel} <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20" style={{ background: landingColors.surface }}>
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="text-center">
              <SectionPill label="Methodology Connection" />
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
                The A-E Methodology
              </h2>
              <p className="text-slate-600 text-sm lg:text-base max-w-2xl mx-auto leading-relaxed">
                The 4D model explains the governance logic of transformation. The A-E methodology
                explains the delivery sequence that carries a DEWA division from strategic context,
                through current-state evidence and target architecture, into governed initiatives
                and live deployment.
              </p>
              <p className="mt-4 text-slate-500 text-sm lg:text-base max-w-2xl mx-auto leading-relaxed">
                Read the dedicated methodology reference to see what happens at each step, who is
                involved, which marketplaces are active, and what deliverables move forward into the
                next phase.
              </p>
              <div className="mt-8">
                <Link
                  to="/methodology"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm text-white"
                  style={{ background: landingGradients.secondary }}
                >
                  Explore the Full A-E Methodology <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          className="py-16"
          style={{ background: landingGradients.darkCta }}
        >
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Explore by Phase</h2>
            <p className="text-white/60 text-sm mb-8">
              Navigate directly to the marketplaces organised under each 4D phase.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {governancePhases.map((phase) => (
                <Link
                  key={phase.id}
                  to={phase.route}
                  className="flex flex-col items-center gap-2 px-4 py-5 rounded-xl font-semibold text-sm text-white transition-all hover:bg-white/20"
                  style={{
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: phase.color }}
                  >
                    <phase.icon size={18} className="text-white" />
                  </span>
                  {phase.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
