import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SectionPill } from "@/components/landing/shared";
import { detailedMethodologySteps, methodologyStages } from "@/data/governance";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section
          className="relative overflow-hidden py-16 lg:py-24"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 48%, #0f766e 100%)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 30%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "auto, 44px 44px, 44px 44px",
            }}
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
            <div className="max-w-4xl">
              <SectionPill label="Reference Methodology" />
              <h1 className="mt-6 text-4xl lg:text-6xl font-bold text-white leading-tight">
                The A-E Methodology
              </h1>
              <p className="mt-5 text-base lg:text-lg text-white/75 max-w-3xl leading-relaxed">
                Strategy to deployment is not handled as a single step inside DTMP. The A-E
                methodology is the delivery reference that explains how DEWA moves from strategic
                intent, through current-state evidence and target architecture, into governed
                initiatives and live execution.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/4d-model"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to 4D Governance Model
                </Link>
                <Link
                  to="/marketplaces"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 transition-colors"
                >
                  Explore DTMP Marketplaces
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-slate-50 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {methodologyStages.map((stage) => (
                <div
                  key={stage.label}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center"
                      style={{ background: stage.color }}
                    >
                      {stage.label.split(" ")[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{stage.label}</p>
                      <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: stage.color }}>
                        {stage.phase}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="mb-12">
              <SectionPill label="Step-by-Step Reference" />
              <h2 className="mt-4 text-3xl lg:text-4xl font-bold text-slate-900">
                How each step works
              </h2>
              <p className="mt-3 max-w-3xl text-sm lg:text-base text-slate-600 leading-relaxed">
                Each step is a governed handoff. The outputs of one step become the controlled
                input to the next, so delivery is traceable from executive intent to deployed
                capability.
              </p>
            </div>

            <div className="space-y-8">
              {detailedMethodologySteps.map((step, index) => (
                <section
                  key={step.letter}
                  className="rounded-[28px] border border-slate-200 overflow-hidden shadow-sm"
                >
                  <div
                    className="px-6 lg:px-8 py-6"
                    style={{ background: `${step.phaseColor}12`, borderBottom: `1px solid ${step.phaseColor}30` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-12 h-12 rounded-2xl text-white font-bold text-lg flex items-center justify-center"
                            style={{ background: step.phaseColor }}
                          >
                            {step.letter}
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: step.phaseColor }}>
                              Step {step.letter}
                            </p>
                            <h3 className="text-2xl font-bold text-slate-900">{step.name}</h3>
                          </div>
                        </div>
                        <p className="text-sm lg:text-base text-slate-700 leading-relaxed">
                          {step.summary}
                        </p>
                      </div>
                      <div className="lg:w-56 shrink-0">
                        <div className="rounded-2xl bg-white border border-slate-200 px-4 py-4">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">
                            Connection to 4D
                          </p>
                          <div
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]"
                            style={{ color: step.phaseColor, background: `${step.phaseColor}15` }}
                          >
                            {step.connectionTo4D}
                          </div>
                          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                            {index === 0
                              ? "This is where the governance cycle is framed and launched."
                              : "This step sits inside the wider 4D model and inherits its governance gates."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 lg:px-8 py-6 grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">
                        What happens at this step
                      </p>
                      <ul className="space-y-2">
                        {step.whatHappens.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                            <span
                              className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                              style={{ background: step.phaseColor }}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">
                        Who does it
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {step.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 lg:px-8 py-6 grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">
                        Tools and marketplaces used
                      </p>
                      <div className="space-y-3">
                        {step.toolsAndMarketplaces.map((tool) => (
                          <div
                            key={tool.name}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                          >
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <p className="text-sm font-semibold text-slate-900">{tool.name}</p>
                              <Link
                                to={tool.route}
                                className="inline-flex items-center gap-1 text-xs font-semibold"
                                style={{ color: step.phaseColor }}
                              >
                                Open
                                <ArrowRight size={12} />
                              </Link>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{tool.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">
                        Typical deliverables
                      </p>
                      <ul className="space-y-2">
                        {step.deliverables.map((deliverable) => (
                          <li
                            key={deliverable}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 leading-relaxed"
                          >
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
