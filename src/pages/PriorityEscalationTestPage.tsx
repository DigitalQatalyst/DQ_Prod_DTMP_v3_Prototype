import { useState } from "react";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buildRequests, escalateBuildRequestPriority, type BuildRequest } from "@/data/solutionBuild";

export default function PriorityEscalationTestPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BuildRequest[]>(buildRequests);
  const [selectedRequest, setSelectedRequest] = useState<BuildRequest | null>(requests[0] || null);

  const getPriorityColor = (priority: BuildRequest["priority"]) => {
    const map: Record<string, string> = {
      critical: "text-red-600 bg-red-50 border-red-200",
      high: "text-orange-600 bg-orange-50 border-orange-200",
      medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
      low: "text-gray-600 bg-gray-50 border-gray-200",
    };
    return map[priority] ?? "text-gray-600 bg-gray-50 border-gray-200";
  };

  const handleEscalate = (request: BuildRequest) => {
    const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const currentLevel = priorityOrder[request.priority];

    if (currentLevel >= 3) {
      alert("This request is already at critical priority.");
      return;
    }

    const nextPriority = Object.keys(priorityOrder).find(
      (key) => priorityOrder[key as keyof typeof priorityOrder] === currentLevel + 1
    ) as "low" | "medium" | "high" | "critical";

    const reason = prompt(
      `Escalate priority from ${request.priority} to ${nextPriority}?\n\nPlease provide a reason for escalation:`
    );

    if (!reason || !reason.trim()) return;

    const updated = escalateBuildRequestPriority(
      request.id,
      nextPriority,
      reason.trim(),
      "Test User"
    );

    if (updated) {
      const updatedRequests = requests.map((req) =>
        req.id === updated.id ? updated : req
      );
      setRequests(updatedRequests);
      setSelectedRequest(updated);
      alert(`✅ Priority escalated to ${nextPriority}!\n\nCheck the messages below to see the audit trail.`);
    } else {
      alert("Unable to escalate priority. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Priority Escalation Feature Test
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Test the new priority escalation functionality
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">How to Test:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Select a build request from the list below</li>
            <li>Look at the Priority card (3rd card in the stats row)</li>
            <li>Click the trending-up arrow icon (↗) next to "Priority"</li>
            <li>Enter a reason for escalation in the prompt</li>
            <li>See the priority update and check the messages section</li>
          </ol>
        </div>

        {/* Request List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {requests.slice(0, 4).map((request) => (
            <button
              key={request.id}
              onClick={() => setSelectedRequest(request)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                selectedRequest?.id === request.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{request.name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(
                    request.priority
                  )}`}
                >
                  {request.priority}
                </span>
              </div>
              <p className="text-sm text-gray-500">{request.id}</p>
            </button>
          ))}
        </div>

        {/* Selected Request Detail */}
        {selectedRequest && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {selectedRequest.name}
            </h2>

            {/* Stats Cards - THIS IS WHERE THE FEATURE IS */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg border p-4">
                <p className="text-sm text-gray-500 mb-1">Progress</p>
                <p className="text-2xl font-semibold">{selectedRequest.progress}%</p>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <p className="text-sm text-gray-500 mb-1">Type</p>
                <p className="text-lg font-semibold capitalize">{selectedRequest.type}</p>
              </div>
              <div className="bg-white rounded-lg border p-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">Priority</p>
                  {selectedRequest.priority !== "critical" && (
                    <button
                      onClick={() => handleEscalate(selectedRequest)}
                      className="p-1.5 hover:bg-orange-100 rounded transition-colors group"
                      title="Escalate Priority"
                    >
                      <TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                    </button>
                  )}
                </div>
                <p
                  className={`text-lg font-semibold capitalize ${
                    selectedRequest.priority === "critical"
                      ? "text-red-600"
                      : selectedRequest.priority === "high"
                      ? "text-orange-600"
                      : selectedRequest.priority === "medium"
                      ? "text-yellow-600"
                      : "text-gray-600"
                  }`}
                >
                  {selectedRequest.priority}
                </p>
                {selectedRequest.priority !== "critical" && (
                  <p className="text-xs text-gray-400 mt-1">
                    ← Click icon to escalate
                  </p>
                )}
              </div>
            </div>

            {/* Business Need */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Business Need</h3>
              <p className="text-sm text-gray-700">{selectedRequest.businessNeed}</p>
            </div>

            {/* Messages / Audit Trail */}
            {selectedRequest.messages.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Messages & Audit Trail
                </h3>
                <div className="space-y-2">
                  {selectedRequest.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.content.includes("Priority escalated")
                          ? "bg-orange-50 border border-orange-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.sender}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                        {message.content.includes("Priority escalated") && (
                          <span className="px-2 py-0.5 bg-orange-600 text-white text-xs rounded-full">
                            ESCALATION
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
