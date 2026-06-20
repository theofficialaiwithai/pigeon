"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GeneratingIndicator } from "@/components/generating-indicator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Sequence type config ──────────────────────────────────────────────────────

type SequenceType = "launch" | "reengagement" | "newsletter";

const SEQUENCE_TYPES: {
  id: SequenceType;
  label: string;
  emoji: string;
  description: string;
  emailCount: string;
  namePlaceholder: string;
  detailsLabel: string;
  detailsPlaceholder: string;
  generatingLabel: string;
}[] = [
  {
    id: "launch",
    label: "Launch Sequence",
    emoji: "🚀",
    description: "9 emails timed around your cart open & close dates",
    emailCount: "9 emails",
    namePlaceholder: "e.g. The Bold Creator Accelerator",
    detailsLabel: "Curriculum Summary",
    detailsPlaceholder: "Describe your modules, key outcomes, and the transformation students experience. The more specific, the better the emails.",
    generatingLabel: "Generating your 9-email launch sequence",
  },
  {
    id: "reengagement",
    label: "Re-engagement",
    emoji: "🔥",
    description: "5 emails to win back a cold or quiet list",
    emailCount: "5 emails",
    namePlaceholder: "e.g. The Solopreneur Stack",
    detailsLabel: "Who & Why",
    detailsPlaceholder: "Who are you re-engaging and why did they go cold? What's the re-engagement offer or next step you want them to take?",
    generatingLabel: "Generating your re-engagement sequence",
  },
  {
    id: "newsletter",
    label: "Weekly Newsletter",
    emoji: "📬",
    description: "4 ready-to-send newsletter issues",
    emailCount: "4 issues",
    namePlaceholder: "e.g. The Dispatch — weekly solopreneur tactics",
    detailsLabel: "Topics & Themes",
    detailsPlaceholder: "What topics, insights, or themes should the newsletters cover? What's the goal — education, community, sales?",
    generatingLabel: "Writing your newsletter issues",
  },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

type FormData = {
  programName: string;
  details: string;
  cartOpenDate: string;
  cartCloseDate: string;
  cohortStartDate: string;
  seatCount: string;
  priceUsd: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;
type Status = "idle" | "saving" | "generating";

type KajabiProduct = {
  id: string;
  name: string;
  startDate: string | null;
};

// ─── Validation ────────────────────────────────────────────────────────────────

function validate(form: FormData, type: SequenceType): FormErrors {
  const errors: FormErrors = {};
  if (!form.programName.trim()) errors.programName = "Required";
  if (!form.details.trim()) errors.details = "Required";
  if (type === "launch") {
    if (!form.cartOpenDate) errors.cartOpenDate = "Required";
    if (!form.cartCloseDate) {
      errors.cartCloseDate = "Required";
    } else if (form.cartOpenDate && form.cartCloseDate <= form.cartOpenDate) {
      errors.cartCloseDate = "Must be after cart open date";
    }
    if (!form.cohortStartDate) {
      errors.cohortStartDate = "Required";
    } else if (form.cartCloseDate && form.cohortStartDate <= form.cartCloseDate) {
      errors.cohortStartDate = "Must be after cart close date";
    }
  }
  return errors;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block font-heading text-sm font-semibold text-gray-700">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 font-sans text-xs text-pigeon-sienna">{message}</p>;
}

function KajabiBanner({ onImport }: { onImport: (p: KajabiProduct) => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [products, setProducts] = useState<KajabiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState<string | null>(null);

  async function openDialog() {
    setDialogOpen(true);
    if (products.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/kajabi/products");
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      toast.error("Could not load Kajabi products");
    } finally {
      setLoading(false);
    }
  }

  function selectProduct(p: KajabiProduct) {
    onImport(p);
    setImported(p.name);
    setDialogOpen(false);
  }

  return (
    <>
      <Card className="mb-6 rounded-xl border border-pigeon-ink/20 bg-pigeon-ink/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-sans text-sm font-semibold text-pigeon-ink">Kajabi</span>
            <span className="flex items-center gap-1 font-sans text-xs text-pigeon-sage">
              <span className="size-1.5 rounded-full bg-pigeon-sage" />
              Connected
            </span>
          </div>
          <p className="flex-1 font-sans text-sm text-pigeon-ink-muted">
            {imported ? `Imported from Kajabi: ${imported}` : "Import a program from Kajabi to auto-fill this form."}
          </p>
          {!imported && (
            <button onClick={openDialog} className="shrink-0 rounded-lg border border-pigeon-ink px-3 py-1.5 font-sans text-sm font-medium text-pigeon-ink hover:bg-pigeon-ink/10">
              Choose a Program ↓
            </button>
          )}
          {imported && <span className="shrink-0 font-sans text-sm font-medium text-pigeon-sage">✓ Imported</span>}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-semibold text-gray-900">Choose a Kajabi program</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            {loading && <p className="py-4 text-center font-sans text-sm text-pigeon-ink-muted">Loading programs…</p>}
            {!loading && products.length === 0 && <p className="py-4 text-center font-sans text-sm text-pigeon-ink-muted">No programs found.</p>}
            {products.map((p) => (
              <button key={p.id} onClick={() => selectProduct(p)} className="flex w-full items-center justify-between rounded-lg border border-pigeon-warm-rule p-3 text-left hover:border-pigeon-ink hover:bg-pigeon-cream">
                <span className="font-heading text-sm font-semibold text-gray-900">{p.name}</span>
                {p.startDate && <span className="font-sans text-xs text-pigeon-ink-muted">Starts {p.startDate}</span>}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Sequence type selector ────────────────────────────────────────────────────

function SequenceTypeSelector({
  selected,
  onChange,
}: {
  selected: SequenceType;
  onChange: (t: SequenceType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {SEQUENCE_TYPES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all",
            selected === t.id
              ? "border-pigeon-sienna bg-pigeon-sienna/5"
              : "border-pigeon-warm-rule bg-white hover:border-pigeon-ink/40"
          )}
        >
          <span className="text-2xl">{t.emoji}</span>
          <span className={cn("font-heading text-sm font-semibold", selected === t.id ? "text-pigeon-sienna" : "text-pigeon-ink")}>
            {t.label}
          </span>
          <span className="font-sans text-xs text-pigeon-ink-muted leading-relaxed">{t.description}</span>
          <span className={cn("mt-auto inline-block rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold", selected === t.id ? "bg-pigeon-sienna/10 text-pigeon-sienna" : "bg-pigeon-cream text-pigeon-ink-muted")}>
            {t.emailCount}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function CohortFormClient({ hasKajabi }: { hasKajabi: boolean }) {
  const router = useRouter();
  const [sequenceType, setSequenceType] = useState<SequenceType>("launch");
  const [form, setForm] = useState<FormData>({
    programName: "",
    details: "",
    cartOpenDate: "",
    cartCloseDate: "",
    cohortStartDate: "",
    seatCount: "",
    priceUsd: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [kajabiProductId, setKajabiProductId] = useState<string | null>(null);

  const typeConfig = SEQUENCE_TYPES.find((t) => t.id === sequenceType)!;

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (touched) setErrors(validate({ ...form, [key]: value }, sequenceType));
  }

  function handleTypeChange(t: SequenceType) {
    setSequenceType(t);
    setErrors({});
    setTouched(false);
  }

  function handleKajabiImport(product: KajabiProduct) {
    setKajabiProductId(product.id);
    setForm((prev) => ({
      ...prev,
      programName: product.name,
      cohortStartDate: product.startDate ?? prev.cohortStartDate,
    }));
  }

  async function handleSubmit() {
    const errs = validate(form, sequenceType);
    setErrors(errs);
    setTouched(true);
    if (Object.keys(errs).length > 0) return;

    setStatus("saving");
    try {
      const res = await fetch("/api/cohorts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_name: form.programName.trim(),
          curriculum_summary: form.details.trim(),
          sequence_type: sequenceType,
          ...(sequenceType === "launch" && {
            cart_open_date: form.cartOpenDate,
            cart_close_date: form.cartCloseDate,
            cohort_start_date: form.cohortStartDate,
            seat_count: form.seatCount ? parseInt(form.seatCount) : undefined,
            price_usd: form.priceUsd ? parseInt(form.priceUsd) : undefined,
          }),
          kajabi_product_id: kajabiProductId ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create" }));
        throw new Error(err.error);
      }

      const { cohortId, hasVoiceProfile } = await res.json();

      if (!hasVoiceProfile) {
        router.push(`/voice-profile?from=${cohortId}`);
        return;
      }

      setStatus("generating");

      const seqRes = await fetch("/api/sequence/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohortId }),
      });

      if (!seqRes.ok) {
        const err = await seqRes.json().catch(() => ({ error: "Failed to generate sequence" }));
        throw new Error(err.error);
      }

      router.push(`/cohorts/${cohortId}/sequence`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setStatus("idle");
    }
  }

  const wc = countWords(form.details);

  if (status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <GeneratingIndicator label={typeConfig.generatingLabel} />
        <p className="font-sans text-sm text-pigeon-ink-muted">
          Claude is writing in your voice. This usually takes 20–40 seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-heading text-[28px] font-bold text-gray-900">New Sequence</h2>
      <p className="mt-2 font-sans text-base text-pigeon-ink-muted">
        Choose a type, then tell Pigeon what to write.
      </p>

      {/* Type selector */}
      <div className="mt-6">
        <p className="mb-3 font-heading text-sm font-semibold text-gray-700">What are you sending?</p>
        <SequenceTypeSelector selected={sequenceType} onChange={handleTypeChange} />
      </div>

      {hasKajabi && sequenceType === "launch" && (
        <div className="mt-6">
          <KajabiBanner onImport={handleKajabiImport} />
        </div>
      )}

      <Card className="mt-6 rounded-xl border border-pigeon-warm-rule bg-white shadow-sm">
        <CardContent className="space-y-6 p-6">
          {/* Program / series name */}
          <div>
            <Label>
              {sequenceType === "newsletter" ? "Newsletter Name" : "Program Name"} *
            </Label>
            <Input
              value={form.programName}
              onChange={(e) => set("programName", e.target.value)}
              placeholder={typeConfig.namePlaceholder}
              className={cn("border-pigeon-warm-rule bg-white font-sans", errors.programName && "border-pigeon-sienna")}
            />
            <FieldError message={errors.programName} />
          </div>

          {/* Details / curriculum / topics */}
          <div>
            <Label>{typeConfig.detailsLabel} *</Label>
            <Textarea
              value={form.details}
              onChange={(e) => set("details", e.target.value)}
              placeholder={typeConfig.detailsPlaceholder}
              className={cn("min-h-40 resize-y border-pigeon-warm-rule bg-white font-sans text-sm", errors.details && "border-pigeon-sienna")}
            />
            <p className={cn("mt-1 font-sans text-xs", wc === 0 ? "text-pigeon-ink-muted" : wc >= 50 && wc <= 500 ? "text-pigeon-sage" : "text-pigeon-sienna")}>
              {wc} words — aim for 50–500
            </p>
            <FieldError message={errors.details} />
          </div>

          {/* Launch-only fields */}
          {sequenceType === "launch" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cart Open Date *</Label>
                  <input
                    type="date"
                    value={form.cartOpenDate}
                    onChange={(e) => set("cartOpenDate", e.target.value)}
                    className={cn("w-full rounded-lg border px-3 py-2 font-sans text-sm text-gray-900 outline-none focus:border-pigeon-ink", errors.cartOpenDate ? "border-pigeon-sienna" : "border-pigeon-warm-rule")}
                  />
                  <FieldError message={errors.cartOpenDate} />
                </div>
                <div>
                  <Label>Cart Close Date *</Label>
                  <input
                    type="date"
                    value={form.cartCloseDate}
                    min={form.cartOpenDate || undefined}
                    onChange={(e) => set("cartCloseDate", e.target.value)}
                    className={cn("w-full rounded-lg border px-3 py-2 font-sans text-sm text-gray-900 outline-none focus:border-pigeon-ink", errors.cartCloseDate ? "border-pigeon-sienna" : "border-pigeon-warm-rule")}
                  />
                  <FieldError message={errors.cartCloseDate} />
                </div>
              </div>
              <div>
                <Label>Cohort Start Date *</Label>
                <input
                  type="date"
                  value={form.cohortStartDate}
                  min={form.cartCloseDate || undefined}
                  onChange={(e) => set("cohortStartDate", e.target.value)}
                  className={cn("w-full rounded-lg border px-3 py-2 font-sans text-sm text-gray-900 outline-none focus:border-pigeon-ink", errors.cohortStartDate ? "border-pigeon-sienna" : "border-pigeon-warm-rule")}
                />
                <FieldError message={errors.cohortStartDate} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Seats Available</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.seatCount}
                    onChange={(e) => set("seatCount", e.target.value)}
                    placeholder="e.g. 50"
                    className="border-pigeon-warm-rule bg-white font-sans"
                  />
                </div>
                <div>
                  <Label>Price per Seat (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm text-pigeon-ink-muted">$</span>
                    <Input
                      type="number"
                      min={0}
                      value={form.priceUsd}
                      onChange={(e) => set("priceUsd", e.target.value)}
                      placeholder="997"
                      className="border-pigeon-warm-rule bg-white pl-6 font-sans"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <button
        onClick={handleSubmit}
        disabled={status === "saving"}
        className={cn(
          "mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-heading text-base font-semibold text-white transition-colors",
          status === "saving" ? "cursor-not-allowed bg-pigeon-sienna/60" : "cursor-pointer bg-pigeon-sienna hover:bg-orange-600"
        )}
      >
        {status === "saving" ? <GeneratingIndicator label="Saving" /> : `Generate ${typeConfig.label} →`}
      </button>
    </div>
  );
}
