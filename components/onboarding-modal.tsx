"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Welcome to Pigeon",
    description:
      "Pigeon drafts your launch email sequence in your own voice — no copywriter, no agency. Let's get you set up.",
  },
  {
    title: "Build your Voice Profile",
    description:
      "Upload 5 emails you've already sent. Pigeon learns your tone and structure from them — every sequence gets drafted from this Voice Profile.",
  },
  {
    title: "Generate your first sequence",
    description:
      "Pick a launch date and Pigeon drafts a full sequence — welcome, value, cart-open, cart-close — written the way you'd write it.",
  },
  {
    title: "You're always in control",
    description:
      "Nothing sends without you. Every draft lands in the Sequence Editor for your review and approval first.",
  },
] as const;

function markOnboardingComplete() {
  fetch("/api/onboarding/complete", { method: "POST" }).catch(() => {});
}

export function OnboardingModal() {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function dismiss() {
    setOpen(false);
    markOnboardingComplete();
  }

  function handleNext() {
    if (isLast) {
      dismiss();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-pigeon-ink">
            {current.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-pigeon-ink-muted leading-relaxed">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === step
                  ? "bg-pigeon-ink"
                  : "bg-pigeon-ink/20"
              )}
            />
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={dismiss}>
            Skip
          </Button>
          <Button size="sm" onClick={handleNext}>
            {isLast ? "Get started" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
