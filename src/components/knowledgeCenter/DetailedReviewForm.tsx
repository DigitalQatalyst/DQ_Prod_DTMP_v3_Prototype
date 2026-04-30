import { useState } from "react";
import { X, CheckCircle, AlertTriangle, FileX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitDetailedReview, type ReviewOutcome } from "@/data/knowledgeCenter/reviewState";
import { getSessionUser } from "@/data/sessionAuth";
import { toast } from "@/components/ui/sonner";

interface DetailedReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemTitle: string;
  lastReviewed: string;
  onReviewSubmitted: () => void;
}

export function DetailedReviewForm({
  isOpen,
  onClose,
  itemId,
  itemTitle,
  lastReviewed,
  onReviewSubmitted,
}: DetailedReviewFormProps) {
  const [outcome, setOutcome] = useState<ReviewOutcome>("minor-updates");
  const [notes, setNotes] = useState("");
  const [sectionsReviewed, setSectionsReviewed] = useState<string[]>([]);
  const [newSection, setNewSection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sessionUser = getSessionUser();

  if (!isOpen) return null;

  const handleAddSection = () => {
    const trimmed = newSection.trim();
    if (trimmed && !sectionsReviewed.includes(trimmed)) {
      setSectionsReviewed([...sectionsReviewed, trimmed]);
      setNewSection("");
    }
  };

  const handleRemoveSection = (section: string) => {
    setSectionsReviewed(sectionsReviewed.filter((s) => s !== section));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionUser || !notes.trim()) return;

    setIsSubmitting(true);
    
    try {
      submitDetailedReview(
        itemId,
        sessionUser.email,
        sessionUser.name,
        outcome,
        notes.trim(),
        sectionsReviewed.length > 0 ? sectionsReviewed : undefined
      );
      
      // Show success toast
      toast.success("Review submitted! Content owner will be notified.", {
        description: "This item has been marked for updates and will be prioritized.",
        duration: 5000,
      });
      
      onReviewSubmitted();
      onClose();
      
      // Reset form
      setOutcome("minor-updates");
      setNotes("");
      setSectionsReviewed([]);
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review", {
        description: "Please try again or contact support if the issue persists.",
      });
    } finally {
      setIsSubmitting(false);
    }
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

  const outcomeOptions: { value: ReviewOutcome; label: string; icon: React.ElementType; color: string }[] = [
    {
      value: "minor-updates",
      label: "Minor Updates Needed",
      icon: AlertTriangle,
      color: "text-yellow-600",
    },
    {
      value: "major-revision",
      label: "Major Revision Required",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      value: "deprecated",
      label: "Content Deprecated",
      icon: FileX,
      color: "text-red-600",
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl z-[60] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detailed Content Review</h2>
                <p className="text-sm text-gray-500 mt-1">Document required updates and changes</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Content Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {itemTitle}
              </h3>
              <p className="text-sm text-gray-600">
                Last reviewed: {formatDate(lastReviewed)}
              </p>
            </div>

            {/* Review Outcome */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Review Outcome <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {outcomeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        outcome === option.value
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="outcome"
                        value={option.value}
                        checked={outcome === option.value}
                        onChange={(e) => setOutcome(e.target.value as ReviewOutcome)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${option.color}`} />
                          <span className="font-medium text-gray-900">{option.label}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {option.value === "minor-updates" && "Small corrections, typos, or minor content updates needed"}
                          {option.value === "major-revision" && "Significant content changes, restructuring, or new information required"}
                          {option.value === "deprecated" && "Content is no longer relevant and should be archived"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Review Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Review Notes <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Describe what needs to be updated, why, and any specific recommendations
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: The implementation guide references outdated tools. Section 3 needs to be updated with current best practices. The case study examples are from 2022 and should be refreshed with recent examples."
                className="w-full min-h-32 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {notes.length} characters
              </p>
            </div>

            {/* Sections Reviewed */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Sections Reviewed (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                List specific sections, pages, or topics you reviewed
              </p>
              
              {/* Section Input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSection();
                    }
                  }}
                  placeholder="e.g., Implementation Guide, Section 3, Case Studies"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <Button
                  type="button"
                  onClick={handleAddSection}
                  variant="outline"
                  size="sm"
                >
                  Add
                </Button>
              </div>

              {/* Section List */}
              {sectionsReviewed.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sectionsReviewed.map((section) => (
                    <span
                      key={section}
                      className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      {section}
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(section)}
                        className="hover:text-blue-900"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">What happens next?</p>
                  <p className="text-blue-700">
                    Your review will be recorded and the content owner will be notified. 
                    The review date will be updated, and this item will be prioritized for updates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl flex justify-end gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !notes.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
