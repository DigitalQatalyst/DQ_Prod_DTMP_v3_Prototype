import { useState, useMemo, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronRight, FileX, Layout, Layers, Monitor, Building2,
  BarChart3, ShieldCheck, FileText, GitBranch, ArrowRight,
} from "lucide-react";
import { solutionSpecs, SolutionType } from "@/data/blueprints/solutionSpecs";
import { solutionSpecsFiltersKC } from "@/data/blueprints/filters";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TypeTabs } from "@/components/shared/TypeTabs";
import { FilterPanel, MobileFilterButton } from "@/components/learningCenter/FilterPanel";
import { SearchBar } from "@/components/learningCenter/SearchBar";
import { SolutionSpecCard } from "@/components/cards/SolutionSpecCard";

// ── Solution type display metadata ───────────────────────────────────────────

const solutionTypeDetails: Record<SolutionType, {
  fullName: string;
  description: string;
  icon: React.ElementType;
  colorClasses: { bg: string; text: string; border: string; badge: string };
}> = {
  DBP: {
    fullName: "Digital Business Platform",
    description: "Integration, microservices, API management, and event-driven architectures for seamless digital operations.",
    icon: Layers,
    colorClasses: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" },
  },
  DXP: {
    fullName: "Digital Experience Platform",
    description: "Customer journeys, personalisation, omnichannel experiences, and mobile-first architectures.",
    icon: Monitor,
    colorClasses: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-100 text-purple-700" },
  },
  DWS: {
    fullName: "Digital Workplace Solution",
    description: "Collaboration platforms, productivity tooling, knowledge management, and employee experience design.",
    icon: Building2,
    colorClasses: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", badge: "bg-green-100 text-green-700" },
  },
  DIA: {
    fullName: "Digital Intelligence & Analytics",
    description: "Data platforms, AI/ML pipelines, real-time analytics, and governance frameworks for data-driven decisions.",
    icon: BarChart3,
    colorClasses: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
  },
  SDO: {
    fullName: "Secure Digital Operations",
    description: "Security architecture, identity management, zero-trust frameworks, and operational resilience patterns.",
    icon: ShieldCheck,
    colorClasses: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-700" },
  },
};

// ── Page component ────────────────────────────────────────────────────────────

export function SolutionSpecsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialType = (searchParams.get("type") as SolutionType | null) || "all";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<SolutionType | "all">(initialType);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [filterOpen, setFilterOpen] = useState(false);

  // ── Derived counts ──────────────────────────────────────────────────────────
  const typeCounts = useMemo(() => {
    const counts: Record<SolutionType, number> = { DBP: 0, DXP: 0, DWS: 0, DIA: 0, SDO: 0 };
    solutionSpecs.forEach((s) => { counts[s.solutionType]++; });
    return counts;
  }, []);

  const heroStats = useMemo(() => ({
    total: solutionSpecs.length,
    totalDiagrams: solutionSpecs.reduce((sum, s) => sum + s.diagramCount, 0),
  }), []);

  // ── Filtered results ────────────────────────────────────────────────────────
  const filteredSpecs = useMemo(() => {
    let results = solutionSpecs;
    if (activeType !== "all") results = results.filter((s) => s.solutionType === activeType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    const scopeFilters = selectedFilters.scope;
    if (scopeFilters?.length) results = results.filter((s) => scopeFilters.some((f) => f.toLowerCase() === s.scope));
    const maturityFilters = selectedFilters.maturityLevel;
    if (maturityFilters?.length) results = results.filter((s) => maturityFilters.some((f) => f.toLowerCase() === s.maturityLevel));
    if (selectedFilters.hasDiagrams?.includes("Yes")) results = results.filter((s) => s.diagramCount > 0);
    const complexityFilters = selectedFilters.complexity;
    if (complexityFilters?.length) results = results.filter((s) => complexityFilters.some((f) => f.toLowerCase() === s.complexity));
    const techStackFilters = selectedFilters.technologyStack;
    if (techStackFilters?.length) {
      results = results.filter((s) =>
        techStackFilters.some((tech) => s.tags.some((tag) => tag.toLowerCase().includes(tech.toLowerCase())))
      );
    }
    return results;
  }, [searchQuery, activeType, selectedFilters]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleTypeChange = useCallback(
    (type: SolutionType | "all") => {
      setActiveType(type);
      if (type === "all") searchParams.delete("type");
      else searchParams.set("type", type);
      setSearchParams(searchParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleFilterChange = useCallback((group: string, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[group] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [group]: next };
    });
  }, []);

  const clearAllFilters = useCallback(() => setSelectedFilters({}), []);

  // Clicking a spec card navigates to its detail page (which has full overview + request flow)
  const handleCardClick = useCallback((id: string) => {
    navigate(`/marketplaces/solution-specs/${id}`);
  }, [navigate]);

  const activeFilterCount = Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── KC-style Hero (Design phase / purple) ───────────────────────────── */}
      <section className="bg-gradient-to-b from-purple-50 to-white py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/marketplaces" className="hover:text-foreground transition-colors">Marketplaces</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-foreground">Solution Specs</span>
          </nav>

          <span className="inline-block bg-phase-design-bg text-phase-design px-3 py-1 rounded-full text-xs font-semibold uppercase mb-3">
            Design
          </span>

          <h1 className="text-3xl lg:text-4xl font-bold text-primary-navy mb-3">
            DTMP Solution Specs
          </h1>
          <p className="text-base lg:text-lg text-muted-foreground max-w-3xl mb-4">
            Browse and request solution blueprints, reference architectures, and implementation
            specifications across five solution types. Each spec includes architecture diagrams,
            component breakdowns, and delivery guidance for your digital transformation initiatives.
          </p>

          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              {heroStats.total} Solution Specifications
            </span>
            <span className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              {heroStats.totalDiagrams} Architecture Diagrams
            </span>
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              5 Solution Types
            </span>
          </div>
        </div>
      </section>

      {/* ── Solution Type Service Cards ──────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Browse by Solution Type</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select a type to explore its specifications and make a request
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {(Object.keys(solutionTypeDetails) as SolutionType[]).map((type) => {
              const detail = solutionTypeDetails[type];
              const Icon = detail.icon;
              const count = typeCounts[type];
              return (
                <button
                  key={type}
                  onClick={() => navigate(`/marketplaces/solution-specs/type/${type}`)}
                  className="group text-left rounded-xl border-2 border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                  aria-label={`Explore ${detail.fullName}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100 group-hover:${detail.colorClasses.bg} transition-colors`}>
                      <Icon className="w-5 h-5 text-gray-500" />
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {type}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
                    {detail.fullName}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-3">
                    {detail.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{count} spec{count !== 1 ? "s" : ""}</span>
                    <span className="text-xs font-medium text-gray-400 group-hover:text-orange-600 flex items-center gap-1 transition-colors">
                      Explore
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Search Bar ──────────────────────────────────────────────────────── */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search solution specs by title, description, or technology tag..."
      />

      {/* ── Type Tabs ───────────────────────────────────────────────────────── */}
      <TypeTabs activeType={activeType} onTypeChange={handleTypeChange} typeCounts={typeCounts} />

      {/* ── Filter Panel + Cards ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto flex">
        <FilterPanel
          filters={solutionSpecsFiltersKC}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onClearAll={clearAllFilters}
          isOpen={filterOpen}
          onToggle={() => setFilterOpen(!filterOpen)}
        />

        <main className="flex-1 min-w-0">
          {/* Result count toolbar */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 lg:px-8 py-3 flex items-center">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">{filteredSpecs.length}</span>{" "}
              solution spec{filteredSpecs.length !== 1 ? "s" : ""}
              {activeFilterCount > 0 && (
                <span className="ml-1 text-orange-600">
                  ({activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active)
                </span>
              )}
            </p>
          </div>

          {/* Cards grid */}
          <div className="px-4 lg:px-8 py-6">
            {filteredSpecs.length > 0 ? (
              <div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                role="list"
                aria-label="Solution specifications"
              >
                {filteredSpecs.map((spec) => (
                  <SolutionSpecCard key={spec.id} spec={spec} onClick={handleCardClick} />
                ))}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-16 px-4 text-center"
                role="status"
                aria-live="polite"
              >
                <FileX className="w-16 h-16 text-gray-300 mb-4" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No solution specs found</h3>
                <p className="text-gray-600 max-w-md">
                  Try adjusting your search query or filters to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />

      <MobileFilterButton onClick={() => setFilterOpen(true)} />
    </div>
  );
}
