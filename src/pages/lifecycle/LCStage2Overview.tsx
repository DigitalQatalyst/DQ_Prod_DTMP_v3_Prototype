import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, ClipboardList, RefreshCw, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDemoAccount, getLifecycleRole } from "@/data/shared/lifecycleRole";
import {
  getLCRequests,
  getApprovalQueue,
  type LCServiceRequest,
  type LCRequestStatus,
  type InitiativeApprovalRequest,
} from "@/data/lifecycle/serviceRequestState";
import {
  getInitiatives,
  getProjects,
  type Initiative,
} from "@/data/shared/lifecyclePortfolioStore";
import { toast } from "@/hooks/use-toast";

const STATUS_ACTIVE_SET: LCRequestStatus[] = ["Submitted", "Assigned", "In Progress"];

const getStatusColor = (status: string) => {
  if (status === "Submitted") return "bg-sky-100 text-sky-700 border-sky-200";
  if (status === "Assigned") return "bg-purple-100 text-purple-700 border-purple-200";
  if (status === "In Progress") return "bg-blue-100 text-blue-700 border-blue-200";
  if (status === "Delivered") return "bg-green-100 text-green-700 border-green-200";
  if (status === "Completed") return "bg-green-50 text-green-600 border-green-100";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
};

const endOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
};

export default function LCStage2Overview() {
  const role = getLifecycleRole() ?? "initiative-owner";
  const currentUser = getDemoAccount(role);

  const requests = useMemo(() => getLCRequests(currentUser.name), [currentUser.name]);
  const approvalRequests = useMemo(
    () => getApprovalQueue().filter((r) => r.submittedBy === currentUser.name)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [currentUser.name]
  );
  const [initiatives, setInitiatives] = useState<Initiative[]>(() => getInitiatives());
  const [projects, setProjects] = useState(() => getProjects());

  useEffect(() => {
    const refreshPortfolioData = () => {
      setInitiatives(getInitiatives());
      setProjects(getProjects());
    };

    window.addEventListener("storage", refreshPortfolioData);
    return () => window.removeEventListener("storage", refreshPortfolioData);
  }, []);

  const myInitiatives = useMemo(() => {
    const mine: Initiative[] = [];
    for (const ini of initiatives) {
      const isOwner = ini.owner === currentUser.name;
      const isPM = projects.some((p) => p.parentInitiativeId === ini.id && p.pmName === currentUser.name);
      if (isOwner || isPM) mine.push(ini);
    }
    return mine;
  }, [initiatives, projects, currentUser.name]);

  const totals = useMemo(() => {
    const totalRequests = requests.length;
    const activeRequests = requests.filter((r) => STATUS_ACTIVE_SET.includes(r.status)).length;

    const start = startOfMonth();
    const end = endOfMonth();
    const deliveriesThisMonth = requests.filter((r) => {
      const deliveredAt = r.deliveredAt ? new Date(r.deliveredAt).getTime() : null;
      return deliveredAt !== null && deliveredAt >= start && deliveredAt <= end && (r.status === "Delivered" || r.status === "Completed");
    }).length;

    return { totalRequests, activeRequests, deliveriesThisMonth };
  }, [requests]);

  const lastActiveRequests: LCServiceRequest[] = useMemo(() => {
    return [...requests]
      .filter((r) => STATUS_ACTIVE_SET.includes(r.status))
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);
  }, [requests]);

  const deliveredRequests: LCServiceRequest[] = useMemo(() => {
    return [...requests]
      .filter((r) => r.status === "Delivered" || r.status === "Completed")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [requests]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lifecycle Management - My Workspace</h1>
        <p className="text-gray-500 mt-1">Track formal TO support requests, delivery responses, and initiative ownership.</p>
      </div>

      <Card className="border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">How This Workspace Works</p>
              <h2 className="text-lg font-semibold mt-2">Stage 2 is the support and response layer for governed initiatives.</h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Initiatives stay in Lifecycle as the strategic execution wrapper. This workspace tracks the formal TO support channels,
                shows which requests are active, and records what outcomes came back into delivery.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-[280px]">
              {[
                { label: "Initiative", value: "Governed delivery context" },
                { label: "Support request", value: "Formal TO workflow item" },
                { label: "Delivered item", value: "Support response returned to delivery" },
                { label: "Open in Lifecycle", value: "Return to the initiative execution view" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className="text-xs text-slate-100 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totals.totalRequests}</p>
              </div>
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totals.activeRequests}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Deliveries This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totals.deliveriesThisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Initiatives I Own</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{myInitiatives.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-700 font-bold">TO</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Initiative Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{approvalRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">My Active Requests</h2>
                <p className="text-sm text-gray-500 mt-1">Open support channels currently moving through the TO workflow.</p>
              </div>
              <Badge variant="outline" className="text-xs border-gray-200">
                {lastActiveRequests.length} listed
              </Badge>
            </div>

            {lastActiveRequests.length === 0 ? (
              <p className="text-sm text-gray-500">You have no active requests.</p>
            ) : (
              <div className="space-y-3">
                {lastActiveRequests.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-4 p-3 border border-gray-200 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{r.serviceType}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        Initiative: {r.initiativeName}
                        {r.projectName ? ` · Project: ${r.projectName}` : ""}
                      </p>
                      {r.sourceName && (
                        <p className="text-xs text-gray-400 mt-0.5">â†³ From {r.sourceType}: {r.sourceName}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{new Date(r.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <Badge className={`text-xs border ${getStatusColor(r.status)}`}>
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Delivered</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Support outcomes that have been completed or delivered back to you.</p>
                </div>
                <Badge variant="outline" className="text-xs border-gray-200">
                  {deliveredRequests.length} listed
                </Badge>
              </div>

              {deliveredRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No delivered requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {deliveredRequests.map((r) => (
                    <div key={r.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{r.serviceType}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            Initiative: {r.initiativeName}
                            {r.projectName ? ` Â· Project: ${r.projectName}` : ""}
                          </p>
                          {r.sourceName && (
                            <p className="text-xs text-gray-400 mt-0.5">â†³ From {r.sourceType}: {r.sourceName}</p>
                          )}
                        </div>
                        <Badge className={`text-xs border ${getStatusColor(r.status)}`}>
                          {r.status}
                        </Badge>
                      </div>
                      <button
                        onClick={() => { window.location.href = `/marketplaces/initiative-portfolio/initiative/${r.initiativeId}`; }}
                        className="text-xs text-teal-600 hover:text-teal-800 font-medium mt-2 flex items-center gap-1"
                      >
                        View in Lifecycle â†’
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Initiatives</h2>
              <p className="text-sm text-gray-500 mt-1">Short list of initiatives where you are owner or PM.</p>
            </div>

            {myInitiatives.length === 0 ? (
              <p className="text-sm text-gray-500">No initiatives found for your demo role.</p>
            ) : (
              <div className="space-y-3">
                {myInitiatives.slice(0, 4).map((ini) => (
                  <div key={ini.id} className="flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{ini.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{ini.type}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="shrink-0"
                      onClick={() => {
                        window.localStorage.setItem("dtmp.lifecycle.openInitiativeId", ini.id);
                        toast({ title: "Opening Stage 1", description: "Navigating to Lifecycle Management (demo)." });
                        window.location.href = "/marketplaces/initiative-portfolio";
                      }}
                    >
                      Open in Lifecycle
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild variant="outline">
                <Link to="/marketplaces/initiative-portfolio">Browse Initiatives</Link>
              </Button>
              <Button asChild>
                <Link to="/marketplaces/initiative-portfolio">Start Initiative</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Initiative Approval Requests submitted by this user */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Initiative Requests</h2>
              <p className="text-sm text-gray-500 mt-1">Initiative proposals you submitted for TO approval.</p>
            </div>
            <Badge variant="outline" className="text-xs border-gray-200">
              {approvalRequests.length} submitted
            </Badge>
          </div>

          {approvalRequests.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">
              <p>No initiative requests yet.</p>
              <Button asChild className="mt-3 bg-orange-600 hover:bg-orange-700 text-white" size="sm">
                <Link to="/marketplaces/initiative-portfolio">Start an Initiative</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {approvalRequests.map((r: InitiativeApprovalRequest) => (
                <div key={r.id} className="flex items-start justify-between gap-4 p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{r.initiativeName}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {r.frameworkType} · {r.division}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span>Submitted {new Date(r.submittedAt).toLocaleDateString()}</span>
                      {r.priority && (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          r.priority === "Critical" ? "bg-red-100 text-red-700" :
                          r.priority === "High" ? "bg-orange-100 text-orange-700" :
                          r.priority === "Medium" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{r.priority}</span>
                      )}
                    </div>
                  </div>
                  <Badge className={`text-xs border flex-shrink-0 ${
                    r.status === "Pending" ? "bg-amber-100 text-amber-700 border-amber-200" :
                    r.status === "Approved" ? "bg-green-100 text-green-700 border-green-200" :
                    r.status === "Rejected" ? "bg-red-100 text-red-700 border-red-200" :
                    "bg-sky-100 text-sky-700 border-sky-200"
                  }`}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

