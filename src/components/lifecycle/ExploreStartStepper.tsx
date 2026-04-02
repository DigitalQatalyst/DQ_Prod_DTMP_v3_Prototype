interface ExploreStartStepperProps {
  activeStep: 1 | 2 | 3;
  selectedFramework?: string | null;
  selectedTemplate?: string | null;
}

const STEPS = [
  { step: 1, label: "Select Framework" },
  { step: 2, label: "Choose Template" },
  { step: 3, label: "Submit Request" },
] as const;

export default function ExploreStartStepper({
  activeStep,
  selectedFramework,
  selectedTemplate,
}: ExploreStartStepperProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {STEPS.map((item, index) => {
        const completed = item.step < activeStep;
        const active = item.step === activeStep;
        const note =
          item.step === 1 ? selectedFramework :
          item.step === 2 ? selectedTemplate :
          activeStep === 3 ? "Ready to submit" : undefined;

        return (
          <div key={item.step} className="flex items-center gap-3">
            <div
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                active
                  ? "border-orange-200 bg-orange-50 text-orange-700"
                  : completed
                  ? "border-teal-200 bg-teal-50 text-teal-700"
                  : "border-gray-200 bg-white text-gray-500"
              }`}
            >
              <span className="mr-2 text-xs">{item.step}</span>
              {item.label}
              {note ? <span className="ml-2 text-xs opacity-80">{note}</span> : null}
            </div>
            {index < STEPS.length - 1 ? <span className="hidden sm:block h-px w-8 bg-gray-300" /> : null}
          </div>
        );
      })}
    </div>
  );
}
