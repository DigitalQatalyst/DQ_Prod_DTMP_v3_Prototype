import { Sparkles } from "lucide-react";
import { landingColors, landingGradients } from "@/components/landing/theme";

export const iconGradient = landingGradients.secondary;

export function SectionPill({ label }: { label: string }) {
  return (
    <div className="flex justify-center mb-4">
      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-300 bg-white text-xs font-semibold uppercase tracking-widest text-slate-500">
        <Sparkles size={12} style={{ color: landingColors.pillIcon }} />
        {label}
      </span>
    </div>
  );
}

export function IconBadge({ icon, size = 60 }: { icon: React.ReactNode; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{ width: size, height: size, background: iconGradient }}
    >
      {icon}
    </div>
  );
}

export function StatCard({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all duration-200" style={{}} onMouseEnter={e => (e.currentTarget.style.boxShadow = "6px 8px 24px rgba(6,95,70,0.16)")} onMouseLeave={e => (e.currentTarget.style.boxShadow = "")}>
      <p className="text-3xl font-bold mb-1" style={{ background: landingGradients.statText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{value}</p>
      <p className="font-semibold text-slate-800 text-sm mb-2">{label}</p>
      <p className="text-xs text-slate-500 leading-relaxed">{sub}</p>
    </div>
  );
}
