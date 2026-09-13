import { Check } from "lucide-react";

const STEPS = [
  { number: 1, label: "Date & Time" },
  { number: 2, label: "Party Details" },
  { number: 3, label: "Customer Details" },
  { number: 4, label: "Confirm & Pay" },
];

export default function BookingStepper({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const isCompleted = current > step.number;
        const isActive = current === step.number;
        return (
          <div key={step.number} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300 ${
                  isCompleted || isActive
                    ? "bg-grill-orange text-white"
                    : "bg-grill-orange/15 text-grill-orange-dark/60"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" strokeWidth={2.5} /> : step.number}
              </span>
              <span
                className={`hidden whitespace-nowrap text-sm transition-colors duration-300 sm:inline ${
                  isActive ? "font-semibold text-grill-brown" : isCompleted ? "text-grill-brown/70" : "text-grill-brown/35"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-px flex-1 transition-colors duration-300 sm:mx-4 ${
                  isCompleted ? "bg-grill-orange" : "bg-grill-brown/15"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
