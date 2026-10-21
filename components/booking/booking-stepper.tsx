// Visual step indicator showing customer progress through the multi-step booking form
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export interface StepItem {
  id: number
  label: string
  sublabel?: string
}

interface BookingStepperProps {
  steps: StepItem[]
  currentStep: number
  className?: string
}

export function BookingStepper({ steps, currentStep, className }: BookingStepperProps) {
  return (
    <nav aria-label="Booking Progress" className={cn("w-full", className)}>
      <ol className="flex items-center justify-between gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          const isUpcoming = currentStep < step.id

          return (
            <li
              key={step.id}
              className={cn(
                "flex flex-1 items-center",
                index !== steps.length - 1 && "after:content-[''] after:w-full after:h-0.5 after:mx-2 sm:after:mx-4 after:transition-colors",
                isCompleted
                  ? "after:bg-primary"
                  : "after:bg-border"
              )}
            >
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div
                  className={cn(
                    "flex size-7 sm:size-8 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "border-2 border-primary bg-primary/15 text-primary ring-2 ring-primary/20",
                    isUpcoming && "border border-border bg-muted/40 text-muted-foreground"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                <div className="hidden md:flex flex-col">
                  <span
                    className={cn(
                      "text-xs font-semibold tracking-tight",
                      isCurrent && "text-foreground",
                      isCompleted && "text-primary",
                      isUpcoming && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  {step.sublabel && (
                    <span className="text-[10px] text-muted-foreground">
                      {step.sublabel}
                    </span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
