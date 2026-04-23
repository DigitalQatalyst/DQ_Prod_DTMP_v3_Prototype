import { Link } from "react-router-dom";
import { ArrowRight, Brain, Globe, Monitor, Shield, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { landingGradients } from "@/components/landing/theme";

const streams = [
  {
    id: "dxp",
    code: "DXP",
    name: "Digital Experience Platform",
    icon: Globe,
    color: "#0369A1",
    bg: "#f0f9ff",
    border: "#bae6fd",
    tagline: "Omnichannel Customer Experience & Services 360",
    description:
      "DXP transforms how DEWA's 1.27 million customers and external stakeholders interact with DEWA services across every digital channel — web, mobile, smart meter portal, and integrated UAE government platforms. The programme drives DEWA's vision of a frictionless, proactive customer experience: from AI-assisted service requests to real-time account visibility and multi-channel service fulfilment.",
    scope: [
      "Unified customer journey orchestration across web, mobile, and smart meter channels",
      "Services 360 architecture — end-to-end customer service request intake, routing, and fulfilment",
      "Rammas AI conversational platform integration with customer service workflows",
      "UAE Pass, mDrive, and federal digital identity infrastructure integration",
      "Smart meter data integration with customer-facing consumption analytics and billing",
      "Accessibility compliance and Arabic-first digital service design governance",
    ],
    platformConnections: [
      { name: "Initiative & Programme Portfolio", route: "/marketplaces/initiative-portfolio", reason: "DXP initiatives tracked through stage-gate lifecycle from intake to delivery" },
      { name: "Asset & Capability Portfolio", route: "/marketplaces/asset-capability", reason: "Customer-facing digital assets catalogued and governed across the capability register" },
      { name: "Knowledge & Best Practices", route: "/marketplaces/knowledge", reason: "Customer experience architecture standards and omnichannel design patterns" },
    ],
    ctaLabel: "View DXP Initiatives",
    ctaRoute: "/marketplaces/initiative-portfolio",
  },
  {
    id: "dws",
    code: "DWS",
    name: "Digital Workspace",
    icon: Monitor,
    color: "#0D9488",
    bg: "#f0fdfa",
    border: "#99f6e4",
    tagline: "Digital Workplace, Collaboration & Back-Office Operations",
    description:
      "DWS governs how DEWA's people work — the internal digital environment that every employee across all divisions depends on daily. This stream covers enterprise collaboration platforms, unified communications, employee experience, and the core back-office systems that run DEWA's operations: HR, Finance, Procurement, and Supply Chain. DWS ensures the digital workplace is governed, interoperable, and aligned to the enterprise architecture — so operational efficiency and employee experience improve together.",
    scope: [
      "Enterprise collaboration and unified communications — Microsoft 365, Teams, and productivity platform governance",
      "Employee Experience Platform (EXP) — digital workplace configuration, self-service HR portals, and employee engagement tools",
      "ERP architecture and governance — HR, Finance, Procurement, and Supply Chain systems across all divisions",
      "Enterprise content management and document management platform architecture",
      "Back-office process automation — BPM, workflow orchestration, and digital forms across DEWA operational functions",
      "DEWA Academy and learning technology platform architecture — LMS governance and digital learning infrastructure",
    ],
    platformConnections: [
      { name: "Initiative & Programme Portfolio", route: "/marketplaces/initiative-portfolio", reason: "DWS workplace and back-office initiatives managed through the full programme lifecycle" },
      { name: "Asset & Capability Portfolio", route: "/marketplaces/asset-capability", reason: "Enterprise collaboration and ERP assets catalogued across the capability register" },
      { name: "Division Landing — Business Support & HR", route: "/divisions/business-support-hr", reason: "DWS is most active in Business Support — HR platforms, procurement systems, and DEWA Academy" },
    ],
    ctaLabel: "View DWS Initiatives",
    ctaRoute: "/marketplaces/initiative-portfolio",
  },
  {
    id: "dia",
    code: "DIA",
    name: "Digital Intelligence & Analytics",
    icon: Brain,
    color: "#6d28d9",
    bg: "#f5f3ff",
    border: "#ede9fe",
    tagline: "AI, Data Platforms & Enterprise Analytics",
    description:
      "DIA is DEWA's stream for enterprise AI, analytics, and data platform transformation. It covers the architecture and governance of DEWA's AI capabilities, the enterprise data layer, and the analytics infrastructure supporting every division — from Virtual Engineer and Rammas to predictive grid intelligence, sustainability reporting, and data-driven operations across the entire DEWA enterprise.",
    scope: [
      "Enterprise AI platform architecture and governance — Virtual Engineer, Rammas, and AI model lifecycle management",
      "Enterprise data platform architecture — data lake, master data management, and data integration frameworks",
      "Operational analytics for grid, water, customer, and sustainability programmes",
      "Predictive maintenance intelligence — fault prediction, energy forecasting, and asset health monitoring",
      "Responsible AI governance — bias management, transparency controls, and AI review board compliance",
      "Data product development and analytics-as-a-service for DEWA division intelligence teams",
    ],
    platformConnections: [
      { name: "Transformation Intelligence", route: "/marketplaces/intelligence", reason: "DIA analytics outputs feed directly into the intelligence marketplace dashboards" },
      { name: "Asset & Capability Portfolio", route: "/marketplaces/asset-capability", reason: "AI and data platform assets catalogued and maturity-tracked across the capability register" },
      { name: "Knowledge & Best Practices", route: "/marketplaces/knowledge", reason: "AI governance frameworks, data architecture standards, and responsible AI policies" },
    ],
    ctaLabel: "View DIA Intelligence",
    ctaRoute: "/marketplaces/intelligence",
  },
  {
    id: "sdo",
    code: "SDO",
    name: "Security & DevOps",
    icon: Shield,
    color: "#B45309",
    bg: "#fffbeb",
    border: "#fde68a",
    tagline: "Cybersecurity, IT Infrastructure & Secure Delivery",
    description:
      "SDO is the foundational technology stream that every other DEWA execution stream depends on. It governs the IT infrastructure, cybersecurity architecture, and delivery automation that underpin DEWA's entire digital estate — from cloud and network architecture to identity management, secure API integration, and the IT/OT security convergence that protects DEWA's operational technology across power generation, transmission, and water divisions.",
    scope: [
      "Digital IT infrastructure and cloud platform governance — on-premise, Moro Hub, and hybrid cloud architecture",
      "Cybersecurity architecture: zero trust framework, network segmentation, and OT/IT security convergence (IEC 62443 compliance)",
      "Identity and access management (IAM) — federated identity, privileged access governance, and UAE Pass enterprise integration",
      "Interoperability and integration architecture — API gateway governance, enterprise service bus, and event-driven integration standards",
      "Automation and DevOps governance — CI/CD pipeline standards, BPM orchestration, and secure delivery practices across all DEWA programmes",
      "IT/OT security convergence for operational divisions — protecting SCADA, DCS, and plant control systems across Generation, Transmission, and Water",
    ],
    platformConnections: [
      { name: "Initiative & Programme Portfolio", route: "/marketplaces/initiative-portfolio", reason: "Security and infrastructure initiatives tracked through the full programme lifecycle" },
      { name: "Knowledge & Best Practices", route: "/marketplaces/knowledge", reason: "Zero trust standards, IT/OT security frameworks, and cybersecurity architecture governance documents" },
      { name: "Asset & Capability Portfolio", route: "/marketplaces/asset-capability", reason: "IT infrastructure and security platform assets catalogued and lifecycle-governed" },
    ],
    ctaLabel: "View SDO Initiatives",
    ctaRoute: "/marketplaces/initiative-portfolio",
  },
];

export default function ExecutionStreamsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">

        {/* ── Hero ── */}
        <section
          className="relative py-14 lg:py-20 overflow-hidden"
          style={{ background: landingGradients.hero }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
          <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10 text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/50">DBP Execution Streams</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
              DEWA's Four Strategic Digital Programmes
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
              DXP, DWS, DIA, and SDO — Digital Experience Platform, Digital Workspace, Digital Intelligence & Analytics, and Security & DevOps — are the four execution streams that deliver DEWA's Digital Business Platform, each governed through DTMP's transformation management layer.
            </p>
          </div>
        </section>

        {/* ── Context strip ── */}
        <section className="py-10 border-b border-slate-100" style={{ background: "#f8fafc" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <p className="text-slate-600 text-sm text-center max-w-3xl mx-auto leading-relaxed">
              The DTMP acts as the governance layer above these four execution streams — ensuring every initiative, asset, and architecture decision within DXP, DWS, DIA, and SDO is structured, traceable, and aligned to DEWA's enterprise standards and strategic commitments.
            </p>
          </div>
        </section>

        {/* ── Stream Cards ── */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="space-y-10">
              {streams.map((stream) => {
                const Icon = stream.icon;
                return (
                  <div
                    key={stream.id}
                    className="rounded-2xl border overflow-hidden"
                    style={{ borderColor: stream.border, background: stream.bg }}
                  >
                    {/* Stream header */}
                    <div className="px-8 py-6 flex items-start gap-5" style={{ borderBottom: `1px solid ${stream.border}` }}>
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-white"
                        style={{ background: stream.color }}
                      >
                        <Icon size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span
                            className="text-lg font-black tracking-wider"
                            style={{ color: stream.color }}
                          >
                            {stream.code}
                          </span>
                          <span className="text-lg font-bold text-slate-900">— {stream.name}</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">{stream.tagline}</p>
                      </div>
                    </div>

                    {/* Stream body */}
                    <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Programme Scope</p>
                        <p className="text-slate-700 text-sm leading-relaxed mb-5">{stream.description}</p>
                        <ul className="space-y-2">
                          {stream.scope.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                              <span
                                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                style={{ background: stream.color }}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Platform Connections</p>
                        <div className="space-y-3 mb-6">
                          {stream.platformConnections.map((conn, i) => (
                            <div key={i}>
                              <Link
                                to={conn.route}
                                className="flex items-center gap-2 text-sm font-semibold hover:underline transition-colors"
                                style={{ color: stream.color }}
                              >
                                <ExternalLink size={13} />
                                {conn.name}
                              </Link>
                              {conn.reason && (
                                <p className="text-xs text-slate-400 mt-0.5 ml-5 leading-relaxed">{conn.reason}</p>
                              )}
                            </div>
                          ))}
                        </div>
                        <Link
                          to={stream.ctaRoute}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                          style={{ background: stream.color }}
                        >
                          {stream.ctaLabel} <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── DTMP governance position ── */}
        <section
          className="py-16"
          style={{ background: landingGradients.darkCta }}
        >
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">DTMP Governs All Four Streams</h2>
            <p className="text-white/60 text-sm mb-8 max-w-2xl mx-auto leading-relaxed">
              Every programme within DXP, DWS, DIA, and SDO is tracked, governed, and aligned through the DTMP marketplaces.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/marketplaces/initiative-portfolio"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                View Initiative & Programme Portfolio <ArrowRight size={14} />
              </Link>
              <Link
                to="/marketplaces/intelligence"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                View Transformation Intelligence <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
