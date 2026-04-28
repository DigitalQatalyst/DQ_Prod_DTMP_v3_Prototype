import { useState, useMemo, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronRight, FileX, Search, X, HelpCircle,
} from "lucide-react";
import { solutionSpecs, SolutionType } from "@/data/blueprints/solutionSpecs";
import { solutionSpecsFiltersKC } from "@/data/blueprints/filters";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TypeTabs } from "@/components/shared/TypeTabs";
import { FilterPanel, MobileFilterButton } from "@/components/learningCenter/FilterPanel";
import { SolutionSpecCard } from "@/components/cards/SolutionSpecCard";

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

      {/* ── Hero with integrated search ──────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-purple-50 to-white py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/marketplaces" className="hover:text-foreground transition-colors">Marketplaces</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-foreground">Solution Specs</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left — title, description, search, count */}
            <div className="flex-1 max-w-2xl">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary-navy mb-3">
                Solution Specs
              </h1>
              <p className="text-base text-muted-foreground mb-5">
                Browse DEWA's blueprint-led solution specifications across the Digital Business
                Platform streams. Find comprehensive architecture designs, component specifications,
                and implementation guidance contextualized to DEWA divisions and programmes.
              </p>

              {/* Search input */}
              <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search DEWA solution specs..."
                  className="flex-1 bg-transparent border-0 outline-none text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none"
                  aria-label="Search DEWA solution specs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Item count */}
              <p className="text-sm text-muted-foreground mt-3">
                Showing{" "}
                <span className="font-medium text-foreground">{filteredSpecs.length}</span>{" "}
                item{filteredSpecs.length !== 1 ? "s" : ""}
                {activeFilterCount > 0 && (
                  <span className="ml-1 text-orange-600">
                    ({activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active)
                  </span>
                )}
              </p>
            </div>

            {/* Right — CTA */}
            <div className="flex-shrink-0 lg:pt-2">
              <button
                onClick={() => navigate("/marketplaces/solution-specs/request")}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-400 bg-white rounded-full px-4 py-2 text-sm font-medium transition-all hover:shadow-sm"
              >
                <HelpCircle className="w-4 h-4 flex-shrink-0" />
                Can't find the spec you need?
              </button>
            </div>
          </div>
        </div>
      </section>

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
