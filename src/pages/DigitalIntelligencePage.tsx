import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FolderKanban, Server, SlidersHorizontal, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  IntelligenceCard,
  IntelligenceDashboardView,
  MarketplaceHeader,
} from "@/components/digitalIntelligence";
import { LoginModal } from "@/components/learningCenter";
import { SearchBar } from "@/components/learningCenter/SearchBar";
import {
  FilterPanel,
  MobileFilterButton,
} from "@/components/learningCenter/FilterPanel";
import {
  systemsPortfolio,
  digitalMaturity,
  projectsPortfolio,
  systemsPortfolioFilters,
  digitalMaturityFilters,
  projectsPortfolioFilters,
  type SystemsPortfolioService,
  type DigitalMaturityService,
  type ProjectsPortfolioService,
} from "@/data/digitalIntelligence";
import { isUserAuthenticated } from "@/data/sessionAuth";
import type { DIServiceTab } from "@/data/digitalIntelligence/requestState";

type TabValue = "systems-portfolio" | "digital-maturity" | "projects-portfolio";

interface TabConfig {
  value: TabValue;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  count: number;
}

interface LoginContext {
  marketplace: string;
  tab: DIServiceTab;
  cardId: string;
  serviceName: string;
  action: string;
}

type ServiceType =
  | SystemsPortfolioService
  | DigitalMaturityService
  | ProjectsPortfolioService;

const DEBOUNCE_DELAY = 300;

const TABS: TabConfig[] = [
  {
    value: "systems-portfolio",
    label: "Systems Portfolio & Lifecycle",
    shortLabel: "Systems",
    icon: <Server className="w-4 h-4" />,
    count: 12,
  },
  {
    value: "digital-maturity",
    label: "Digital Maturity",
    shortLabel: "Maturity",
    icon: <TrendingUp className="w-4 h-4" />,
    count: 8,
  },
  {
    value: "projects-portfolio",
    label: "Projects Portfolio & Lifecycle",
    shortLabel: "Projects",
    icon: <FolderKanban className="w-4 h-4" />,
    count: 10,
  },
];

const SEARCH_PLACEHOLDERS: Record<TabValue, string> = {
  "systems-portfolio": "Search system analytics or metrics...",
  "digital-maturity": "Search maturity assessments or domains...",
  "projects-portfolio": "Search project analytics or predictions...",
};

const SERVICES_BY_TAB: Record<TabValue, ServiceType[]> = {
  "systems-portfolio": systemsPortfolio,
  "digital-maturity": digitalMaturity,
  "projects-portfolio": projectsPortfolio,
};

const FILTERS_BY_TAB = {
  "systems-portfolio": systemsPortfolioFilters,
  "digital-maturity": digitalMaturityFilters,
  "projects-portfolio": projectsPortfolioFilters,
};

const isValidTab = (value: string | null | undefined): value is TabValue =>
  value === "systems-portfolio" ||
  value === "digital-maturity" ||
  value === "projects-portfolio";

export default function DigitalIntelligencePage() {
  const navigate = useNavigate();
  const { tab: routeTab, cardId: routeCardId } = useParams<{
    tab?: string;
    cardId?: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const validRouteTab = isValidTab(routeTab) ? routeTab : null;
  const initialTab: TabValue = validRouteTab || (isValidTab(requestedTab) ? requestedTab : "systems-portfolio");

  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    validRouteTab && routeCardId ? routeCardId : null
  );
  const [hasPromptedDashboardLogin, setHasPromptedDashboardLogin] = useState(false);
  const [loginModal, setLoginModal] = useState<{
    open: boolean;
    context: LoginContext;
  }>({
    open: false,
    context: {
      marketplace: "digital-intelligence",
      tab: "systems-portfolio",
      cardId: "",
      serviceName: "",
      action: "View Analytics",
    },
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dashboardSectionRef = useRef<HTMLElement | null>(null);
  const authenticated = isUserAuthenticated();
  const currentData = SERVICES_BY_TAB[activeTab];
  const currentFilters = FILTERS_BY_TAB[activeTab];

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, DEBOUNCE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (validRouteTab && activeTab !== validRouteTab) {
      setActiveTab(validRouteTab);
      return;
    }

    if (!validRouteTab && isValidTab(requestedTab) && activeTab !== requestedTab) {
      setActiveTab(requestedTab);
    }
  }, [activeTab, requestedTab, validRouteTab]);

  useEffect(() => {
    if (!validRouteTab || !routeCardId) return;
    setSelectedServiceId(routeCardId);
  }, [routeCardId, validRouteTab]);

  useEffect(() => {
    setHasPromptedDashboardLogin(false);
  }, [routeCardId, validRouteTab]);

  useEffect(() => {
    if (!validRouteTab || !routeCardId || authenticated || hasPromptedDashboardLogin) {
      return;
    }

    const routeService =
      SERVICES_BY_TAB[validRouteTab].find((service) => service.id === routeCardId) || null;

    setLoginModal({
      open: true,
      context: {
        marketplace: "digital-intelligence",
        tab: validRouteTab,
        cardId: routeCardId,
        serviceName: routeService?.title || "Digital Intelligence Dashboard",
        action: "View Analytics",
      },
    });
    setHasPromptedDashboardLogin(true);
  }, [authenticated, hasPromptedDashboardLogin, routeCardId, validRouteTab]);

  const selectedService = useMemo(() => {
    if (!authenticated || !selectedServiceId) return null;
    return currentData.find((service) => service.id === selectedServiceId) || null;
  }, [authenticated, currentData, selectedServiceId]);

  useEffect(() => {
    if (!selectedService) return;

    const frame = window.requestAnimationFrame(() => {
      dashboardSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedService]);

  const activeFilterCount = useMemo(
    () => Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0),
    [selectedFilters]
  );

  const handleTabChange = useCallback(
    (tab: TabValue) => {
      setActiveTab(tab);
      setSelectedServiceId(null);
      setSelectedFilters({});
      setSearchQuery("");
      setDebouncedSearch("");

      if (validRouteTab && routeCardId) {
        navigate(`/marketplaces/digital-intelligence?tab=${tab}`, { replace: true });
        return;
      }

      setSearchParams({ tab });
    },
    [navigate, routeCardId, setSearchParams, validRouteTab]
  );

  const handleFilterChange = useCallback((group: string, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[group] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [group]: next };
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedFilters({});
    setSearchQuery("");
    setDebouncedSearch("");
  }, []);

  const applyFilters = useCallback(
    (results: ServiceType[], filters: Record<string, string[]>) => {
      let filtered = results;

      Object.entries(filters).forEach(([group, values]) => {
        if (values.length === 0) return;

        filtered = filtered.filter((service) => {
          switch (group) {
            case "analyticsType":
              return values.includes(
                (service as SystemsPortfolioService | ProjectsPortfolioService).analyticsType
              );
            case "systemScope":
              return values.includes((service as SystemsPortfolioService).systemScope);
            case "dataSource":
              return values.includes(
                (service as SystemsPortfolioService | ProjectsPortfolioService).dataSource || ""
              );
            case "aiCapability":
              return values.some((value) =>
                value === "None"
                  ? service.aiCapabilities.length === 0
                  : service.aiCapabilities.some((capability) =>
                      capability.toLowerCase().includes(value.toLowerCase())
                    )
              );
            case "updateFrequency":
              return values.includes(
                (service as SystemsPortfolioService | ProjectsPortfolioService).updateFrequency || ""
              );
            case "visualizationType":
              return values.includes(
                (service as SystemsPortfolioService | ProjectsPortfolioService).visualizationType || ""
              );
            case "complexity":
              return values.includes(service.complexity);
            case "assessmentType":
              return values.includes((service as DigitalMaturityService).analyticsType);
            case "assessmentScope":
              return values.includes((service as DigitalMaturityService).assessmentScope);
            case "framework":
              return values.includes((service as DigitalMaturityService).framework);
            case "outputFormat":
              return values.includes((service as DigitalMaturityService).outputFormat);
            case "assessmentFrequency":
              return values.includes((service as DigitalMaturityService).assessmentFrequency);
            case "projectType":
              return values.includes((service as ProjectsPortfolioService).projectType);
            default:
              return true;
          }
        });
      });

      return filtered;
    },
    []
  );

  const filteredServices = useMemo(() => {
    let results = currentData;

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      results = results.filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          service.aiCapabilities.some((capability) =>
            capability.toLowerCase().includes(query)
          ) ||
          service.keyInsights.some((insight) => insight.toLowerCase().includes(query))
      );
    }

    return applyFilters(results, selectedFilters);
  }, [applyFilters, currentData, debouncedSearch, selectedFilters]);

  const handleServiceClick = useCallback(
    (serviceId: string) => {
      if (authenticated) {
        setSelectedServiceId(serviceId);

        if (validRouteTab && routeCardId) {
          navigate(`/marketplaces/digital-intelligence/${activeTab}/${serviceId}/dashboard`);
        }

        return;
      }

      navigate(`/marketplaces/digital-intelligence/${activeTab}/${serviceId}`);
    },
    [activeTab, authenticated, navigate, routeCardId, validRouteTab]
  );

  const closeLoginModal = useCallback(() => {
    setLoginModal((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <MarketplaceHeader />

      <main className="flex-1" id="main-content">
        {authenticated && selectedService && (
          <section ref={dashboardSectionRef} className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                  Authenticated Dashboard View
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {selectedService.title}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Stage 1 now hosts the live dashboard. Stage 2 is reserved for Digital Intelligence request tracking.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    navigate(
                      `/marketplaces/digital-intelligence/${activeTab}/${selectedService.id}`
                    )
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
                >
                  View Service Details
                </button>
                <button
                  onClick={() => navigate("/stage2/intelligence/requests")}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
                >
                  Open My DI Requests
                </button>
              </div>
            </div>

            <IntelligenceDashboardView
              service={selectedService}
              tab={activeTab as DIServiceTab}
            />
          </section>
        )}

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div
            className="flex border-b border-gray-200 mb-6 overflow-x-auto"
            role="tablist"
            aria-label="Digital Intelligence categories"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  id={`tab-${tab.value}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.value}`}
                  onClick={() => handleTabChange(tab.value)}
                  className={`px-4 md:px-6 py-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset whitespace-nowrap ${
                    isActive
                      ? "border-b-2 border-purple-600 text-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {tab.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            <div className="mb-6">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={SEARCH_PLACEHOLDERS[activeTab]}
              />
            </div>

            <div className="flex gap-6">
              <FilterPanel
                filters={currentFilters}
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
                onClearAll={handleClearFilters}
                isOpen={mobileFilterOpen}
                onToggle={() => setMobileFilterOpen(!mobileFilterOpen)}
              />

              <div className="flex-1">
                <div className="mb-4">
                  <p
                    className="text-sm text-gray-600"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {filteredServices.length}{" "}
                    {filteredServices.length === 1 ? "service" : "services"} found
                    {activeFilterCount > 0 && (
                      <span className="ml-1 text-gray-400">
                        ({activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"} active)
                      </span>
                    )}
                  </p>
                </div>

                {filteredServices.length > 0 ? (
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                    role="list"
                    aria-label="Intelligence service cards"
                  >
                    {filteredServices.map((service) => (
                      <IntelligenceCard
                        key={service.id}
                        service={{
                          ...service,
                          dataSource:
                            (service as SystemsPortfolioService).dataSource ||
                            (service as ProjectsPortfolioService).dataSource,
                          updateFrequency:
                            (service as SystemsPortfolioService).updateFrequency ||
                            (service as ProjectsPortfolioService).updateFrequency,
                          visualizationType:
                            (service as SystemsPortfolioService).visualizationType ||
                            (service as ProjectsPortfolioService).visualizationType,
                          outputFormat: (service as DigitalMaturityService).outputFormat,
                        }}
                        onClick={() => handleServiceClick(service.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="max-w-md mx-auto">
                      <div
                        className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
                        aria-hidden="true"
                      >
                        <SlidersHorizontal className="text-gray-400" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        No services match your criteria
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Try adjusting your filters or search query to find what you&apos;re looking for.
                      </p>
                      <button
                        onClick={handleClearFilters}
                        className="bg-purple-600 text-white hover:bg-purple-700 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 hover:shadow-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        aria-label="Clear all filters and search"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileFilterButton onClick={() => setMobileFilterOpen(true)} />

      <LoginModal
        isOpen={loginModal.open}
        onClose={closeLoginModal}
        context={loginModal.context}
        onLoginSuccess={() => setLoginModal((prev) => ({ ...prev, open: false }))}
      />

      <Footer />
    </div>
  );
}
