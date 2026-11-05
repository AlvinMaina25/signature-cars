import { Check, X } from "lucide-react";

import type { ReservationStatus } from "@/data/types";

const STEPS = [
  { key: "pending", label: "Requested" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
] as const;

/** How far along the happy path a reservation is (cancelled has no position). */
const POSITION: Record<Exclude<ReservationStatus, "cancelled">, number> = {
  pending: 0,
  confirmed: 1,
  completed: 2,
};

export function ReservationProgress({ status }: { status: ReservationStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
        <span className="grid size-6 place-items-center rounded-full bg-destructive/15">
          <X className="size-3.5" aria-hidden />
        </span>
        Cancelled
      </div>
    );
  }

  const position = POSITION[status];

  return (
    <ol className="flex items-center" aria-label="Reservation progress">
      {STEPS.map((step, index) => {
        const done = index < position || status === "completed";
        const current = index === position && status !== "completed";
        return (
          <li
            key={step.key}
            className="flex items-center"
            aria-current={current ? "step" : undefined}
          >
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`grid size-7 place-items-center rounded-full text-xs font-semibold transition ${
                  done
                    ? "bg-accent text-accent-foreground"
                    : current
                      ? "bg-accent/15 text-accent ring-2 ring-accent"
                      : "bg-muted text-mist"
                }`}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : index + 1}
              </span>
              <span className={`text-[11px] ${done || current ? "text-foreground" : "text-mist"}`}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                aria-hidden
                className={`mx-2 mb-5 h-0.5 w-8 rounded sm:w-14 ${done ? "bg-accent" : "bg-muted"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
