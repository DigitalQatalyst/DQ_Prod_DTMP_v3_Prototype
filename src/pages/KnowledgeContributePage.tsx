import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStage3Request } from "@/data/stage3";
import { getSessionUser } from "@/data/sessionAuth";

const contentTypes = [
  "Best Practice",
  "Playbook Entry",
  "Testimonial",
  "Reference Document",
];

const categories = [
  "Cloud & Infrastructure",
  "Data & Analytics",
  "Security & Compliance",
  "Process Optimization",
  "Change Management",
  "Digital Strategy",
  "Technology Architecture",
  "Governance",
];

export default function KnowledgeContributePage() {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();

  const [formData, setFormData] = useState({
    contentType: "Best Practice",
    title: "",
    category: "",
    summary: "",
    fullContent: "",
    tags: "",
    source: "",
    relevance: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.summary.trim()) {
      newErrors.summary = "Summary is required";
    } else if (formData.summary.length > 300) {
      newErrors.summary = "Summary must be 300 characters or less";
    }
    if (!formData.fullContent.trim()) {
      newErrors.fullContent = "Full content is required";
    }
    if (!formData.relevance.trim()) {
      newErrors.relevance = "Relevance explanation is required";
    } else if (formData.relevance.length > 200) {
      newErrors.relevance = "Relevance must be 200 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const user = sessionUser || {
        email: "anonymous@dtmp.com",
        name: "Anonymous User",
      };

      createStage3Request({
        type: "knowledge-center",
        title: `Knowledge Contribution: ${formData.title}`,
        description: `New ${formData.contentType} submission for Knowledge Centre.\n\nTitle: ${formData.title}\nCategory: ${formData.category}\nSummary: ${formData.summary}\n\nRelevance: ${formData.relevance}`,
        requester: {
          name: user.name,
          email: user.email,
          department: "Knowledge Management",
          organization: "DTMP",
        },
        priority: "medium",
        estimatedHours: 2,
        tags: [
          "knowledge-center",
          "contribution",
          formData.contentType.toLowerCase().replace(/\s+/g, "-"),
          formData.category.toLowerCase().replace(/\s+/g, "-"),
          ...formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        ],
        notes: [
          `Content Type: ${formData.contentType}`,
          `Category: ${formData.category}`,
          `Source: ${formData.source || "Not specified"}`,
          `Tags: ${formData.tags || "None"}`,
          `Full Content:\n${formData.fullContent}`,
        ],
      });

      // Navigate to Stage 2 TO Requests tab
      navigate("/stage2/knowledge/requests", {
        state: {
          marketplace: "knowledge-center",
          message: "Your contribution has been submitted for review!",
        },
      });
    } catch (error) {
      console.error("Failed to submit contribution:", error);
      setErrors({ submit: "Failed to submit. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/marketplaces/knowledge-center")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Knowledge Centre
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-navy mb-2">
            Contribute Knowledge
          </h1>
          <p className="text-muted-foreground">
            Share your expertise with the transformation community. Your
            contribution will be reviewed by the TO Office before publication.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="contentType">Content Type *</Label>
            <select
              id="contentType"
              value={formData.contentType}
              onChange={(e) => handleChange("contentType", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {contentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter a clear, descriptive title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.category ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">
              Summary * (max 300 characters)
            </Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
              placeholder="Provide a brief summary of your contribution"
              rows={3}
              maxLength={300}
              className={errors.summary ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.summary.length}/300
            </p>
            {errors.summary && (
              <p className="text-sm text-red-600">{errors.summary}</p>
            )}
          </div>

          {/* Full Content */}
          <div className="space-y-2">
            <Label htmlFor="fullContent">Full Content *</Label>
            <Textarea
              id="fullContent"
              value={formData.fullContent}
              onChange={(e) => handleChange("fullContent", e.target.value)}
              placeholder="Provide the complete content. You can use markdown formatting."
              rows={12}
              className={errors.fullContent ? "border-red-500" : ""}
            />
            {errors.fullContent && (
              <p className="text-sm text-red-600">{errors.fullContent}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="e.g., cloud, migration, best-practice"
            />
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source / Organisation (optional)</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => handleChange("source", e.target.value)}
              placeholder="Where did this knowledge originate?"
            />
          </div>

          {/* Relevance */}
          <div className="space-y-2">
            <Label htmlFor="relevance">
              Why is this relevant to DT programmes? * (max 200 characters)
            </Label>
            <Textarea
              id="relevance"
              value={formData.relevance}
              onChange={(e) => handleChange("relevance", e.target.value)}
              placeholder="Explain how this contributes to digital transformation success"
              rows={3}
              maxLength={200}
              className={errors.relevance ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.relevance.length}/200
            </p>
            {errors.relevance && (
              <p className="text-sm text-red-600">{errors.relevance}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/marketplaces/knowledge-center")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
