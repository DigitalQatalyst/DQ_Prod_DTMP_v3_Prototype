import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronRight, ArrowLeft, ArrowRight, Layers, Monitor, Building2,
  BarChart3, ShieldCheck, FileText, GitBranch, Layout, CheckCircle,
  Cpu, Globe, Lock, Zap, Database, Cloud, Users, Settings,
} from "lucide-react";
import { solutionSpecs, SolutionType } from "@/data/blueprints/solutionSpecs";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { SolutionSpecCard } from "@/components/cards/SolutionSpecCard";

// ── Per-type static content ───────────────────────────────────────────────────

const TYPE_META: Record<SolutionType, {
  fullName: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  colorClasses: { bg: string; text: string; border: string; badge: string; button: string; buttonHover: string };
  capabilities: { icon: React.ElementType; title: string; description: string }[];
  useCases: string[];
}> = {
  DBP: {
    fullName: "Digital Business Platform",
    tagline: "The integration backbone of your digital enterprise",
    description:
      "DBP solution specs cover the core integration and orchestration layer — from API gateways and event streaming to microservices, service mesh, and business process automation. These blueprints provide the architectural foundation for connected, cloud-native enterprise operations.",
    icon: Layers,
    gradient: "bg-gradient-to-b from-blue-50 to-white",
    colorClasses: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", button: "bg-blue-600", buttonHover: "hover:bg-blue-700" },
    capabilities: [
      { icon: Globe,    title: "API Gateway & Management",    description: "Enterprise API lifecycle, developer portals, and rate-limiting patterns." },
      { icon: Zap,      title: "Event-Driven Architecture",   description: "Kafka-based event streaming, CQRS, saga patterns, and event sourcing." },
      { icon: Cloud,    title: "Microservices & Containers",  description: "Kubernetes orchestration, Docker packaging, and service decomposition." },
      { icon: Settings, title: "Service Mesh",                description: "Istio-based traffic management, mTLS security, and observability." },
      { icon: Database, title: "Integration Patterns",        description: "Enterprise integration patterns, iPaaS, and data flow orchestration." },
      { icon: Cpu,      title: "Business Process Management", description: "BPMN workflows, process mining, and low-code automation." },
    ],
    useCases: [
      "Modernising legacy integration middleware",
      "Building an API-first enterprise architecture",
      "Implementing event-driven microservices",
      "Establishing a platform engineering practice",
      "Enabling real-time business process automation",
    ],
  },
  DXP: {
    fullName: "Digital Experience Platform",
    tagline: "Deliver exceptional experiences at every customer touchpoint",
    description:
      "DXP solution specs encompass the customer-facing layer — spanning Customer 360 platforms, omnichannel journeys, mobile backends, personalisation engines, and conversational AI. These blueprints guide the design and delivery of consistent, compelling digital experiences.",
    icon: Monitor,
    gradient: "bg-gradient-to-b from-purple-50 to-white",
    colorClasses: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", button: "bg-purple-600", buttonHover: "hover:bg-purple-700" },
    capabilities: [
      { icon: Users,    title: "Customer 360 Platform",    description: "Unified customer data, real-time profiling, and cross-channel analytics." },
      { icon: Globe,    title: "Omnichannel Experience",   description: "Seamless journeys across web, mobile, in-store, and contact centre." },
      { icon: Cpu,      title: "Mobile Backend Platform",  description: "GraphQL APIs, offline sync, push notifications, and cross-platform support." },
      { icon: Zap,      title: "Personalisation Engine",   description: "ML-driven recommendations, A/B testing, and real-time content optimisation." },
      { icon: FileText, title: "Headless CMS",             description: "Content delivery, DAM, CDN integration, and multi-channel publishing." },
      { icon: Settings, title: "Conversational AI",        description: "NLP-powered chatbots, intent recognition, and multi-channel virtual assistants." },
    ],
    useCases: [
      "Unifying customer data across fragmented systems",
      "Building a consistent omnichannel strategy",
      "Launching a personalised digital product",
      "Modernising customer service with AI assistants",
      "Creating a mobile-first customer experience",
    ],
  },
  DWS: {
    fullName: "Digital Workplace Solution",
    tagline: "Empower your workforce with modern collaboration and productivity",
    description:
      "DWS solution specs address the employee experience dimension — covering collaboration platforms, enterprise search, low-code development environments, and knowledge management ecosystems. These blueprints help organisations build a connected, productive digital workplace.",
    icon: Building2,
    gradient: "bg-gradient-to-b from-green-50 to-white",
    colorClasses: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", badge: "bg-green-100 text-green-700", button: "bg-green-600", buttonHover: "hover:bg-green-700" },
    capabilities: [
      { icon: Users,    title: "Digital Workplace Hub",     description: "Microsoft 365-integrated intranet, knowledge graph, and collaboration layer." },
      { icon: Globe,    title: "Collaboration Platform",    description: "Real-time messaging, video conferencing, document co-authoring, and presence." },
      { icon: Database, title: "Enterprise Search",         description: "Elasticsearch-powered federated search with NLP and relevance tuning." },
      { icon: Cpu,      title: "Low-Code Platform",         description: "BPMN-based process automation, RPA, and rapid application development." },
      { icon: Settings, title: "Knowledge Management",      description: "Structured knowledge capture, taxonomy, and guided discovery." },
      { icon: Zap,      title: "Employee Experience Design", description: "Journey mapping, onboarding workflows, and productivity analytics." },
    ],
    useCases: [
      "Modernising the corporate intranet and digital hub",
      "Introducing self-service automation with low-code tools",
      "Improving information findability with enterprise search",
      "Rolling out a remote-work collaboration platform",
      "Measuring and improving employee experience metrics",
    ],
  },
  DIA: {
    fullName: "Digital Intelligence & Analytics",
    tagline: "Turn data into decisions with enterprise-grade intelligence",
    description:
      "DIA solution specs cover the intelligence and analytics layer — from enterprise data platforms and governance frameworks to AI/ML pipelines, IoT data ingestion, and real-time streaming analytics. These blueprints enable organisations to harness data as a strategic asset.",
    icon: BarChart3,
    gradient: "bg-gradient-to-b from-orange-50 to-white",
    colorClasses: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-700", button: "bg-orange-600", buttonHover: "hover:bg-orange-700" },
    capabilities: [
      { icon: Database, title: "Enterprise Data Platform", description: "Data lake, warehouse, ETL/ELT pipelines, and catalogue governance." },
      { icon: Cpu,      title: "AI / ML Platform",         description: "MLOps, feature store, model registry, and GPU-accelerated training." },
      { icon: Globe,    title: "IoT Platform",             description: "MQTT ingestion, edge computing, time-series DB, and device management." },
      { icon: Zap,      title: "Real-Time Analytics",      description: "Kafka Streams, Flink, stream SQL, and low-latency event processing." },
      { icon: Lock,     title: "Data Governance",          description: "Data quality, lineage tracking, compliance, and cataloguing." },
      { icon: Settings, title: "Business Intelligence",    description: "Self-service dashboards, embedded analytics, and executive reporting." },
    ],
    useCases: [
      "Building a modern, cloud-native data lakehouse",
      "Operationalising machine learning at scale (MLOps)",
      "Connecting and analysing IoT sensor data in real time",
      "Implementing real-time business intelligence dashboards",
      "Establishing an enterprise data governance programme",
    ],
  },
  SDO: {
    fullName: "Secure Digital Operations",
    tagline: "Protect your digital estate with resilient security architecture",
    description:
      "SDO solution specs address the security and operational resilience layer — covering zero-trust architectures, identity and access management, observability platforms, and backup and disaster recovery. These blueprints help organisations build a secure, compliant, and operationally resilient digital foundation.",
    icon: ShieldCheck,
    gradient: "bg-gradient-to-b from-red-50 to-white",
    colorClasses: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-700", button: "bg-red-600", buttonHover: "hover:bg-red-700" },
    capabilities: [
      { icon: Lock,       title: "Identity & Access Management", description: "SSO, MFA, RBAC, and identity governance across all systems." },
      { icon: ShieldCheck,title: "Zero Trust Security",          description: "Identity-centric access, micro-segmentation, SIEM, and continuous verification." },
      { icon: Settings,   title: "Observability Platform",       description: "Prometheus, Grafana, Jaeger, and ELK Stack for full-stack visibility." },
      { icon: Database,   title: "Backup & Disaster Recovery",   description: "Automated backups, cross-region replication, and business continuity planning." },
      { icon: Globe,      title: "Security Operations",          description: "Threat detection, incident response workflows, and policy enforcement." },
      { icon: Zap,        title: "Compliance Frameworks",        description: "Audit trails, regulatory mapping, and controls management." },
    ],
    useCases: [
      "Migrating from perimeter-based to zero-trust security",
      "Consolidating identity providers with enterprise SSO/MFA",
      "Building end-to-end observability for cloud workloads",
      "Implementing business continuity and DR for critical systems",
      "Meeting regulatory compliance requirements (ISO, SOC 2, GDPR)",
    ],
  },
};

// ── Page component ────────────────────────────────────────────────────────────

export function SolutionTypeOverviewPage() {
  const { solutionType } = useParams<{ solutionType: string }>();
  const navigate = useNavigate();

  const type = solutionType?.toUpperCase() as SolutionType | undefined;
  const meta = type ? TYPE_META[type] : undefined;

  const typeSpecs = meta ? solutionSpecs.filter((s) => s.solutionType === type) : [];

  if (!meta || !type) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Solution type not found</h1>
          <p className="text-gray-600 mb-6">The solution type you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/marketplaces/solution-specs")}>
            Back to Solution Specs
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const Icon = meta.icon;
  const totalDiagrams   = typeSpecs.reduce((s, sp) => s + sp.diagramCount, 0);
  const totalComponents = typeSpecs.reduce((s, sp) => s + sp.componentCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className={`${meta.gradient} py-8 lg:py-12`}>
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center text-sm text-muted-foreground mb-4 flex-wrap gap-y-1">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/marketplaces" className="hover:text-foreground transition-colors">Marketplaces</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/marketplaces/solution-specs" className="hover:text-foreground transition-colors">Solution Specs</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-foreground">{type}</span>
          </nav>

          <button
            onClick={() => navigate("/marketplaces/solution-specs")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Solution Specs
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block bg-phase-design-bg text-phase-design px-3 py-1 rounded-full text-xs font-semibold uppercase">
                  Design
                </span>
                <span className={`inline-block ${meta.colorClasses.badge} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                  {type}
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-primary-navy mb-2">
                {meta.fullName}
              </h1>
              <p className={`text-base font-medium ${meta.colorClasses.text} mb-3`}>
                {meta.tagline}
              </p>
              <p className="text-base text-muted-foreground max-w-2xl mb-5">
                {meta.description}
              </p>

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  {typeSpecs.length} Specification{typeSpecs.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  {totalDiagrams} Architecture Diagram{totalDiagrams !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  {totalComponents} Components Defined
                </span>
              </div>
            </div>

            {/* CTA card */}
            <div className={`lg:w-72 flex-shrink-0 rounded-2xl border-2 ${meta.colorClasses.border} ${meta.colorClasses.bg} p-6`}>
              <div className={`w-12 h-12 rounded-xl bg-white border ${meta.colorClasses.border} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${meta.colorClasses.text}`} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Request a {type} Specification
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Need a custom {meta.fullName} blueprint tailored to your organisation? Submit a specification request.
              </p>
              <Button
                onClick={() => navigate("/marketplaces/solution-specs/request", { state: { serviceName: meta.fullName } })}
                className={`w-full ${meta.colorClasses.button} ${meta.colorClasses.buttonHover} text-white font-semibold`}
              >
                Make a Request
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Capabilities ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Key Capabilities</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Solution specifications in this category cover the following capability areas.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meta.capabilities.map((cap) => {
              const CapIcon = cap.icon;
              return (
                <div key={cap.title} className={`rounded-xl border ${meta.colorClasses.border} ${meta.colorClasses.bg} p-4 flex gap-4`}>
                  <div className={`w-9 h-9 rounded-lg bg-white border ${meta.colorClasses.border} flex items-center justify-center flex-shrink-0`}>
                    <CapIcon className={`w-4 h-4 ${meta.colorClasses.text}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">{cap.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{cap.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Common Use Cases ─────────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-b border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Common Use Cases</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Organisations typically use {type} specifications to address these transformation scenarios.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {meta.useCases.map((uc) => (
              <div key={uc} className="flex items-start gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3">
                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${meta.colorClasses.text}`} />
                <span className="text-sm text-gray-700">{uc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Available Specifications ─────────────────────────────────────────── */}
      <section className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Available {type} Specifications
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {typeSpecs.length} blueprint{typeSpecs.length !== 1 ? "s" : ""} ready to browse and request
              </p>
            </div>
            <button
              onClick={() => navigate(`/marketplaces/solution-specs?type=${type}`)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
            >
              View in marketplace
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {typeSpecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {typeSpecs.map((spec) => (
                <SolutionSpecCard
                  key={spec.id}
                  spec={spec}
                  onClick={(id) => navigate(`/marketplaces/solution-specs/${id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-600">No specifications available for this type yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────────── */}
      <section className={`${meta.colorClasses.bg} border-t ${meta.colorClasses.border} py-12`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Can't find the right specification?
            </h3>
            <p className="text-sm text-gray-600">
              Submit a custom {meta.fullName} request and our solution architects will design a blueprint tailored to your needs.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => navigate("/marketplaces/solution-specs")}
              className="border-gray-300 text-gray-700"
            >
              Browse All Types
            </Button>
            <Button
              onClick={() => navigate("/marketplaces/solution-specs/request", { state: { serviceName: meta.fullName } })}
              className={`${meta.colorClasses.button} ${meta.colorClasses.buttonHover} text-white font-semibold`}
            >
              Make a Request
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
