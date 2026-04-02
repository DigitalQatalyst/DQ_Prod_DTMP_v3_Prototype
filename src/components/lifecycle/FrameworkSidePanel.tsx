import { ArrowRight, CheckCircle2, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InitiativeFramework } from "@/data/lifecycle/frameworkCards";
import type { LifecycleTemplate } from "@/data/lifecycle/lifecycleData";

interface FrameworkSidePanelProps {
  framework: InitiativeFramework | null;
  templates: LifecycleTemplate[];
  selectedTemplateId: string | null;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  onBeginRequest: () => void;
}

export default function FrameworkSidePanel({
  framework,
  templates,
  selectedTemplateId,
  onClose,
  onSelectTemplate,
  onBeginRequest,
}: FrameworkSidePanelProps) {
  if (!framework) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Framework Detail</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">{framework.type}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={framework.category === "Internal" ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-blue-50 text-blue-700 border border-blue-200"}>
                  {framework.category}
                </Badge>
                <Badge variant="outline">{framework.typicalDuration}</Badge>
                <Badge variant="outline">{framework.typicalScope}</Badge>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <p className="text-sm leading-relaxed text-orange-950">{framework.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">What TO Provides</p>
              <ul className="mt-3 space-y-2">
                {framework.whatTOProvides.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-teal-950">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">What Division Provides</p>
              <ul className="mt-3 space-y-2">
                {framework.whatDivisionProvides.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-blue-950">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Key Phases</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {framework.keyPhases.map((phase) => (
                <Badge key={phase} variant="outline" className="bg-white">
                  {phase}
                </Badge>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Compatible Templates</p>
                <p className="mt-1 text-sm text-gray-600">Choose the lifecycle template that will govern the request path.</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                {templates.length} templates
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {templates.map((template) => {
                const selected = template.id === selectedTemplateId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onSelectTemplate(template.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      selected
                        ? "border-orange-200 bg-orange-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{template.title}</p>
                        <p className="mt-1 text-xs text-gray-500">{template.category} · {template.methodology} · {template.totalDuration}</p>
                      </div>
                      {selected ? <Badge className="bg-orange-600 text-white">Selected</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{template.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Expected Outcomes</p>
            <ul className="mt-3 space-y-2">
              {framework.expectedOutcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                  {outcome}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              {selectedTemplateId ? "Template selected. Continue to request configuration." : "Select a compatible template to continue."}
            </p>
            <Button onClick={onBeginRequest} disabled={!selectedTemplateId} className="bg-orange-600 hover:bg-orange-700 text-white">
              Begin Request <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
