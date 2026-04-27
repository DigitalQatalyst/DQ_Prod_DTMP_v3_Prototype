/**
 * Knowledge Center Content Review State Management
 * Handles review tracking, history, and status updates
 */

export type ReviewOutcome = "accurate" | "minor-updates" | "major-revision" | "deprecated";

export interface KnowledgeItemReview {
  id: string;
  itemId: string; // Format: "best-practices:bp-001"
  reviewedBy: string;
  reviewedByName: string;
  reviewedAt: string;
  outcome: ReviewOutcome;
  notes: string;
  sectionsReviewed?: string[];
  stage3RequestId?: string;
}

const STORAGE_KEY = "dtmp.knowledgeCenter.reviews";

/**
 * Get all reviews from localStorage
 */
const getReviews = (): KnowledgeItemReview[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Save reviews to localStorage
 */
const saveReviews = (reviews: KnowledgeItemReview[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch (error) {
    console.error("Failed to save reviews:", error);
  }
};

/**
 * Submit a quick review (content still accurate)
 */
export const submitQuickReview = (
  itemId: string,
  reviewedBy: string,
  reviewedByName: string
): KnowledgeItemReview => {
  const reviews = getReviews();
  
  const newReview: KnowledgeItemReview = {
    id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    itemId,
    reviewedBy,
    reviewedByName,
    reviewedAt: new Date().toISOString(),
    outcome: "accurate",
    notes: "Quick review: Content verified as still accurate",
  };
  
  reviews.push(newReview);
  saveReviews(reviews);
  
  return newReview;
};

/**
 * Submit a detailed review
 */
export const submitDetailedReview = (
  itemId: string,
  reviewedBy: string,
  reviewedByName: string,
  outcome: ReviewOutcome,
  notes: string,
  sectionsReviewed?: string[],
  stage3RequestId?: string
): KnowledgeItemReview => {
  const reviews = getReviews();
  
  const newReview: KnowledgeItemReview = {
    id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    itemId,
    reviewedBy,
    reviewedByName,
    reviewedAt: new Date().toISOString(),
    outcome,
    notes,
    sectionsReviewed,
    stage3RequestId,
  };
  
  reviews.push(newReview);
  saveReviews(reviews);
  
  return newReview;
};

/**
 * Get review history for a specific item
 */
export const getReviewHistory = (itemId: string): KnowledgeItemReview[] => {
  const reviews = getReviews();
  return reviews
    .filter((review) => review.itemId === itemId)
    .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
};

/**
 * Get the most recent review for an item
 */
export const getLatestReview = (itemId: string): KnowledgeItemReview | null => {
  const history = getReviewHistory(itemId);
  return history.length > 0 ? history[0] : null;
};

/**
 * Get all reviews by a specific user
 */
export const getReviewsByUser = (userId: string): KnowledgeItemReview[] => {
  const reviews = getReviews();
  return reviews
    .filter((review) => review.reviewedBy === userId)
    .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
};

/**
 * Check if user can review content (Admins and TO team members)
 */
export const canUserReview = (userRole?: string, userEmail?: string): boolean => {
  if (!userRole) return false;
  
  // Check role first
  if (userRole === "Admin" || userRole.includes("TO") || userRole.includes("Transformation Office")) {
    return true;
  }
  
  // Also check email prefix for admin users
  if (userEmail) {
    const emailLower = userEmail.toLowerCase().trim();
    if (emailLower.startsWith("admin") || emailLower.startsWith("instructor")) {
      return true;
    }
  }
  
  return false;
};

/**
 * Get review statistics for an item
 */
export const getReviewStats = (itemId: string) => {
  const history = getReviewHistory(itemId);
  
  return {
    totalReviews: history.length,
    lastReviewedAt: history[0]?.reviewedAt || null,
    lastReviewedBy: history[0]?.reviewedByName || null,
    outcomeBreakdown: {
      accurate: history.filter((r) => r.outcome === "accurate").length,
      minorUpdates: history.filter((r) => r.outcome === "minor-updates").length,
      majorRevision: history.filter((r) => r.outcome === "major-revision").length,
      deprecated: history.filter((r) => r.outcome === "deprecated").length,
    },
  };
};
