import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Headphones, Briefcase } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MarketplaceHeader } from "@/components/supportServices/MarketplaceHeader";
import { SupportServiceCard } from "@/components/cards/SupportServiceCard";
import { SearchBar } from "@/components/learningCenter/SearchBar";
import { FilterPanel, MobileFilterButton } from "@/components/learningCenter/FilterPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  technicalSupport,
  expertConsultancy,
  technicalSupportFilters,
  expertConsultancyFilters,
  type TechnicalSupport,
  type ExpertConsultancy,
} from "@/data/supportServices";

type TabValue = "technical-support" | "expert-consultancy";

export default function SupportServicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get active tab from URL or default to technical-support
  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = tabParam === "expert-consultancy" ? "expert-consultancy" : "technical-support";
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Debounce search query with 300ms delay
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Get current data and filters based on active tab
  const currentData = activeTab === "technical-support" ? technicalSupport : expertConsultancy;
  const currentFilters = activeTab === "technical-support" ? technicalSupportFilters : expertConsultancyFilters;

  // Tab change handler that resets filters
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
    setSelectedFilters({});
  };

  // Filter change handler
  const handleFilterChange = (group: string, value: string) => {
    setSelectedFilters((prev) => {
      const groupFilters = prev[group] || [];
      const isSelected = groupFilters.includes(value);
      
      return {
        ...prev,
        [group]: isSelected
          ? groupFilters.filter((v) => v !== value)
          : [...groupFilters, value],
      };
    });
  };

  // Clear all filters and search query
  const handleClearFilters = useCallback(() => {
    setSelectedFilters({});
    setSearchQuery("");
  }, []);

  // Memoize filter application logic for better performance
  const applyFilters = useCallback((
    results: (TechnicalSupport | ExpertConsultancy)[],
    filters: Record<string, string[]>
  ) => {
    let filtered = results;
    
    Object.entries(filters).forEach(([group, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter((service: TechnicalSupport | ExpertConsultancy) => {
          // Handle different filter types
          if (group === "supportType") {
            return values.includes(service.type);
          }
          if (group === "slaLevel") {
            return values.includes((service as TechnicalSupport).slaLevel);
          }
          if (group === "coverageArea") {
            return values.some(v => (service as TechnicalSupport).coverage?.includes(v.split(" ")[0]));
          }
          if (group === "responseTime") {
            return values.includes((service as TechnicalSupport).responseTime);
          }
          if (group === "deliveryModel") {
            return values.includes(service.deliveryModel);
          }
          if (group === "teamSize") {
            return values.includes((service as TechnicalSupport).teamSize);
          }
          if (group === "pricing") {
            return values.includes(service.pricing);
          }
          if (group === "expertiseArea") {
            // Map expertise areas to service types/titles
            return values.some(v => 
              service.title.toLowerCase().includes(v.toLowerCase()) ||
              service.description.toLowerCase().includes(v.toLowerCase())
            );
          }
          if (group === "consultancyType") {
            return values.includes(service.type);
          }
          if (group === "experienceLevel") {
            return values.includes((service as ExpertConsultancy).experienceLevel);
          }
          if (group === "engagementDuration") {
            return values.includes((service as ExpertConsultancy).duration);
          }
          if (group === "industrySpecialization") {
            return values.includes((service as ExpertConsultancy).industrySpecialization);
          }
          return true;
        });
      }
    });
    
    return filtered;
  }, []);

  // Filter and search logic - optimized with debounced search
  const filteredServices = useMemo(() => {
    let results: (TechnicalSupport | ExpertConsultancy)[] = currentData;

    // Apply search filter using debounced query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      results = results.filter((service) => {
        const matchesTitle = service.title.toLowerCase().includes(query);
        const matchesDescription = service.description.toLowerCase().includes(query);
        const matchesType = service.type.toLowerCase().includes(query);
        return matchesTitle || matchesDescription || matchesType;
      });
    }

    // Apply selected filters using memoized function
    results = applyFilters(results, selectedFilters);

    return results;
  }, [currentData, debouncedSearchQuery, selectedFilters, applyFilters]);

  // Handle service card click - memoized
  const handleServiceClick = useCallback((serviceId: string) => {
    navigate(`/marketplaces/support-services/${activeTab}/${serviceId}`);
  }, [navigate, activeTab]);

  // Dynamic search placeholder
  const searchPlaceholder =
    activeTab === "technical-support"
      ? "Search support services or coverage areas..."
      : "Search consultancy services or expertise areas...";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <MarketplaceHeader />

      <main className="flex-1" id="main-content">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
            <TabsList 
              className="w-full justify-start bg-white border border-gray-200 rounded-lg p-1 h-auto"
              aria-label="Support service categories"
            >
              <TabsTrigger
                value="technical-support"
                className="flex-1 lg:flex-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--orange))] rounded-none px-6 py-3 min-h-[44px]"
                aria-label="Technical Support, 18 services"
              >
                <div className="flex items-center gap-2">
                  <Headphones size={20} aria-hidden="true" />
                  <span className="hidden sm:inline">Technical Support</span>
                  <span className="sm:hidden">Support</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold ml-2" aria-label="18 services">
                    18
                  </span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="expert-consultancy"
                className="flex-1 lg:flex-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--orange))] rounded-none px-6 py-3 min-h-[44px]"
                aria-label="Expert Consultancy, 16 services"
              >
                <div className="flex items-center gap-2">
                  <Briefcase size={20} aria-hidden="true" />
                  <span className="hidden sm:inline">Expert Consultancy</span>
                  <span className="sm:hidden">Consultancy</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold ml-2" aria-label="16 services">
                    16
                  </span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="flex gap-6">
                {/* Filter Panel */}
                <FilterPanel
                  filters={currentFilters}
                  selectedFilters={selectedFilters}
                  onFilterChange={handleFilterChange}
                  onClearAll={handleClearFilters}
                  isOpen={isFilterOpen}
                  onToggle={() => setIsFilterOpen(!isFilterOpen)}
                />

                {/* Main Content */}
                <div className="flex-1">
                  {/* Search Bar */}
                  <div className="mb-6">
                    <SearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder={searchPlaceholder}
                    />
                  </div>

                  {/* Result Count */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600" role="status" aria-live="polite" aria-atomic="true">
                      {filteredServices.length} {filteredServices.length === 1 ? "service" : "services"} found
                    </p>
                  </div>

                  {/* Services Grid */}
                  {filteredServices.length > 0 ? (
                    <div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      role="list"
                      aria-label="Support service cards"
                    >
                      {filteredServices.map((service) => (
                        <SupportServiceCard
                          key={service.id}
                          service={service}
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
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                          <Headphones className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          No services match your criteria
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Try adjusting your filters or search query to find what you're looking for.
                        </p>
                        <button
                          onClick={handleClearFilters}
                          className="bg-[hsl(var(--orange))] text-white hover:bg-[hsl(var(--orange-hover))] px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 hover:shadow-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--orange))] focus:ring-offset-2"
                          aria-label="Clear all filters and search"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Mobile Filter Button */}
      <MobileFilterButton onClick={() => setIsFilterOpen(true)} />

      <Footer />
    </div>
  );
}
