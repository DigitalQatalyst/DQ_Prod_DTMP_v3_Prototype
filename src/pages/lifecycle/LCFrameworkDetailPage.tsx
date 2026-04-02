import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { initiativeFrameworks } from "@/data/lifecycle/frameworkCards";
import { lifecycleTemplates } from "@/data/lifecycle/lifecycleData";
import { addApprovalRequest } from "@/data/lifecycle/serviceRequestState";
import { DEWA_ROLE_OPTIONS } from "@/data/shared/dewaRoles";
import { getDemoAccount, getLifecycleRole } from "@/data/shared/lifecycleRole";

const PRIORITY_OPTIONS = ["Critical", "High", "Medium", "Low"] as const;

const DIVISION_OPTIONS = [
  "Generation",
  "Transmission",
  "Distribution",
  "Water",
  "Customer Services",
  "Corporate & Strategy",
  "Business Support & HR",
  "Innovation & AI",
  "DEWA Group Subsidiaries",
  "All Divisions",
] as const;

type Division = (typeof DIVISION_OPTIONS)[number];

export default function LCFrameworkDetailPage() {
  const { frameworkId } = useParams<{ frameworkId: string }>();
  const navigate = useNavigate();
  const framework = initiativeFrameworks.find((item) => item.id === frameworkId);

  const compatibleTemplates = useMemo(
    () => (framework ? lifecycleTemplates.filter((template) => framework.compatibleTemplates.includes(template.id)) : []),
    [framework]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(compatibleTemplates[0]?.id ?? null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [stakeholderRoles, setStakeholderRoles] = useState<string[]>([]);
  const [initiativeName, setInitiativeName] = useState("");
  const [initiativeDivision, setInitiativeDivision] = useState<Division>("Transmission");
  const [objective, setObjective] = useState("");
  const [scope, setScope] = useState("");
  const [keyStakeholders, setKeyStakeholders] = useState("");
  const [proposedOwner, setProposedOwner] = useState("");
  const [targetStartDate, setTargetStartDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITY_OPTIONS)[number]>("Medium");
  const [additionalContext, setAdditionalContext] = useState("");

  if (!framework) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Lifecycle Framework</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Framework not found</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              The requested framework detail page could not be loaded.
            </p>
            <Button asChild className="mt-6 bg-orange-600 text-white hover:bg-orange-700">
              <Link to="/marketplaces/lifecycle-management">Back to Lifecycle Management</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedTemplate =
    compatibleTemplates.find((template) => template.id === selectedTemplateId) ?? compatibleTemplates[0] ?? null;

  const submitInitiativeRequest = () => {
    const trimmed = (value: string) => value.trim();
    if (!trimmed(initiativeName)) {
      toast({ title: "Missing fields", description: "Please enter an initiative name." });
      return;
    }
    if (!trimmed(objective)) {
      toast({ title: "Missing fields", description: "Please provide an objective." });
      return;
    }
    if (!trimmed(scope)) {
      toast({ title: "Missing fields", description: "Please provide a scope." });
      return;
    }
    if (!trimmed(keyStakeholders)) {
      toast({ title: "Missing fields", description: "Please add key stakeholders." });
      return;
    }
    if (!trimmed(proposedOwner)) {
      toast({ title: "Missing fields", description: "Please add a proposed initiative owner." });
      return;
    }

    const role = getLifecycleRole() ?? "initiative-owner";
    const account = getDemoAccount(role);

    addApprovalRequest({
      frameworkType: framework.type,
      initiativeName: trimmed(initiativeName),
      division: initiativeDivision,
      isExternal: framework.category === "External",
      objective: trimmed(objective),
      scope: trimmed(scope),
      keyStakeholders: trimmed([keyStakeholders, stakeholderRoles.join(", ")].filter(Boolean).join(" | ")),
      proposedOwner: trimmed(proposedOwner),
      targetStartDate,
      estimatedBudget: trimmed(estimatedBudget) || undefined,
      priority,
      additionalContext: trimmed(
        [selectedTemplate?.id ? `Selected template: ${selectedTemplate.id}` : "", additionalContext]
          .filter(Boolean)
          .join("\n")
      ) || undefined,
      submittedBy: account.name,
    });

    setRequestModalOpen(false);
    toast({
      title: "Submitted for TO approval",
      description: "Your initiative request was added to the approval queue.",
    });
    navigate("/stage2/lifecycle-management", { state: { cardId: "initiative-requests" } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <Button asChild variant="ghost" className="px-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground">
              <Link to="/marketplaces/lifecycle-management">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lifecycle Management
              </Link>
            </Button>

            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={framework.category === "Internal" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-blue-200 bg-blue-50 text-blue-700"}>
                      {framework.category}
                    </Badge>
                    <Badge variant="outline">{framework.typicalDuration}</Badge>
                    <Badge variant="outline">{framework.typicalScope}</Badge>
                  </div>
                  <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">{framework.type}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{framework.description}</p>
                </div>

                <div className="min-w-[240px] rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Compatible Templates</p>
                  <p className="mt-1 text-2xl font-semibold text-orange-950">{compatibleTemplates.length}</p>
                  <p className="mt-2 text-sm text-orange-900">
                    Select a governing template, then submit a formal initiative request.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Delivery & Governance</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">What TO Provides</p>
                    <ul className="mt-3 space-y-2">
                      {framework.whatTOProvides.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-teal-950">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">What Division Provides</p>
                    <ul className="mt-3 space-y-2">
                      {framework.whatDivisionProvides.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-blue-950">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Key Phases</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {framework.keyPhases.map((phase) => (
                    <Badge key={phase} variant="outline" className="bg-gray-50 text-sm">
                      {phase}
                    </Badge>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Expected Outcomes</h2>
                <ul className="mt-4 space-y-3">
                  {framework.expectedOutcomes.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Templates</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pick the lifecycle template that should govern this initiative request.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {compatibleTemplates.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {compatibleTemplates.map((template) => {
                    const isSelected = template.id === selectedTemplateId;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(template.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                          isSelected
                            ? "border-orange-200 bg-orange-50"
                            : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{template.title}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {template.category} • {template.methodology} • {template.totalDuration}
                            </p>
                          </div>
                          {isSelected ? <Badge className="bg-orange-600 text-white">Selected</Badge> : null}
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{template.description}</p>
                      </button>
                    );
                  })}
                </div>

                {selectedTemplate ? (
                  <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stage Preview</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedTemplate.stages.slice(0, 4).map((stage) => (
                        <Badge key={stage.id} variant="outline" className="bg-white">
                          {stage.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <Button
                  onClick={() => setRequestModalOpen(true)}
                  disabled={!selectedTemplateId}
                  className="mt-5 w-full bg-orange-600 text-white hover:bg-orange-700"
                >
                  Begin Initiative Request
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </section>
            </aside>
          </div>
        </div>
      </main>

      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl">
          <div className="border-b border-gray-100 px-6 pb-4 pt-6">
            <DialogHeader>
              <DialogTitle>Submit Governed Initiative Request</DialogTitle>
              <DialogDescription>
                Confirm the framework, template, and operating intent before sending this request to the TO approval queue.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge className={framework.category === "Internal" ? "border-teal-200 bg-teal-50 text-teal-800" : "border-blue-200 bg-blue-50 text-blue-800"}>
                    {framework.category}
                  </Badge>
                  <Badge variant="outline" className="border-slate-200 text-slate-700">
                    Typical: {framework.typicalDuration} • {framework.typicalScope}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{framework.description}</p>
              </div>

              {selectedTemplate ? (
                <>
                  <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Selected Template</p>
                    <p className="mt-1 text-sm font-medium text-orange-950">{selectedTemplate.title}</p>
                    <p className="mt-1 text-xs text-orange-800">
                      This template will govern the stage-gate path and evidence requirements for the request.
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stage Preview</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedTemplate.stages.slice(0, 4).map((stage) => (
                        <Badge key={stage.id} variant="outline" className="bg-gray-50">
                          {stage.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-600">Key phases</p>
                <div className="flex flex-wrap gap-2">
                  {framework.keyPhases.map((phase) => (
                    <Badge key={phase} variant="outline" className="border-slate-200 bg-white text-slate-700">
                      {phase}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Initiative Name</label>
                  <Input value={initiativeName} onChange={(e) => setInitiativeName(e.target.value)} placeholder="e.g. Transmission Architecture Remediation Q2 2026" />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-sm font-medium text-foreground">Division</label>
                  <Select value={initiativeDivision} onValueChange={(value) => setInitiativeDivision(value as Division)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIVISION_OPTIONS.map((division) => (
                        <SelectItem key={division} value={division}>
                          {division}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-1">
                  <label className="text-sm font-medium text-foreground">Target Start Date</label>
                  <Input type="date" value={targetStartDate} onChange={(e) => setTargetStartDate(e.target.value)} />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Objective</label>
                  <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="What problem or opportunity will this initiative address?" />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Scope</label>
                  <Textarea value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Systems, applications, asset classes, or domains in scope." />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Key Stakeholders</label>
                  <Input value={keyStakeholders} onChange={(e) => setKeyStakeholders(e.target.value)} placeholder="Names or roles, comma-separated" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Proposed Initiative Owner</label>
                  <Input value={proposedOwner} onChange={(e) => setProposedOwner(e.target.value)} placeholder="Name" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Estimated Budget</label>
                  <Input value={estimatedBudget} onChange={(e) => setEstimatedBudget(e.target.value)} placeholder="e.g. AED 10M" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Priority</label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as (typeof PRIORITY_OPTIONS)[number])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">DEWA Stakeholder Roles</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DEWA_ROLE_OPTIONS.map((roleOption) => {
                      const selected = stakeholderRoles.includes(roleOption);
                      return (
                        <button
                          key={roleOption}
                          type="button"
                          onClick={() =>
                            setStakeholderRoles((current) =>
                              current.includes(roleOption)
                                ? current.filter((item) => item !== roleOption)
                                : [...current, roleOption]
                            )
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            selected
                              ? "border-orange-200 bg-orange-50 text-orange-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:text-gray-900"
                          }`}
                        >
                          {roleOption}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Additional Context</label>
                  <Textarea value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} placeholder="Any extra information for the TO team." />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            <DialogFooter>
              <Button variant="outline" onClick={() => setRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={submitInitiativeRequest}>
                Submit for Approval
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
