import { createStage3Request } from "@/data/stage3";
import type { DIServiceTab } from "@/data/digitalIntelligence/requestState";
import { addDashboardRequest, dashboardRequests } from "./dashboardRequests";
import type { DashboardUpdateRequest } from "./types";

export type DIDashboardAction =
  | "schedule-report"
  | "set-alert"
  | "share-dashboard"
  | "request-audit"
  | "request-api"
  | "add-visualization"
  | "modify-chart"
  | "fix-data"
  | "new-data-source"
  | "change-layout"
  | "request-update"
  | "request-datasource";

const actionToRequestType: Record<
  DIDashboardAction,
  DashboardUpdateRequest["requestType"]
> = {
  "schedule-report": "schedule-report",
  "set-alert": "set-alert",
  "share-dashboard": "share-dashboard",
  "request-audit": "request-audit",
  "request-api": "request-api",
  "add-visualization": "add-visualization",
  "modify-chart": "modify-chart",
  "fix-data": "fix-data",
  "new-data-source": "new-data-source",
  "change-layout": "change-layout",
  "request-update": "modify-chart",
  "request-datasource": "new-data-source",
};

const actionLabels: Record<DIDashboardAction, string> = {
  "schedule-report": "Schedule Email Report",
  "set-alert": "Set Threshold Alert",
  "share-dashboard": "Share Dashboard",
  "request-audit": "Request Data Audit",
  "request-api": "Request API Access",
  "add-visualization": "Add Visualization",
  "modify-chart": "Modify Chart",
  "fix-data": "Fix Dashboard Data",
  "new-data-source": "Add Data Source",
  "change-layout": "Change Dashboard Layout",
  "request-update": "Request Remediation",
  "request-datasource": "Edit Data Source",
};

const stage3EstimatedHours: Record<DIDashboardAction, number> = {
  "schedule-report": 2,
  "set-alert": 3,
  "share-dashboard": 1,
  "request-audit": 16,
  "request-api": 8,
  "add-visualization": 8,
  "modify-chart": 6,
  "fix-data": 4,
  "new-data-source": 12,
  "change-layout": 4,
  "request-update": 6,
  "request-datasource": 12,
};

const excludedFallbackKeys = new Set([
  "email",
  "priority",
  "frequency",
  "direction",
  "accessLevel",
  "volume",
  "threshold",
  "dateRange",
  "metric",
  "sourceName",
  "connectionType",
  "name",
  "role",
]);

const getPriority = (
  rawPriority?: string
): DashboardUpdateRequest["priority"] => {
  if (
    rawPriority === "low" ||
    rawPriority === "medium" ||
    rawPriority === "high" ||
    rawPriority === "urgent"
  ) {
    return rawPriority;
  }

  return "medium";
};

const getRoleLabel = (email: string, fallbackRole?: string): string => {
  if (fallbackRole?.trim()) return fallbackRole.trim();

  const normalized = email.toLowerCase().trim();
  if (normalized === "admin@to.dtmp.com") return "TO Admin";
  if (normalized.endsWith("@to.dtmp.com")) return "TO Ops";
  return "Business User";
};

const resolveDescription = (
  serviceName: string,
  formData: Record<string, string>,
  requestDescription?: string
): string => {
  const preferredFields = [
    formData.description,
    formData.improvement,
    formData.reason,
    formData.useCase,
    formData.justification,
    formData.message,
  ]
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value));

  if (requestDescription?.trim()) return requestDescription.trim();
  if (preferredFields) return preferredFields;

  const fallbackField = Object.entries(formData)
    .filter(
      ([key, value]) =>
        !excludedFallbackKeys.has(key) &&
        typeof value === "string" &&
        value.trim().length > 0
    )
    .map(([, value]) => value.trim())
    .find((value) => value.length > 0);

  return fallbackField || `Request submitted for ${serviceName}.`;
};

const getTabLabel = (tab: DIServiceTab): string => {
  switch (tab) {
    case "systems-portfolio":
      return "Systems Portfolio";
    case "digital-maturity":
      return "Digital Maturity";
    case "projects-portfolio":
      return "Projects Portfolio";
    default:
      return "Digital Intelligence";
  }
};

export const submitDIDashboardActionRequest = (input: {
  action: DIDashboardAction;
  formData: Record<string, string>;
  serviceId: string;
  serviceName: string;
  serviceTab: DIServiceTab;
  actorEmail?: string;
  requesterName?: string;
  requesterRole?: string;
  requestDescription?: string;
}): DashboardUpdateRequest => {
  const requestType = actionToRequestType[input.action];
  const requesterEmail =
    input.actorEmail?.trim() || input.formData.email?.trim() || "user@dtmp.local";
  const requesterName =
    input.requesterName?.trim() ||
    input.formData.name?.trim() ||
    "Current User";
  const requesterRole = getRoleLabel(requesterEmail, input.requesterRole || input.formData.role);
  const priority = getPriority(input.formData.priority);
  const description = resolveDescription(
    input.serviceName,
    input.formData,
    input.requestDescription
  );

  const id = `REQ-INT-${new Date().getFullYear()}-${String(
    dashboardRequests.length + 1
  ).padStart(3, "0")}`;

  const request: DashboardUpdateRequest = {
    id,
    dashboardId: input.serviceId,
    dashboardName: input.serviceName,
    requestType,
    priority,
    description,
    submittedFormData: { ...input.formData },
    requestedBy: {
      id: "user-session",
      name: requesterName,
      email: requesterEmail,
      role: requesterRole,
    },
    status: "submitted",
    submittedDate: new Date().toISOString(),
    messages: [],
    notifyEmail: true,
    notifyInApp: true,
  };

  if (requestType === "new-data-source") {
    request.requestedDataSource = {
      name: input.formData.sourceName?.trim() || "Requested source change",
      justification: description,
      estimatedUsers: "my-team",
    };
  }

  addDashboardRequest(request);

  const stage3Priority: "low" | "medium" | "high" | "critical" =
    priority === "urgent" ? "critical" : priority;

  createStage3Request({
    type: "digital-intelligence",
    title: `Digital Intelligence - ${input.serviceName}`,
    description: `${actionLabels[input.action]} - ${description}`,
    requester: {
      name: requesterName,
      email: requesterEmail,
      department: requesterRole,
      organization: "DTMP",
    },
    priority: stage3Priority,
    estimatedHours: stage3EstimatedHours[input.action],
    tags: [
      "digital-intelligence",
      input.serviceTab,
      input.action,
      input.serviceId,
      `service-id:${input.serviceId}`,
    ],
    relatedAssets: [`di-request:${request.id}`, `di-dashboard:${input.serviceId}`],
    notes: [
      `Auto-created from the Stage 1 Digital Intelligence dashboard.`,
      `Service: ${input.serviceName} (${getTabLabel(input.serviceTab)}).`,
      `Action: ${actionLabels[input.action]}.`,
    ],
  });

  return request;
};
