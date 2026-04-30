import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  addBlueprintTORequest,
  linkBlueprintTORequestToStage3,
} from "@/data/blueprints/requestState";
import { createStage3Request } from "@/data/stage3";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoginModal } from "@/components/learningCenter/LoginModal";
import { isUserAuthenticated } from "@/data/sessionAuth";

interface LocationState {
  specId?: string;
  serviceName?: string;
}

interface FormData {
  solutionName: string;
  businessNeed: string;
  requirements: string;
  timeline: string;
  // New fields for comprehensive spec requirements
  solutionType: string;
  scope: string;
  complexity: string;
  department: string;
  stakeholders: string;
  existingSystems: string;
  technologyPreferences: string[];
  complianceRequirements: string;
  budgetRange: string;
  successCriteria: string;
  additionalContext: string;
}


const TIMELINE_OPTIONS = [
  "Less than 1 month",
  "1 – 3 months",
  "3 – 6 months",
  "6 – 12 months",
  "More than 12 months",
];

const SOLUTION_TYPES = [
  { value: "DBP", label: "Digital Business Platform" },
  { value: "DXP", label: "Digital Experience Platform" },
  { value: "DWS", label: "Digital Workplace Solutions" },
  { value: "DIA", label: "Digital Intelligence & Analytics" },
  { value: "SDO", label: "Software Defined Operations" },
];

const SCOPE_OPTIONS = [
  { value: "enterprise", label: "Enterprise-wide" },
  { value: "departmental", label: "Departmental" },
  { value: "project", label: "Project-specific" },
];

const COMPLEXITY_OPTIONS = [
  { value: "simple", label: "Simple (≤ 10 components)" },
  { value: "moderate", label: "Moderate (11–20 components)" },
  { value: "complex", label: "Complex (21–35 components)" },
  { value: "expert", label: "Expert (36+ components)" },
];

const TECHNOLOGY_OPTIONS = [
  "Cloud-Native",
  "Multi-Cloud",
  "Hybrid",
  "Kubernetes",
  "Microservices",
  "API Gateway",
  "Kafka / Event Streaming",
  "Data Lake",
  "AI / ML (MLOps)",
  "Microsoft 365",
  "SAP",
  "Salesforce",
  "Oracle",
  "Azure",
  "AWS",
  "Google Cloud",
];

const BUDGET_RANGES = [
  "Under AED 100K",
  "AED 100K - 500K",
  "AED 500K - 1M",
  "AED 1M - 5M",
  "AED 5M - 10M",
  "Over AED 10M",
  "Budget not yet defined",
];

export default function SolutionSpecRequestForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};

  const [showLoginModal, setShowLoginModal] = useState(!isUserAuthenticated());
  const [open, setOpen] = useState(isUserAuthenticated());
  const [formData, setFormData] = useState<FormData>({
    solutionName: state.serviceName || "",
    businessNeed: "",
    requirements: "",
    timeline: "",
    solutionType: "",
    scope: "",
    complexity: "",
    department: "",
    stakeholders: "",
    existingSystems: "",
    technologyPreferences: [],
    complianceRequirements: "",
    budgetRange: "",
    successCriteria: "",
    additionalContext: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setOpen(false);
    navigate("/marketplaces/solution-specs");
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!formData.solutionName.trim())  errors.solutionName = "Required";
    if (!formData.businessNeed.trim())  errors.businessNeed = "Required";
    if (!formData.requirements.trim())  errors.requirements = "Required";
    if (!formData.timeline)             errors.timeline     = "Required";
    if (!formData.solutionType)         errors.solutionType = "Required";
    if (!formData.scope)                errors.scope        = "Required";
    if (!formData.department.trim())    errors.department   = "Required";
    if (!formData.stakeholders.trim())  errors.stakeholders = "Required";
    if (!formData.successCriteria.trim()) errors.successCriteria = "Required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const blueprintRequest = addBlueprintTORequest({
      itemId: state.specId ?? `custom-${Date.now()}`,
      itemTitle: formData.solutionName,
      marketplace: "solution-specs",
      requesterName: "Amina TO",
      requesterRole: "Portfolio Manager",
      message: JSON.stringify({
        timeline: formData.timeline,
        businessNeed: formData.businessNeed,
        requirements: formData.requirements,
        solutionType: formData.solutionType,
        scope: formData.scope,
        complexity: formData.complexity,
        department: formData.department,
        stakeholders: formData.stakeholders,
        existingSystems: formData.existingSystems,
        technologyPreferences: formData.technologyPreferences,
        complianceRequirements: formData.complianceRequirements,
        budgetRange: formData.budgetRange,
        successCriteria: formData.successCriteria,
        additionalContext: formData.additionalContext,
      }),
    });

    if (blueprintRequest) {
      const stage3Request = createStage3Request({
        type: "solution-specs",
        title: `Solution Spec Build: ${formData.solutionName}`,
        description: formData.businessNeed,
        requester: {
          name: "Amina TO",
          email: "amina.to@dtmp.local",
          department: "Transformation Office",
          organization: "DTMP",
        },
        priority: "medium",
        estimatedHours: 16,
        tags: ["solution-specs", "custom-request", formData.solutionType],
        relatedAssets: [`solution-spec-request:${blueprintRequest.id}`],
        notes: [
          `Solution Type: ${formData.solutionType}`,
          `Scope: ${formData.scope}`,
          `Complexity: ${formData.complexity}`,
          `Department: ${formData.department}`,
          `Timeline: ${formData.timeline}`,
          `Budget Range: ${formData.budgetRange}`,
          `Technology Preferences: ${formData.technologyPreferences.join(", ")}`,
          `Business Need: ${formData.businessNeed}`,
          `Requirements: ${formData.requirements}`,
          `Success Criteria: ${formData.successCriteria}`,
        ],
      });
      linkBlueprintTORequestToStage3(blueprintRequest.id, stage3Request.id);
    }

    setOpen(false);
    navigate("/stage2/specs/overview", {
      state: {
        fromRequest: true,
        specId: state.specId,
        serviceName: formData.solutionName,
        requestType: "custom-request",
      },
    });
  };

  return (
    <>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          navigate("/marketplaces/solution-specs");
        }}
        context={{
          marketplace: "solution-specs",
          tab: "specs",
          cardId: state.specId ?? "",
          serviceName: state.serviceName ?? "Solution Spec",
          action: "Make Request",
        }}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          setOpen(true);
        }}
      />

      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              New Solution Spec Request
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Provide comprehensive details to help our team understand your solution specification requirements
            </p>
          </DialogHeader>

          <div className="space-y-6 mt-4">

            {/* Two-column layout for basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Solution Name */}
              <div>
                <Label htmlFor="rf-solutionName" className="text-sm font-semibold text-gray-900 mb-2 block">
                  Solution Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rf-solutionName"
                  value={formData.solutionName}
                  onChange={(e) => {
                    setFormData({ ...formData, solutionName: e.target.value });
                    setFormErrors({ ...formErrors, solutionName: "" });
                  }}
                  placeholder="Enter a name for this solution"
                  className="w-full"
                />
                {formErrors.solutionName && <p className="text-xs text-red-600 mt-1">{formErrors.solutionName}</p>}
              </div>

              {/* Department */}
              <div>
                <Label htmlFor="rf-department" className="text-sm font-semibold text-gray-900 mb-2 block">
                  Department/Division <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rf-department"
                  value={formData.department}
                  onChange={(e) => {
                    setFormData({ ...formData, department: e.target.value });
                    setFormErrors({ ...formErrors, department: "" });
                  }}
                  placeholder="e.g. Customer Services, Operations, IT"
                  className="w-full"
                />
                {formErrors.department && <p className="text-xs text-red-600 mt-1">{formErrors.department}</p>}
              </div>
            </div>

            {/* Solution Type and Scope */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Solution Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.solutionType}
                  onValueChange={(value) => {
                    setFormData({ ...formData, solutionType: value });
                    setFormErrors({ ...formErrors, solutionType: "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select solution type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOLUTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.solutionType && <p className="text-xs text-red-600 mt-1">{formErrors.solutionType}</p>}
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Scope <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.scope}
                  onValueChange={(value) => {
                    setFormData({ ...formData, scope: value });
                    setFormErrors({ ...formErrors, scope: "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPE_OPTIONS.map((scope) => (
                      <SelectItem key={scope.value} value={scope.value}>
                        {scope.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.scope && <p className="text-xs text-red-600 mt-1">{formErrors.scope}</p>}
              </div>
            </div>

            {/* Business Need */}
            <div>
              <Label htmlFor="rf-businessNeed" className="text-sm font-semibold text-gray-900 mb-1 block">
                Business Need <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500 mb-2">Describe the business problem or opportunity this solution should address.</p>
              <Textarea
                id="rf-businessNeed"
                value={formData.businessNeed}
                onChange={(e) => {
                  setFormData({ ...formData, businessNeed: e.target.value });
                  setFormErrors({ ...formErrors, businessNeed: "" });
                }}
                placeholder="e.g. We need to unify our customer data across 5 regional systems to enable real-time personalisation..."
                rows={4}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{formData.businessNeed.length} characters</p>
              {formErrors.businessNeed && <p className="text-xs text-red-600">{formErrors.businessNeed}</p>}
            </div>

            {/* Requirements */}
            <div>
              <Label htmlFor="rf-requirements" className="text-sm font-semibold text-gray-900 mb-1 block">
                Functional & Technical Requirements <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500 mb-2">List the key functional and non-functional requirements for this solution.</p>
              <Textarea
                id="rf-requirements"
                value={formData.requirements}
                onChange={(e) => {
                  setFormData({ ...formData, requirements: e.target.value });
                  setFormErrors({ ...formErrors, requirements: "" });
                }}
                placeholder={`e.g.\n• Must integrate with SAP and Salesforce\n• Real-time data synchronisation\n• Role-based access control\n• 99.9% uptime requirement\n• Support for 10,000+ concurrent users`}
                rows={5}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{formData.requirements.length} characters</p>
              {formErrors.requirements && <p className="text-xs text-red-600">{formErrors.requirements}</p>}
            </div>

            {/* Success Criteria */}
            <div>
              <Label htmlFor="rf-successCriteria" className="text-sm font-semibold text-gray-900 mb-1 block">
                Success Criteria <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500 mb-2">Define how success will be measured for this solution.</p>
              <Textarea
                id="rf-successCriteria"
                value={formData.successCriteria}
                onChange={(e) => {
                  setFormData({ ...formData, successCriteria: e.target.value });
                  setFormErrors({ ...formErrors, successCriteria: "" });
                }}
                placeholder={`e.g.\n• Reduce customer onboarding time by 50%\n• Achieve 95% user adoption within 6 months\n• Decrease operational costs by AED 2M annually\n• Improve customer satisfaction score to 4.5/5`}
                rows={4}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{formData.successCriteria.length} characters</p>
              {formErrors.successCriteria && <p className="text-xs text-red-600">{formErrors.successCriteria}</p>}
            </div>

            {/* Stakeholders */}
            <div>
              <Label htmlFor="rf-stakeholders" className="text-sm font-semibold text-gray-900 mb-1 block">
                Key Stakeholders <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500 mb-2">List the key stakeholders, decision makers, and end users for this solution.</p>
              <Textarea
                id="rf-stakeholders"
                value={formData.stakeholders}
                onChange={(e) => {
                  setFormData({ ...formData, stakeholders: e.target.value });
                  setFormErrors({ ...formErrors, stakeholders: "" });
                }}
                placeholder={`e.g.\n• Project Sponsor: John Smith (VP Customer Services)\n• Business Owner: Sarah Ahmed (Director Operations)\n• End Users: Customer service representatives (200+ users)\n• IT Contact: Ahmed Hassan (Solution Architect)`}
                rows={4}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{formData.stakeholders.length} characters</p>
              {formErrors.stakeholders && <p className="text-xs text-red-600">{formErrors.stakeholders}</p>}
            </div>

            {/* Existing Systems */}
            <div>
              <Label htmlFor="rf-existingSystems" className="text-sm font-semibold text-gray-900 mb-1 block">
                Existing Systems & Integrations
              </Label>
              <p className="text-xs text-gray-500 mb-2">List current systems that need to integrate with or be replaced by this solution.</p>
              <Textarea
                id="rf-existingSystems"
                value={formData.existingSystems}
                onChange={(e) => {
                  setFormData({ ...formData, existingSystems: e.target.value });
                }}
                placeholder={`e.g.\n• SAP ERP (Finance & HR data)\n• Salesforce CRM (Customer data)\n• Legacy billing system (Oracle DB)\n• Microsoft 365 (Authentication)\n• Custom reporting tools`}
                rows={4}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{formData.existingSystems.length} characters</p>
            </div>

            {/* Technology Preferences */}
            <div>
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Technology Preferences
              </Label>
              <p className="text-xs text-gray-500 mb-3">Select preferred technologies or platforms (optional).</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TECHNOLOGY_OPTIONS.map((tech) => (
                  <div key={tech} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tech-${tech}`}
                      checked={formData.technologyPreferences.includes(tech)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            technologyPreferences: [...formData.technologyPreferences, tech]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            technologyPreferences: formData.technologyPreferences.filter(t => t !== tech)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`tech-${tech}`} className="text-sm text-gray-700 cursor-pointer">
                      {tech}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Complexity and Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Expected Complexity
                </Label>
                <Select
                  value={formData.complexity}
                  onValueChange={(value) => setFormData({ ...formData, complexity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select complexity level" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLEXITY_OPTIONS.map((complexity) => (
                      <SelectItem key={complexity.value} value={complexity.value}>
                        {complexity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Budget Range
                </Label>
                <Select
                  value={formData.budgetRange}
                  onValueChange={(value) => setFormData({ ...formData, budgetRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_RANGES.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Compliance Requirements */}
            <div>
              <Label htmlFor="rf-compliance" className="text-sm font-semibold text-gray-900 mb-1 block">
                Compliance & Security Requirements
              </Label>
              <p className="text-xs text-gray-500 mb-2">Specify any regulatory, security, or compliance requirements.</p>
              <Textarea
                id="rf-compliance"
                value={formData.complianceRequirements}
                onChange={(e) => setFormData({ ...formData, complianceRequirements: e.target.value })}
                placeholder={`e.g.\n• GDPR compliance for customer data\n• UAE Data Protection Law\n• ISO 27001 security standards\n• PCI DSS for payment processing\n• Internal audit requirements`}
                rows={3}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{formData.complianceRequirements.length} characters</p>
            </div>

            {/* Timeline */}
            <div>
              <Label className="text-sm font-semibold text-gray-900 mb-3 block">
                Expected Timeline <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TIMELINE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, timeline: option });
                      setFormErrors({ ...formErrors, timeline: "" });
                    }}
                    className={`text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.timeline === option
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-gray-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {formErrors.timeline && <p className="text-xs text-red-600 mt-1">{formErrors.timeline}</p>}
            </div>

            {/* Additional Context */}
            <div>
              <Label htmlFor="rf-additionalContext" className="text-sm font-semibold text-gray-900 mb-1 block">
                Additional Context
              </Label>
              <p className="text-xs text-gray-500 mb-2">Any additional information that would help us understand your requirements.</p>
              <Textarea
                id="rf-additionalContext"
                value={formData.additionalContext}
                onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
                placeholder="e.g. Previous attempts, lessons learned, specific constraints, preferred vendors, etc."
                rows={3}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{formData.additionalContext.length} characters</p>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3"
            >
              <Check className="w-4 h-4 mr-2" />
              Submit Request
            </Button>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
