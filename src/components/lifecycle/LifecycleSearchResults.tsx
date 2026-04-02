import { Search } from "lucide-react";

interface LifecycleSearchResultsProps {
  query: string;
  initiativeMatches: Array<{ id: string; name: string; meta: string }>;
  frameworkMatches: Array<{ id: string; name: string; meta: string }>;
  onSelectInitiative: (id: string) => void;
  onSelectFramework: (id: string) => void;
}

export default function LifecycleSearchResults({
  query,
  initiativeMatches,
  frameworkMatches,
  onSelectInitiative,
  onSelectFramework,
}: LifecycleSearchResultsProps) {
  if (!query.trim()) return null;

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-orange-600" />
        <p className="text-sm font-semibold text-gray-900">Search results for “{query}”</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Initiatives</p>
          <div className="mt-2 space-y-2">
            {initiativeMatches.length === 0 ? (
              <p className="text-sm text-gray-500">No initiative matches.</p>
            ) : (
              initiativeMatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectInitiative(item.id)}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left transition-colors hover:border-orange-200 hover:bg-orange-50"
                >
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.meta}</p>
                </button>
              ))
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Frameworks</p>
          <div className="mt-2 space-y-2">
            {frameworkMatches.length === 0 ? (
              <p className="text-sm text-gray-500">No framework matches.</p>
            ) : (
              frameworkMatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectFramework(item.id)}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left transition-colors hover:border-orange-200 hover:bg-orange-50"
                >
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.meta}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
