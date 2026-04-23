import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, CheckCheck, X, FileText, TrendingUp, AlertTriangle, Clock, Database, ChevronRight,
} from "lucide-react";
import { isTOStage3Role } from "@/data/sessionRole";
import { getSessionRole } from "@/data/sessionRole";

// ── Seeded notification data ──────────────────────────────────────────────────
export type NotifType =
  | "request-update"
  | "request-completed"
  | "initiative-milestone"
  | "sla-warning"
  | "governance-alert"
  | "data-correction";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: string;
  route: string;
  toOnly?: boolean; // if true, only shown to TO/Stage3 role
}

const SEEDED_NOTIFICATIONS: Notification[] = [
  {
    id: "n01",
    type: "request-update",
    title: "Request Assigned",
    body: "Your Digital Maturity Assessment request has been assigned to the EA Office delivery team.",
    timestamp: "2 hours ago",
    route: "/stage2",
  },
  {
    id: "n02",
    type: "request-completed",
    title: "Artefact Ready",
    body: "Your High-Level Architecture Design (HLAD) request is complete and ready for download.",
    timestamp: "4 hours ago",
    route: "/stage2/document-studio/my-requests",
  },
  {
    id: "n03",
    type: "initiative-milestone",
    title: "Stage Gate Reached",
    body: "Smart Grid Capability Assessment initiative has reached Stage Gate 2 — review required.",
    timestamp: "Yesterday",
    route: "/marketplaces/initiative-portfolio",
  },
  {
    id: "n04",
    type: "sla-warning",
    title: "SLA Warning",
    body: "3 artefact requests are approaching SLA breach — action required within 24 hours.",
    timestamp: "1 hour ago",
    route: "/stage3/dashboard",
    toOnly: true,
  },
  {
    id: "n05",
    type: "governance-alert",
    title: "Approvals Pending",
    body: "2 completed artefacts are awaiting your approval before publication to the marketplace.",
    timestamp: "3 hours ago",
    route: "/stage3/dashboard",
    toOnly: true,
  },
  {
    id: "n06",
    type: "data-correction",
    title: "Data Correction Processed",
    body: "Your Transmission SCADA asset data correction has been reviewed and processed.",
    timestamp: "Yesterday",
    route: "/stage2",
  },
  {
    id: "n07",
    type: "request-update",
    title: "Request In Review",
    body: "Your Application Profile request for the Distribution Management System is now under EA review.",
    timestamp: "2 days ago",
    route: "/stage2/document-studio/my-requests",
  },
];

const typeConfig: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  "request-update":     { icon: FileText,     color: "#0369A1", bg: "#f0f9ff" },
  "request-completed":  { icon: CheckCheck,   color: "#16A34A", bg: "#f0fdf4" },
  "initiative-milestone": { icon: TrendingUp, color: "#6d28d9", bg: "#f5f3ff" },
  "sla-warning":        { icon: AlertTriangle, color: "#D97706", bg: "#fffbeb" },
  "governance-alert":   { icon: Clock,        color: "#DC2626", bg: "#fef2f2" },
  "data-correction":    { icon: Database,     color: "#0D9488", bg: "#f0fdfa" },
};

interface Props {
  onClose: () => void;
}

export default function NotificationsCenter({ onClose }: Props) {
  const navigate = useNavigate();
  const isTO = isTOStage3Role(getSessionRole());

  // Filter TO-only notifications for non-TO users
  const available = SEEDED_NOTIFICATIONS.filter((n) => !n.toOnly || isTO);

  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const markRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  const markAllRead = () => {
    setReadIds(new Set(available.map((n) => n.id)));
  };

  const unreadCount = available.filter((n) => !readIds.has(n.id)).length;

  const handleClick = (notif: Notification) => {
    markRead(notif.id);
    navigate(notif.route);
    onClose();
  };

  return (
    <div
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
      style={{ maxHeight: "520px", display: "flex", flexDirection: "column" }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-700" />
          <span className="font-bold text-slate-900 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-violet-600 font-semibold hover:text-violet-800 transition-colors flex items-center gap-1"
            >
              <CheckCheck size={12} /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="overflow-y-auto flex-1">
        {available.length === 0 && (
          <div className="px-5 py-10 text-center">
            <Bell size={28} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No notifications</p>
          </div>
        )}

        {available.length > 0 && (
          <div className="py-2">
            {available.map((notif) => {
              const isUnread = !readIds.has(notif.id);
              const cfg = typeConfig[notif.type];
              const Icon = cfg.icon;

              return (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className="w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                  style={isUnread ? { background: "#fafbff" } : {}}
                >
                  {/* Type icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: cfg.bg }}
                  >
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <p
                        className="text-sm leading-tight"
                        style={{ fontWeight: isUnread ? 700 : 500, color: isUnread ? "#1e293b" : "#475569" }}
                      >
                        {notif.title}
                      </p>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-1">{notif.body}</p>
                    <p className="text-[10px] text-slate-400">{notif.timestamp}</p>
                  </div>

                  <ChevronRight size={13} className="text-slate-300 shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel footer */}
      {available.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-3 shrink-0">
          <p className="text-xs text-slate-400 text-center">
            Notifications are generated by platform activity — seeded for prototype
          </p>
        </div>
      )}
    </div>
  );
}
