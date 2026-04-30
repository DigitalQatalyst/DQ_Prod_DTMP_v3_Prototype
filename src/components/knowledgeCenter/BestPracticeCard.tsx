import { Tag, TrendingUp, AlertCircle, ThumbsUp, FileCheck } from "lucide-react";
import { BestPractice } from "@/data/knowledgeCenter/bestPractices";
import { cn } from "@/lib/utils";
import { getKnowledgeItem, isKnowledgeItemStale } from "@/data/knowledgeCenter/knowledgeItems";
import { endorseKnowledgeItem, unendorseKnowledgeItem, hasUserEndorsed, getEndorsementCount } from "@/data/knowledgeCenter/endorsementState";
import { getSessionUser } from "@/data/sessionAuth";
import { canUserReview, getLatestReview } from "@/data/knowledgeCenter/reviewState";
import { QuickReviewModal } from "@/components/knowledgeCenter/QuickReviewModal";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface BestPracticeCardProps {
  practice: BestPractice;
  onClick: () => void;
}

const complexityColors = {
  Low: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-red-100 text-red-700",
};

export function BestPracticeCard({ practice, onClick }: BestPracticeCardProps) {
  const Icon = practice.icon;
  const navigate = useNavigate();
  const knowledgeItem = getKnowledgeItem("best-practices", practice.id);
  const sessionUser = getSessionUser();
  const userId = sessionUser?.email || "anonymous";
  const itemId = `best-practices:${practice.id}`;
  
  const [isStale, setIsStale] = useState(knowledgeItem ? isKnowledgeItemStale(knowledgeItem) : false);
  const [hasEndorsed, setHasEndorsed] = useState(hasUserEndorsed(itemId, userId));
  const [endorsementCount, setEndorsementCount] = useState(
    (knowledgeItem?.endorsements || 0) + getEndorsementCount(itemId)
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTrigger, setReviewTrigger] = useState(0);
  
  const userCanReview = canUserReview(sessionUser?.role, sessionUser?.email);
  const [latestReviewDate, setLatestReviewDate] = useState(
    getLatestReview(itemId)?.reviewedAt || knowledgeItem?.lastReviewed
  );
  const latestReview = getLatestReview(itemId);
  
  const hasPendingUpdates = latestReview && 
    (latestReview.outcome === "minor-updates" || 
     latestReview.outcome === "major-revision" || 
     latestReview.outcome === "deprecated");
  
  useEffect(() => {
    if (knowledgeItem) {
      const staleStatus = isKnowledgeItemStale(knowledgeItem);
      setIsStale(staleStatus);
    }
  }, [reviewTrigger, knowledgeItem]);
  
  const handleEndorse = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (hasEndorsed) {
      unendorseKnowledgeItem(itemId, userId);
      setHasEndorsed(false);
      setEndorsementCount(prev => prev - 1);
    } else {
      endorseKnowledgeItem(itemId, userId);
      setHasEndorsed(true);
      setEndorsementCount(prev => prev + 1);
    }
  };
  
  const handleQuickReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowReviewModal(true);
  };
  
  const handleReviewSubmitted = () => {
    const newReview = getLatestReview(itemId);
    if (newReview) {
      setLatestReviewDate(newReview.reviewedAt);
    }
    setReviewTrigger(prev => prev + 1);
  };
  
  const handleCardClick = () => {
    if (showReviewModal) return;
    onClick();
  };
  
  return (
    <div
      onClick={handleCardClick}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-16 h-16 rounded-lg bg-green-50 flex items-center justify-center">
          <Icon className="w-8 h-8 text-green-600" />
        </div>
        <div className="flex flex-col gap-2 items-end">
          {practice.featured && (
            <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Featured
            </span>
          )}
          {hasPendingUpdates ? (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Update Pending
              </span>
            </div>
          ) : isStale && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Review recommended
              </span>
              {userCanReview && (
                <button
                  onClick={handleQuickReview}
                  className="w-6 h-6 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center transition-colors shadow-sm"
                  title="Quick Review"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
          {practice.domain}
        </span>
        <span className={cn("px-2 py-1 rounded text-xs font-medium", complexityColors[practice.complexity])}>
          {practice.complexity}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {practice.title}
      </h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {practice.summary}
      </p>

      <div className="flex items-center gap-3 text-xs text-gray-600 mb-4">
        <span className="flex items-center gap-1">
          <Tag className="w-3 h-3" />
          {practice.category}
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {practice.maturityLevel}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {practice.impactAreas.slice(0, 3).map((area) => (
          <span
            key={area}
            className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs"
          >
            {area}
          </span>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={handleEndorse}
          className={`flex items-center gap-1 text-xs transition-colors ${
            hasEndorsed
              ? "text-orange-600 font-medium"
              : "text-gray-500 hover:text-orange-600"
          }`}
        >
          <ThumbsUp className={cn("w-3.5 h-3.5", hasEndorsed && "fill-orange-600")} />
          {endorsementCount} endorsed
        </button>
      </div>
      
      {knowledgeItem && (
        <QuickReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          itemId={itemId}
          itemTitle={practice.title}
          lastReviewed={latestReviewDate || knowledgeItem.lastReviewed || ""}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
