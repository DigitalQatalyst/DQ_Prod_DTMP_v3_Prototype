import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lightbulb, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitiatives, type Initiative, type InitiativeType } from "@/data/shared/lifecyclePortfolioStore";

const DISMISS_KEY_PREFIX = "initiative-recommender-dismissed-";

const STATUS_BADGE_CLASSES: Record<string, string> = {
  Active: "bg-teal-100 text-teal-700 border-teal-200",
  Scoping: "bg-blue-100 text-blue-700 border-blue-200",
  "At Risk": "bg-amber-100 text-amber-800 border-amber-200",
  "On Hold": "bg-slate-200 text-slate-600 border-slate-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Clarification Requested": "bg-sky-100 text-sky-700 border-sky-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
};

type DomainRecommendation = {
  label: string;
  tab: string;
  frameworkTitle: string;
  rationale: string;
};

const DOMAIN_RECOMMENDATIONS: Partial<Record<InitiativeType, DomainRecommendation>> = {
  "IT/OT Convergence": {
    label: "Operational Technology",
    tab: "ot-asset-portfolio",
    frameworkTitle: "OT Modernisation Recovery Initiative",
    rationale: "Strengthen the OT estate first to stabilise delivery dependencies and unblock execution risk.",
  },
  "Net-Zero Technology": {
    label: "Operational Technology",
    tab: "ot-asset-portfolio",
    frameworkTitle: "Sustainable OT Upgrade Initiative",
    rationale: "Prioritise OT capability uplift to reduce delivery exposure and support energy transition outcomes.",
  },
  "Architecture Remediation": {
    label: "IT Asset Estate",
    tab: "it-asset-portfolio",
    frameworkTitle: "Architecture Compliance Remediation Framework",
    rationale: "Address core IT estate gaps before expanding scope, so remediation work has a stronger delivery base.",
  },
  "Application Modernisation": {
    label: "IT Asset Estate",
    tab: "it-asset-portfolio",
    frameworkTitle: "Application Modernisation Accelerator",
    rationale: "Use a structured modernisation path to raise alignment and reduce dependency risk in the application estate.",
  },
  "Technology Rationalisation": {
    label: "Technology Rationalisation",
    tab: "technology-rationalisation",
    frameworkTitle: "Technology Rationalisation Review",
    rationale: "Consolidate overlapping technology decisions first to improve execution clarity and reduce drag on progress.",
  },
  "AI Deployment": {
    label: "Data & Digital Capability",
    tab: "data-digital-portfolio",
    frameworkTitle: "AI Readiness and Governance Sprint",
    rationale: "Improve data and digital readiness before scaling deployment to avoid repeating low-alignment patterns.",
  },
  "Data Platform": {
    label: "Data & Digital Capability",
    tab: "data-digital-portfolio",
    frameworkTitle: "Data Platform Foundation Initiative",
    rationale: "Strengthen the shared data foundation to support delivery recovery and improve architecture alignment.",
  },
  "DXP Programme": {
    label: "Data & Digital Capability",
    tab: "data-digital-portfolio",
    frameworkTitle: "Digital Experience Recovery Programme",
    rationale: "Re-anchor the programme on the capability canvas to improve sequencing, ownership, and delivery confidence.",
  },
  "Platform Deployment": {
    label: "Project Portfolio",
    tab: "project-portfolio",
    frameworkTitle: "Platform Delivery Recovery Framework",
    rationale: "Use the project portfolio lens to identify comparable delivery patterns and restore execution momentum.",
  },
  Digital: {
    label: "Data & Digital Capability",
    tab: "data-digital-portfolio",
    frameworkTitle: "Digital Capability Improvement Framework",
    rationale: "Sharpen digital capability priorities before adding more scope to an already fragile initiative.",
  },
  Operational: {
    label: "Operational Technology",
    tab: "ot-asset-portfolio",
    frameworkTitle: "Operational Uplift Initiative",
    rationale: "Stabilise the operational estate and delivery sequence before advancing more change volume.",
  },
  Strategic: {
    label: "Project Portfolio",
    tab: "project-portfolio",
    frameworkTitle: "Strategic Delivery Rebaseline",
    rationale: "Rebaseline strategic delivery through the portfolio lens to recover direction and sequencing.",
  },
  Innovation: {
    label: "Data & Digital Capability",
    tab: "data-digital-portfolio",
    frameworkTitle: "Innovation Readiness Initiative",
    rationale: "Tighten readiness and governance so innovation work can progress without compounding risk.",
  },
  "EA Maturity Improvement": {
    label: "IT Asset Estate",
    tab: "it-asset-portfolio",
    frameworkTitle: "EA Capability Uplift",
    rationale: "Raise core architecture maturity before expanding intervention scope across the estate.",
  },
  "DWS Modernisation": {
    label: "Project Portfolio",
    tab: "project-portfolio",
    frameworkTitle: "Workplace Services Modernisation Recovery",
    rationale: "Use proven delivery patterns from the wider portfolio to improve execution certainty.",
  },
  "Security Uplift": {
    label: "IT Asset Estate",
    tab: "it-asset-portfolio",
    frameworkTitle: "Security Control Recovery Initiative",
    rationale: "Reinforce the underlying estate controls first so uplift work has a stable execution path.",
  },
};

type RecommendationResult =
  | {
      kind: "initiative";
      title: "Related Initiative";
      rationale: string;
      initiative: Initiative;
    }
  | {
      kind: "framework";
      title: "Suggested Action";
      rationale: string;
      frameworkTitle: string;
      domainLabel: string;
      tab: string;
    };

function getAlignmentScore(value: number | null): number {
  return value ?? -1;
}

function findRecommendation(initiative: Initiative, initiatives: Initiative[]): RecommendationResult | null {
  const domain = DOMAIN_RECOMMENDATIONS[initiative.type];
  const candidates = initiatives.filter((item) => item.id !== initiative.id);

  const byRank = [...candidates].sort((left, right) => {
    const alignmentDelta = getAlignmentScore(right.eaAlignmentScore) - getAlignmentScore(left.eaAlignmentScore);
    if (alignmentDelta !== 0) return alignmentDelta;
    return right.progress - left.progress;
  });

  const sameType = byRank.find((item) => item.type === initiative.type);
  if (sameType) {
    return {
      kind: "initiative",
      title: "Related Initiative",
      rationale: `Highest-performing peer in the same initiative type, selected to show a stronger delivery pattern to follow.`,
      initiative: sameType,
    };
  }

  if (domain) {
    const sameDomain = byRank.find((item) => DOMAIN_RECOMMENDATIONS[item.type]?.tab === domain.tab);
    if (sameDomain) {
      return {
        kind: "initiative",
        title: "Related Initiative",
        rationale: `Closest match in the ${domain.label} domain, selected for stronger alignment and progress within the same capability area.`,
        initiative: sameDomain,
      };
    }

    return {
      kind: "framework",
      title: "Suggested Action",
      rationale: domain.rationale,
      frameworkTitle: domain.frameworkTitle,
      domainLabel: domain.label,
      tab: domain.tab,
    };
  }

  return null;
}

export default function AIInitiativeRecommender({ initiative }: { initiative: Initiative }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const shouldRender = initiative.status === "At Risk" || (initiative.eaAlignmentScore !== null && initiative.eaAlignmentScore < 50);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(`${DISMISS_KEY_PREFIX}${initiative.id}`) === "true");
  }, [initiative.id]);

  const recommendation = useMemo(
    () => findRecommendation(initiative, getInitiatives()),
    [initiative]
  );

  if (!shouldRender || dismissed || !recommendation) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${DISMISS_KEY_PREFIX}${initiative.id}`, "true");
    }
  };

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-blue-200">
              {recommendation.kind === "initiative" ? (
                <Sparkles className="h-4 w-4 text-blue-700" />
              ) : (
                <Lightbulb className="h-4 w-4 text-amber-600" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{recommendation.title}</h3>
              <p className="text-sm text-slate-600">{recommendation.rationale}</p>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {recommendation.kind === "initiative" ? (
        <div className="mt-4 rounded-xl border border-white bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${STATUS_BADGE_CLASSES[recommendation.initiative.status] ?? STATUS_BADGE_CLASSES.Active} border text-xs`}>
              {recommendation.initiative.status}
            </Badge>
            <Badge className="border border-slate-200 bg-slate-100 text-slate-700 text-xs">
              {recommendation.initiative.type}
            </Badge>
          </div>

          <div className="mt-3 space-y-2">
            <p className="text-base font-semibold text-slate-900">{recommendation.initiative.name}</p>
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <p>
                <span className="font-medium text-slate-800">Progress:</span> {recommendation.initiative.progress}%
              </p>
              <p>
                <span className="font-medium text-slate-800">Alignment:</span>{" "}
                {recommendation.initiative.eaAlignmentScore === null ? "Not assessed" : `${recommendation.initiative.eaAlignmentScore}%`}
              </p>
              <p>
                <span className="font-medium text-slate-800">Division:</span> {recommendation.initiative.division}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Button asChild className="bg-blue-700 text-white hover:bg-blue-800">
              <Link to={`/marketplaces/initiative-portfolio/initiative/${recommendation.initiative.id}`}>
                View related initiative
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-white bg-white p-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border border-amber-200 bg-amber-50 text-amber-700 text-xs">
                {recommendation.domainLabel}
              </Badge>
              <Badge className="border border-slate-200 bg-slate-100 text-slate-700 text-xs">
                Framework Recommendation
              </Badge>
            </div>
            <p className="text-base font-semibold text-slate-900">{recommendation.frameworkTitle}</p>
            <p className="text-sm text-slate-600">
              Pre-populated recommendation based on this initiative’s type and capability domain.
            </p>
          </div>

          <div className="mt-4">
            <Button
              className="bg-blue-700 text-white hover:bg-blue-800"
              onClick={() => navigate("/marketplaces/asset-capability", { state: { tab: recommendation.tab } })}
            >
              Review suggested action
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
