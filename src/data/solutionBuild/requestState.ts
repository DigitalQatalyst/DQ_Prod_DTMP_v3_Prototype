import { makeLocalStorageStore } from "@/data/shared/localStorageUtils";
import type { BuildRequest, BuildRequestStatus } from "./types";

const REQUESTS_KEY = "dtmp.solutionBuild.buildRequests";
const store = makeLocalStorageStore<BuildRequest>(REQUESTS_KEY, 300);

const readRequests = (): BuildRequest[] => store.read();
const writeRequests = (requests: BuildRequest[]): void => store.write(requests);

/**
 * Get all build requests, optionally filtered by requester
 */
export const getBuildRequests = (requesterName?: string): BuildRequest[] => {
  const requests = readRequests().sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  if (!requesterName) return requests;
  return requests.filter(
    (request) => request.requestedBy.toLowerCase() === requesterName.toLowerCase()
  );
};

/**
 * Add a new build request
 */
export const addBuildRequest = (request: BuildRequest): BuildRequest => {
  const requests = readRequests();
  writeRequests([request, ...requests]);
  return request;
};

/**
 * Update build request status
 */
export const updateBuildRequestStatus = (
  requestId: string,
  status: BuildRequestStatus
): BuildRequest | null => {
  const requests = readRequests();
  let updated: BuildRequest | null = null;
  const next = requests.map((request) => {
    if (request.id !== requestId) return request;
    updated = {
      ...request,
      status,
    };
    return updated;
  });
  writeRequests(next);
  return updated;
};

/**
 * Link build request to Stage 3 request
 */
export const linkBuildRequestToStage3 = (
  requestId: string,
  stage3RequestId: string
): BuildRequest | null => {
  const requests = readRequests();
  let updated: BuildRequest | null = null;
  const next = requests.map((request) => {
    if (request.id !== requestId) return request;
    updated = {
      ...request,
      stage3RequestId,
    };
    return updated;
  });
  writeRequests(next);
  return updated;
};

/**
 * Get a single build request by ID
 */
export const getBuildRequestById = (requestId: string): BuildRequest | null => {
  const requests = readRequests();
  return requests.find((request) => request.id === requestId) ?? null;
};

/**
 * Update entire build request
 */
export const updateBuildRequest = (
  requestId: string,
  updates: Partial<BuildRequest>
): BuildRequest | null => {
  const requests = readRequests();
  let updated: BuildRequest | null = null;
  const next = requests.map((request) => {
    if (request.id !== requestId) return request;
    updated = {
      ...request,
      ...updates,
    };
    return updated;
  });
  writeRequests(next);
  return updated;
};

/**
 * Escalate build request priority and add audit note
 * Only allows escalation (increasing priority), not de-escalation
 * Returns updated request or null if escalation not allowed
 */
export const escalateBuildRequestPriority = (
  requestId: string,
  newPriority: "low" | "medium" | "high" | "critical",
  reason: string,
  escalatedBy: string
): BuildRequest | null => {
  console.log('escalateBuildRequestPriority called with:', { requestId, newPriority, reason, escalatedBy });
  
  const requests = readRequests();
  console.log('All requests:', requests);
  
  const request = requests.find(r => r.id === requestId);
  console.log('Found request:', request);
  
  if (!request) {
    console.log('Request not found!');
    return null;
  }
  
  const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
  console.log('Priority check:', {
    current: request.priority,
    currentLevel: priorityOrder[request.priority],
    new: newPriority,
    newLevel: priorityOrder[newPriority],
    canEscalate: priorityOrder[newPriority] > priorityOrder[request.priority]
  });
  
  // Only allow escalation (not de-escalation)
  if (priorityOrder[newPriority] <= priorityOrder[request.priority]) {
    console.log('Escalation not allowed - new priority not higher than current');
    return null;
  }
  
  const timestamp = new Date().toISOString();
  const escalationNote = `Priority escalated from ${request.priority} to ${newPriority} by ${escalatedBy}: ${reason}`;
  
  const updated: BuildRequest = {
    ...request,
    priority: newPriority,
    messages: [
      ...request.messages,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender: escalatedBy,
        content: escalationNote,
        timestamp,
        mentions: [],
      },
    ],
  };
  
  const next = requests.map(r => r.id === requestId ? updated : r);
  writeRequests(next);
  console.log('Updated request written to storage');
  
  // If linked to Stage 3, trigger sync event
  if (updated.stage3RequestId) {
    window.dispatchEvent(new CustomEvent('buildRequestPriorityEscalated', {
      detail: {
        buildRequestId: requestId,
        stage3RequestId: updated.stage3RequestId,
        newPriority,
        reason,
      },
    }));
  }
  
  return updated;
};
