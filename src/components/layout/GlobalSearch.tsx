import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, GraduationCap, BookOpen, FileText, Layout, Hammer,
  RefreshCw, Briefcase, BarChart3, HelpCircle, Sparkles, ArrowRight,
  Building2, Globe, Zap,
} from "lucide-react";

// ── Seeded search index ───────────────────────────────────────────────────────
interface SearchItem {
  title: string;
  type: string;
  typeIcon: React.ElementType;
  typeColor: string;
  source: string;
  description: string;
  route: string;
}

const searchIndex: SearchItem[] = [
  // Marketplaces
  { title: "Transformation Methodology & Learning", type: "Marketplace", typeIcon: GraduationCap, typeColor: "#6d28d9", source: "Discern", description: "Courses, learning tracks, and EA literacy pathways for all DEWA divisions.", route: "/marketplaces/learning" },
  { title: "Knowledge & Best Practices", type: "Marketplace", typeIcon: BookOpen, typeColor: "#6d28d9", source: "Discern", description: "Architecture standards, governance references, and published design outputs.", route: "/marketplaces/knowledge" },
  { title: "Transformation Artefacts (Document Studio)", type: "Marketplace", typeIcon: FileText, typeColor: "#0369A1", source: "Design", description: "AI-powered document generation fulfilled by the Corporate EA Office.", route: "/marketplaces/document-studio" },
  { title: "Solution Specifications", type: "Marketplace", typeIcon: Layout, typeColor: "#0369A1", source: "Design", description: "Architecture blueprints and solution specifications for all DEWA divisions.", route: "/marketplaces/solution-specs" },
  { title: "Solution Build", type: "Marketplace", typeIcon: Hammer, typeColor: "#16A34A", source: "Deploy", description: "Implementation resources and delivery support for DEWA programmes.", route: "/marketplaces/solution-build" },
  { title: "Initiative & Programme Portfolio", type: "Marketplace", typeIcon: RefreshCw, typeColor: "#D97706", source: "Drive", description: "Stage-gated initiative governance across enterprise programmes.", route: "/marketplaces/initiative-portfolio" },
  { title: "Asset & Capability Portfolio", type: "Marketplace", typeIcon: Briefcase, typeColor: "#D97706", source: "Drive", description: "IT/OT asset landscape mapped to EA capability domains.", route: "/marketplaces/asset-capability" },
  { title: "Transformation Intelligence", type: "Marketplace", typeIcon: BarChart3, typeColor: "#D97706", source: "Drive", description: "Programme health, maturity intelligence, and on-demand reports.", route: "/marketplaces/intelligence" },
  { title: "Support & Expert Services", type: "Marketplace", typeIcon: HelpCircle, typeColor: "#D97706", source: "Drive", description: "Platform support, data corrections, and EA advisory services.", route: "/marketplaces/support" },

  // Divisions
  { title: "Generation Division", type: "Division", typeIcon: Zap, typeColor: "#D97706", source: "Divisions", description: "MBR Solar Park, Net-Zero 2050, clean energy architecture governance.", route: "/divisions/generation" },
  { title: "Transmission Division", type: "Division", typeIcon: Building2, typeColor: "#0EA5E9", source: "Divisions", description: "HV grid infrastructure, SCADA systems, and transmission asset governance.", route: "/divisions/transmission" },
  { title: "Distribution Division", type: "Division", typeIcon: Globe, typeColor: "#16A34A", source: "Divisions", description: "Last-mile distribution network, smart metering, and grid resilience.", route: "/divisions/distribution" },
  { title: "Water & Civil Division", type: "Division", typeIcon: Building2, typeColor: "#0D9488", source: "Divisions", description: "Desalination, water distribution, and civil infrastructure programmes.", route: "/divisions/water-civil" },
  { title: "Innovation & The Future", type: "Division", typeIcon: Building2, typeColor: "#0369A1", source: "Divisions", description: "AI, innovation programmes, and forward-looking digital transformation.", route: "/divisions/innovation-future" },

  // Platform pages
  { title: "4D Governance Model", type: "Platform", typeIcon: Layout, typeColor: "#6d28d9", source: "Platform", description: "Discern, Design, Deploy, Drive — the framework organising DTMP.", route: "/4d-model" },
  { title: "DBP Execution Streams", type: "Platform", typeIcon: BarChart3, typeColor: "#0369A1", source: "Platform", description: "DXP, DWS, DIA, SDO — DEWA's four strategic digital programmes.", route: "/execution-streams" },
  { title: "Transformation Office", type: "Platform", typeIcon: Building2, typeColor: "#6d28d9", source: "Platform", description: "T-Office mandate, service catalogue, and engagement pathways.", route: "/transformation-office" },

  // Knowledge articles (seeded)
  { title: "EA Charter & Strategy", type: "Knowledge", typeIcon: BookOpen, typeColor: "#6d28d9", source: "Knowledge & Best Practices", description: "DEWA's enterprise architecture charter, strategic goals, and governance mandate.", route: "/marketplaces/knowledge" },
  { title: "Smart Grid Strategy 2021–2035", type: "Knowledge", typeIcon: Zap, typeColor: "#D97706", source: "Knowledge & Best Practices", description: "Grid modernisation roadmap, milestones, and architecture alignment.", route: "/marketplaces/knowledge" },
  { title: "Digital Maturity Assessment Framework", type: "Knowledge", typeIcon: BarChart3, typeColor: "#0369A1", source: "Knowledge & Best Practices", description: "12-domain capability maturity model — L0 to L5 scoring methodology.", route: "/marketplaces/knowledge" },
  { title: "OT/IT Convergence Standards", type: "Knowledge", typeIcon: Building2, typeColor: "#16A34A", source: "Knowledge & Best Practices", description: "Architecture standards for IT and OT system integration across DEWA.", route: "/marketplaces/knowledge" },

  // Learning (seeded)
  { title: "EA Foundations for DEWA", type: "Learning", typeIcon: GraduationCap, typeColor: "#6d28d9", source: "Transformation Methodology & Learning", description: "Introductory course on enterprise architecture principles in the DEWA context.", route: "/marketplaces/learning" },
  { title: "4D Model Deep Dive", type: "Learning", typeIcon: GraduationCap, typeColor: "#6d28d9", source: "Transformation Methodology & Learning", description: "A structured learning track on the DTMP governance framework.", route: "/marketplaces/learning" },
  { title: "Digital Transformation for Divisional Leads", type: "Learning", typeIcon: GraduationCap, typeColor: "#6d28d9", source: "Transformation Methodology & Learning", description: "Transformation leadership skills for divisional change agents.", route: "/marketplaces/learning" },

  // Support
  { title: "Platform Access Request", type: "Support", typeIcon: HelpCircle, typeColor: "#D97706", source: "Support & Expert Services", description: "Request access to DTMP marketplaces and workspaces.", route: "/marketplaces/support" },
  { title: "Data Correction Request", type: "Support", typeIcon: HelpCircle, typeColor: "#D97706", source: "Support & Expert Services", description: "Submit corrections to asset records, capability maturity data, or EA mappings.", route: "/marketplaces/support" },
  { title: "EA Advisory Session", type: "Support", typeIcon: HelpCircle, typeColor: "#D97706", source: "Support & Expert Services", description: "Book an expert consultation with the EA Office for architecture guidance.", route: "/marketplaces/support" },
];

// Group order and labels
const groupOrder = ["Marketplace", "Knowledge", "Learning", "Division", "Support", "Platform"];

interface Props {
  onClose: () => void;
}

export default function GlobalSearch({ onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Search as you type
  const handleQuery = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const lower = q.toLowerCase();
    const filtered = searchIndex.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower) ||
        item.source.toLowerCase().includes(lower) ||
        item.type.toLowerCase().includes(lower)
    );
    setResults(filtered);
  }, []);

  const handleNavigate = (route: string) => {
    navigate(route);
    onClose();
  };

  // Group results
  const grouped = groupOrder.reduce<Record<string, SearchItem[]>>((acc, group) => {
    const items = results.filter((r) => r.type === group);
    if (items.length > 0) acc[group] = items;
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            placeholder="Search across DEWA's transformation platform..."
            className="flex-1 text-slate-800 text-sm outline-none placeholder:text-slate-400"
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-200 bg-slate-50">
              ESC
            </kbd>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query && (
            <div className="px-5 py-8 text-center">
              <Search size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">
                Search across marketplaces, knowledge, initiatives, assets, learning, and support
              </p>
              <p className="text-slate-300 text-xs mt-1">
                Try: "Smart Grid", "assessment", "capability", "learning track"
              </p>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-slate-500 text-sm font-medium mb-2">No results for "{query}"</p>
              <p className="text-slate-400 text-xs mb-6">Try a different term, or browse by category:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Marketplaces", "Divisions", "Knowledge", "Learning"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleQuery(cat.toLowerCase())}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-violet-400 hover:text-violet-600 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && Object.keys(grouped).length > 0 && (
            <div className="py-2">
              {Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  <div className="px-5 pt-4 pb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{group}</p>
                  </div>
                  {items.map((item) => {
                    const Icon = item.typeIcon;
                    return (
                      <button
                        key={item.route + item.title}
                        onClick={() => handleNavigate(item.route)}
                        className="w-full flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: item.typeColor + "15" }}
                        >
                          <Icon size={15} style={{ color: item.typeColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 leading-tight mb-0.5 truncate">{item.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">{item.description}</p>
                        </div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                          style={{ color: item.typeColor, background: item.typeColor + "15" }}
                        >
                          {item.source}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Smart Search — Build phase placeholder */}
        <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-violet-400" />
            <span className="text-xs font-semibold text-slate-600">AI Smart Search</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">
              Build Phase
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Intent-aware search — coming in Build phase</span>
        </div>
      </div>
    </div>
  );
}
