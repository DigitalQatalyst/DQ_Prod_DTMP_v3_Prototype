import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, ExternalLink, Trash2, Clock } from "lucide-react";
import { PM_TAB_CONFIG, type PMTab } from "@/data/portfolioManagement";

interface SavedView {
  id: string;
  name?: string;
  assetName?: string;
  tabSource?: PMTab;
  tab?: PMTab;
  filters?: Record<string, string>;
  lastVisited: string;
  createdAt?: string;
  url?: string;
}

const SAVED_KEY = "dtmp.portfolio.savedViews";

function getSavedViews(): SavedView[] {
  try {
    const stored = localStorage.getItem(SAVED_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as SavedView[];
      if (parsed.length) return parsed;
    }
  } catch {}
  return [];
}

function deleteSavedView(id: string): void {
  const views = getSavedViews().filter((v) => v.id !== id);
  localStorage.setItem(SAVED_KEY, JSON.stringify(views));
}

export default function PMSavedViewsPage() {
  const navigate = useNavigate();
  const [views, setViews] = useState<SavedView[]>(getSavedViews());

  const handleDelete = (id: string) => {
    deleteSavedView(id);
    setViews(getSavedViews());
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Saved Views</h2>
        <p className="text-sm text-gray-500">
          Bookmarked Stage 1 intelligence views — return to specific cards and insights quickly
        </p>
      </div>

      {views.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No saved views yet</p>
          <p className="text-xs mt-1 text-gray-400">
            Browse Portfolio Management and save card insights views to return to them quickly
          </p>
          <button
            onClick={() => navigate("/marketplaces/portfolio-management")}
            className="mt-4 text-xs bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Browse Portfolio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {views.map((view) => {
            const resolvedTab = (view.tab || view.tabSource) as PMTab | undefined;
            const tabCfg = resolvedTab ? PM_TAB_CONFIG[resolvedTab] : null;
            const displayName = view.name || view.assetName || "Saved View";
            const filterSummary = view.filters ? Object.entries(view.filters).filter(([, v]) => v && v !== "All" && v !== "All Divisions").map(([k, v]) => `${k}: ${v}`).join(" · ") : null;
            return (
              <div key={view.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-orange-200 transition-colors">
                <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bookmark className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {tabCfg && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tabCfg.shortLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                  {filterSummary && <p className="text-xs text-gray-400 mt-0.5">{filterSummary}</p>}
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-400">Saved {view.createdAt ? view.createdAt.split("T")[0] : view.lastVisited}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      const tab = view.tab || view.tabSource;
                      navigate("/marketplaces/portfolio-management", {
                        state: { tab, restoreFilters: view.filters || {} },
                      });
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </button>
                  <button
                    onClick={() => handleDelete(view.id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
