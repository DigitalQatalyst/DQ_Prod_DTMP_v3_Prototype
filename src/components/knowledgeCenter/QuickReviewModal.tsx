import { useState } from "react";
import { X, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitQuickReview } from "@/data/knowledgeCenter/reviewState";
import { getSessionUser } from "@/data/sessionAuth";
import { DetailedReviewForm } from "@/components/knowledgeCenter/DetailedReviewForm";
import { toast } from "@/components/ui/sonner";

interface QuickReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemTitle: string;
  lastReviewed: string;
  onReviewSubmitted: () => void;
}

export function QuickReviewModal({
  isOpen,
  onClose,
  itemId,
  itemTitle,
  lastReviewed,
  onReviewSubmitted,
}: QuickReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const sessionUser = getSessionUser();

  if (!isOpen) return null;

  const handleQuickReview = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!sessionUser) return;

    setIsSubmitting(true);
    
    try {
      submitQuickReview(itemId, sessionUser.email, sessionUser.name);
      
      toast.success("Review submitted! Content marked as current.", {
        description: "The staleness indicator has been removed.",
        duration: 4000,
      });
      
      onReviewSubmitted();
      onClose();
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review", {
        description: "Please try again or contact support if the issue persists.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNeedsReview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDetailedForm(true);
  };

  const handleDetailedFormClose = () => {
    setShowDetailedForm(false);
    onClose();
  };

  const handleDetailedReviewSubmitted = () => {
    setShowDetailedForm(false);
    onReviewSubmitted();
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    })} (${diffDays} days ago)`;
  };

  if (showDetailedForm) {
    return (
      <DetailedReviewForm
        isOpen={showDetailedForm}
        onClose={handleDetailedFormClose}
        itemId={itemId}
        itemTitle={itemTitle}
        lastReviewed={lastReviewed}
        onReviewSubmitted={handleDetailedReviewSubmitted}
      />
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      <div 
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-[60] p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Review Content</h2>
            <p className="text-sm text-gray-500 mt-1">Quick review options</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {itemTitle}
          </h3>
          <p className="text-sm text-gray-600">
            Last reviewed: {formatDate(lastReviewed)}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="border-2 border-green-200 rounded-lg p-4 hover:border-green-300 transition-colors relative">
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Content is Still Accurate
                </h4>
                <p className="text-sm text-gray-600">
                  Updates review date to today and removes staleness indicator
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickReview}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-10 shadow-sm"
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
            >
              {isSubmitting ? "Submitting..." : "Mark as Reviewed"}
            </button>
          </div>

          <div className="border-2 border-amber-200 rounded-lg p-4 hover:border-amber-300 transition-colors relative">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Content Needs Updates
                </h4>
                <p className="text-sm text-gray-600">
                  Opens detailed review form to document required changes
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNeedsReview}
              className="w-full border-2 border-amber-600 text-amber-900 hover:bg-amber-50 font-semibold py-3 px-4 rounded-md transition-colors bg-white relative z-10 shadow-sm"
              style={{ borderColor: '#d97706', color: '#78350f', backgroundColor: '#ffffff' }}
            >
              Open Review Form
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-gray-600"
          >
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}
