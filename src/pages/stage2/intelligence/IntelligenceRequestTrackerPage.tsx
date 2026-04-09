import { useEffect, useState, type ReactNode } from "react";
import {
  ShieldCheck,
  Database,
  Wrench,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDITORequests, type DITORequest } from "@/data/digitalIntelligence/requestState";
import {
  dashboardRequests,
  type DashboardUpdateRequest,
} from "@/data/digitalIntelligence/stage2";

type TrackedRequest = DITORequest | DashboardUpdateRequest;

const accessDashboardTypes: DashboardUpdateRequest["requestType"][] = [
  "request-api",
  "share-dashboard",
];

const remediationTypes: DashboardUpdateRequest["requestType"][] = [
  "add-visualization",
  "modify-chart",
  "fix-data",
  "change-layout",
  "request-audit",
];

const formatDate = (dateValue: string) =>
  new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const getAccessStatusTone = (status: DITORequest["status"]) => {
  switch (status) {
    case "Resolved":
      return "bg-green-100 text-green-700";
    case "In Review":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getDashboardStatusTone = (status: DashboardUpdateRequest["status"]) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "in-progress":
      return "bg-blue-100 text-blue-700";
    case "under-review":
      return "bg-yellow-100 text-yellow-700";
    case "declined":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getDashboardTypeLabel = (requestType: DashboardUpdateRequest["requestType"]) => {
  switch (requestType) {
    case "request-api":
      return "API Access";
    case "share-dashboard":
      return "Dashboard Sharing";
    case "new-data-source":
      return "Data Source";
    case "add-visualization":
      return "Add Visualization";
    case "modify-chart":
      return "Remediation";
    case "fix-data":
      return "Data Fix";
    case "change-layout":
      return "Layout Change";
    case "request-audit":
      return "Audit Request";
    default:
      return requestType;
  }
};

function SectionCard({
  title,
  description,
  icon: Icon,
  requests,
  emptyMessage,
  renderRequest,
}: {
  title: string;
  description: string;
  icon: typeof ShieldCheck;
  requests: TrackedRequest[];
  emptyMessage: string;
  renderRequest: (request: TrackedRequest) => ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {requests.length > 0 ? (
        <div className="space-y-3">{requests.map(renderRequest)}</div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
          {emptyMessage}
        </div>
      )}
    </Card>
  );
}

export default function IntelligenceRequestTrackerPage() {
  const [accessRequests, setAccessRequests] = useState<DITORequest[]>([]);
  const [dashboardState, setDashboardState] = useState<DashboardUpdateRequest[]>([]);

  useEffect(() => {
    const refreshRequests = () => {
      setAccessRequests(getDITORequests());
      setDashboardState([...dashboardRequests]);
    };

    refreshRequests();
    window.addEventListener("focus", refreshRequests);
    window.addEventListener("storage", refreshRequests);
    return () => {
      window.removeEventListener("focus", refreshRequests);
      window.removeEventListener("storage", refreshRequests);
    };
  }, []);

  const accessTrackerRequests = dashboardState.filter((request) =>
    accessDashboardTypes.includes(request.requestType)
  );
  const datasourceRequests = dashboardState.filter(
    (request) => request.requestType === "new-data-source"
  );
  const remediationRequests = dashboardState.filter((request) =>
    remediationTypes.includes(request.requestType)
  );

  const activeRequestCount =
    accessRequests.filter((request) => request.status !== "Resolved").length +
    dashboardState.filter((request) =>
      request.status === "submitted" ||
      request.status === "under-review" ||
      request.status === "in-progress"
    ).length;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Intelligence Requests</h1>
          <p className="text-gray-600 mt-1">
            Track access, data source, and remediation requests submitted from the Stage 1 dashboard.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Loader2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Requests</p>
              <p className="text-2xl font-bold text-gray-900">{activeRequestCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {accessRequests.filter((request) => request.status === "Resolved").length +
                  dashboardState.filter((request) => request.status === "completed").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Submitted Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {accessRequests.length + dashboardState.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <SectionCard
          title="My Access Requests"
          description="Analytics access, API access, and dashboard sharing requests."
          icon={ShieldCheck}
          requests={[...accessRequests, ...accessTrackerRequests]}
          emptyMessage="No access requests have been submitted yet."
          renderRequest={(request) => {
            if ("tab" in request) {
              return (
                <div key={request.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{request.serviceTitle}</p>
                      <p className="text-xs text-gray-500">{request.tab.replace(/-/g, " ")}</p>
                    </div>
                    <Badge className={getAccessStatusTone(request.status)}>{request.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-700">{request.message}</p>
                  <p className="text-xs text-gray-500 mt-3">Submitted {formatDate(request.createdAt)}</p>
                </div>
              );
            }

            return (
              <div key={request.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{request.dashboardName}</p>
                    <p className="text-xs text-gray-500">{getDashboardTypeLabel(request.requestType)}</p>
                  </div>
                  <Badge className={getDashboardStatusTone(request.status)}>
                    {request.status.replace(/-/g, " ")}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">{request.description}</p>
                <p className="text-xs text-gray-500 mt-3">Submitted {formatDate(request.submittedDate)}</p>
              </div>
            );
          }}
        />

        <SectionCard
          title="My Datasource Requests"
          description="Requests to add or update a Digital Intelligence data source."
          icon={Database}
          requests={datasourceRequests}
          emptyMessage="No datasource requests have been submitted yet."
          renderRequest={(request) => {
            const typedRequest = request as DashboardUpdateRequest;
            return (
              <div key={typedRequest.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{typedRequest.dashboardName}</p>
                    <p className="text-xs text-gray-500">
                      {typedRequest.requestedDataSource?.name || "Requested source change"}
                    </p>
                  </div>
                  <Badge className={getDashboardStatusTone(typedRequest.status)}>
                    {typedRequest.status.replace(/-/g, " ")}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">{typedRequest.description}</p>
                <p className="text-xs text-gray-500 mt-3">
                  Submitted {formatDate(typedRequest.submittedDate)}
                </p>
              </div>
            );
          }}
        />

        <SectionCard
          title="My Remediation Requests"
          description="Dashboard fixes, audits, layout changes, and visualization updates."
          icon={Wrench}
          requests={remediationRequests}
          emptyMessage="No remediation requests have been submitted yet."
          renderRequest={(request) => {
            const typedRequest = request as DashboardUpdateRequest;
            return (
              <div key={typedRequest.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{typedRequest.dashboardName}</p>
                    <p className="text-xs text-gray-500">
                      {getDashboardTypeLabel(typedRequest.requestType)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getDashboardStatusTone(typedRequest.status)}>
                      {typedRequest.status.replace(/-/g, " ")}
                    </Badge>
                    {typedRequest.priority === "urgent" && (
                      <Badge className="bg-red-100 text-red-700">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{typedRequest.description}</p>
                <p className="text-xs text-gray-500 mt-3">
                  Submitted {formatDate(typedRequest.submittedDate)}
                </p>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

