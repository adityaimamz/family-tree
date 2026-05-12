import { ClipboardList, UserRound, UsersRound } from "lucide-react";

export const formSteps = [
  { id: "personal", label: "Personal Information", Icon: UserRound },
  { id: "family", label: "Family Relationships", Icon: UsersRound },
  { id: "notes", label: "Photos & Notes", Icon: ClipboardList },
] as const;

export type FormStep = (typeof formSteps)[number]["id"];

export const FormStepper = ({
  currentStep,
  onStepChange,
}: {
  currentStep: FormStep;
  onStepChange: (step: FormStep) => void;
}) => {
  const currentIndex = formSteps.findIndex((step) => step.id === currentStep);

  return (
    <nav aria-label="Data management steps">
      <ol className="grid grid-cols-3 items-stretch gap-2 sm:gap-3">
        {formSteps.map((step, index) => {
          const Icon = step.Icon;
          const active = step.id === currentStep;
          const completed = index < currentIndex;

          let stepStyles = "border-border-soft bg-surface text-text-primary/72 hover:bg-surface-soft hover:text-text-primary";
          if (active) {
            stepStyles = "border-dark-green bg-dark-green text-white shadow-soft";
          } else if (completed) {
            stepStyles = "border-soft-gold/45 bg-soft-gold/20 text-warm-brown";
          }

          return (
            <li key={step.id} className="min-w-0">
              <button
                type="button"
                aria-current={active ? "step" : undefined}
                className={`group flex h-full min-h-[4.8rem] w-full min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-2 text-center transition active:translate-y-[1px] focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-soft-gold sm:min-h-14 sm:flex-row sm:justify-start sm:px-3 sm:text-left ${stepStyles}`}
                onClick={() => onStepChange(step.id)}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition sm:h-10 sm:w-10 ${active || completed
                      ? "border-white/30 bg-white/20 text-current"
                      : "border-border-soft bg-surface text-warm-brown/70 group-hover:border-soft-gold/60 group-hover:bg-soft-gold/10"
                    }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="max-w-full text-[0.68rem] font-extrabold leading-3 sm:text-sm sm:leading-5">
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
