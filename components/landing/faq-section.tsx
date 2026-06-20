"use client";
import { useState } from "react";
import { Plus } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Do I need to be a copywriter to use Pigeon?",
    a: "No. Pigeon builds a Voice Fingerprint from 5 emails you've already sent and writes in that voice — you're reviewing and approving, not drafting from scratch.",
  },
  {
    q: "How long does it take to generate a sequence?",
    a: "About 12 seconds for the full 9-email sequence once your cohort details and past emails are in.",
  },
  {
    q: "Will the emails actually sound like me?",
    a: "Pigeon matches tone and phrasing patterns from your own past emails rather than generating generic AI copy — you'll see a voice-match score on every draft.",
  },
  {
    q: "Does Pigeon work with my email platform?",
    a: "Yes — one-click export to ConvertKit, direct Kajabi cohort import, and a generic webhook export for Zapier or Make if you use something else.",
  },
  {
    q: "Can I edit the emails before they go out?",
    a: "Yes. Every email is fully editable and needs your approval before it's scheduled or exported — nothing sends without you seeing it first.",
  },
  {
    q: "What does Pigeon cost?",
    a: "$29/month, unlimited cohorts and sequences. See the Pricing section above for what's included.",
  },
];

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <section className="bg-pigeon-cream py-24">
      <div className="mx-auto max-w-3xl px-6">

        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-pigeon-warm-rule bg-pigeon-cream px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-pigeon-ink" />
            <span className="text-xs font-semibold text-pigeon-ink-muted">FAQ</span>
          </div>
          <h2 className="font-heading text-3xl font-extrabold text-pigeon-ink md:text-4xl">
            Everything you need to know{" "}
            <span className="text-pigeon-ink-muted">before you launch.</span>
          </h2>
          <p className="max-w-md text-base text-pigeon-ink-muted">
            Still have questions? Here&apos;s what cohort creators usually ask before their first launch.
          </p>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {FAQ_ITEMS.map(({ q, a }, i) => {
            const isOpen = openItems.has(i);
            return (
              <div
                key={i}
                className="rounded-2xl border border-pigeon-warm-rule bg-white"
              >
                {/* Question row */}
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading text-base text-pigeon-ink">
                    {q}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pigeon-ink transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    <Plus className="h-4 w-4 text-white" />
                  </span>
                </button>

                {/* Answer — grid-rows height animation */}
                <div
                  className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 pt-0 text-sm text-pigeon-ink-muted">
                      {a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
