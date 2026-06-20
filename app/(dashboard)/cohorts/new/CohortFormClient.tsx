"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  programName: string;
  curriculumSummary: string;
  cartOpenDate: string;
  cartCloseDate: string;
  cohortStartDate: string;
  seatCount: string;
  priceUsd: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

type KajabiProduct = {
  id: string;
  name: string;
  startDate: string | null;
};

type Status = "idle" | "saving" | "generating";

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!form.programName.trim()) errors.programName = "Required";
  if (!form.curriculumSummary.trim()) errors.curriculumSummary = "Required";
  if (!form.cartOpenDate) errors.cartOpenDate = "Required";
  if (!form.cartCloseDate) {
    errors.cartCloseDate = "Required";
  } else if (form.cartOpenDate && form.cartCloseDate <= form.cartOpenDate) {
    errors.cartCloseDate = "Must be after cart open date";
  }
  if (!form.cohortStartDate) {
    errors.cohortStartDate = "Required";
  } else if (
    form.cartCloseDate &&
    form.cohortStartDate <= form.cartCloseDate
  ) {
    errors.cohortStartDate = "Must be after cart close date";
  }
  return errors;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Kajabi Banner ────────────────────────────────────────────────────────────

function KajabiBanner({
  onImport,
}: {
  onImport: (product: KajabiProduct) => void;
}) {
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
      <Card className="mb-6 rounded-xl border border-pigeon-primary/20 bg-pigeon-primary/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-sans text-sm font-semibold text-pigeon-primary">
              Kajabi
            </span>
            <span className="flex items-center gap-1 font-sans text-xs text-pigeon-success">
              <span className="size-1.5 rounded-full bg-pigeon-success" />
              Connected
            </span>
          </div>
          <p className="flex-1 font-sans text-sm text-pigeon-muted">
            {imported
              ? `Imported from Kajabi: ${imported}`
              : "Import a program from Kajabi to auto-fill this form."}
          </p>
          {!imported && (
            <button
              onClick={openDialog}
              className="shrink-0 rounded-lg border border-pigeon-primary px-3 py-1.5 font-sans text-sm font-medium text-pigeon-primary hover:bg-pigeon-primary/10"
            >
              Choose a Program ↓
            </button>
          )}
          {imported && (
            <span className="shrink-0 font-sans text-sm font-medium text-pigeon-success">
              ✓ Imported
            </span>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-semibold text-gray-900">
              Choose a Kajabi program
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            {loading && (
              <p className="py-4 text-center font-sans text-sm text-pigeon-muted">
                Loading programs…
              </p>
            )}
            {!loading && products.length === 0 && (
              <p className="py-4 text-center font-sans text-sm text-pigeon-muted">
                No programs found.
              </p>
            )}
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProduct(p)}
                className="flex w-full items-center justify-between rounded-lg border border-pigeon-border p-3 text-left hover:border-pigeon-primary hover:bg-pigeon-bg"
              >
                <span className="font-heading text-sm font-semibold text-gray-900">
                  {p.name}
                </span>
                {p.startDate && (
                  <span className="font-sans text-xs text-pigeon-muted">
                    Starts {p.startDate}
                  </span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block font-heading text-sm font-semibold text-gray-700">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 font-sans text-xs text-pigeon-error">{message}</p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CohortFormClient({ hasKajabi }: { hasKajabi: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    programName: "",
    curriculumSummary: "",
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

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (touched) setErrors(validate({ ...form, [key]: value }));
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
    const errs = validate(form);
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
          curriculum_summary: form.curriculumSummary.trim(),
          cart_open_date: form.cartOpenDate,
          cart_close_date: form.cartCloseDate,
          cohort_start_date: form.cohortStartDate,
          seat_count: form.seatCount ? parseInt(form.seatCount) : undefined,
          price_usd: form.priceUsd ? parseInt(form.priceUsd) : undefined,
          kajabi_product_id: kajabiProductId ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create cohort" }));
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

  const wc = countWords(form.curriculumSummary);

  // Generating state — full replacement
  if (status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <svg
          className="size-8 animate-spin text-pigeon-accent"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
        <p className="font-heading text-xl font-semibold text-gray-900">
          Generating your sequence…
        </p>
        <p className="font-sans text-sm text-pigeon-muted">
          Claude is writing 9 emails in your voice. This usually takes 20–40 seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-heading text-[28px] font-bold text-gray-900">
        Set Up Your Cohort
      </h2>
      <p className="mt-2 font-sans text-base text-pigeon-muted">
        Tell Pigeon about your program and launch dates.
      </p>

      {hasKajabi && (
        <div className="mt-6">
          <KajabiBanner onImport={handleKajabiImport} />
        </div>
      )}

      <Card className="mt-6 rounded-xl border border-pigeon-border bg-white shadow-sm">
        <CardContent className="space-y-6 p-6">
          {/* Program Name */}
          <div>
            <Label>Program Name *</Label>
            <Input
              value={form.programName}
              onChange={(e) => set("programName", e.target.value)}
              placeholder="e.g. The Bold Creator Accelerator"
              className={cn(
                "border-pigeon-border bg-white font-sans",
                errors.programName && "border-pigeon-error"
              )}
            />
            <FieldError message={errors.programName} />
          </div>

          {/* Curriculum Summary */}
          <div>
            <Label>Curriculum Summary *</Label>
            <Textarea
              value={form.curriculumSummary}
              onChange={(e) => set("curriculumSummary", e.target.value)}
              placeholder="Describe your modules, key outcomes, and the transformation students experience. The more specific, the better the emails."
              className={cn(
                "min-h-40 resize-y border-pigeon-border bg-white font-sans text-sm",
                errors.curriculumSummary && "border-pigeon-error"
              )}
            />
            <p
              className={cn(
                "mt-1 font-sans text-xs",
                wc === 0
                  ? "text-pigeon-muted"
                  : wc >= 100 && wc <= 500
                  ? "text-pigeon-success"
                  : "text-pigeon-accent"
              )}
            >
              {wc} words — aim for 100–500
            </p>
            <FieldError message={errors.curriculumSummary} />
          </div>

          {/* Cart Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cart Open Date *</Label>
              <input
                type="date"
                value={form.cartOpenDate}
                onChange={(e) => set("cartOpenDate", e.target.value)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 font-sans text-sm text-gray-900 outline-none focus:border-pigeon-primary",
                  errors.cartOpenDate
                    ? "border-pigeon-error"
                    : "border-pigeon-border"
                )}
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
                className={cn(
                  "w-full rounded-lg border px-3 py-2 font-sans text-sm text-gray-900 outline-none focus:border-pigeon-primary",
                  errors.cartCloseDate
                    ? "border-pigeon-error"
                    : "border-pigeon-border"
                )}
              />
              <FieldError message={errors.cartCloseDate} />
            </div>
          </div>

          {/* Cohort Start Date */}
          <div>
            <Label>Cohort Start Date *</Label>
            <input
              type="date"
              value={form.cohortStartDate}
              min={form.cartCloseDate || undefined}
              onChange={(e) => set("cohortStartDate", e.target.value)}
              className={cn(
                "w-full rounded-lg border px-3 py-2 font-sans text-sm text-gray-900 outline-none focus:border-pigeon-primary",
                errors.cohortStartDate
                  ? "border-pigeon-error"
                  : "border-pigeon-border"
              )}
            />
            <FieldError message={errors.cohortStartDate} />
          </div>

          {/* Optional: Seats + Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Seats Available</Label>
              <Input
                type="number"
                min={1}
                value={form.seatCount}
                onChange={(e) => set("seatCount", e.target.value)}
                placeholder="e.g. 50"
                className="border-pigeon-border bg-white font-sans"
              />
            </div>
            <div>
              <Label>Price per Seat (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm text-pigeon-muted">
                  $
                </span>
                <Input
                  type="number"
                  min={0}
                  value={form.priceUsd}
                  onChange={(e) => set("priceUsd", e.target.value)}
                  placeholder="997"
                  className="border-pigeon-border bg-white pl-6 font-sans"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <button
        onClick={handleSubmit}
        disabled={status === "saving"}
        className={cn(
          "mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-heading text-base font-semibold text-white transition-colors",
          status === "saving"
            ? "cursor-not-allowed bg-pigeon-accent/60"
            : "cursor-pointer bg-pigeon-accent hover:bg-orange-600"
        )}
      >
        {status === "saving" ? (
          <>
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Saving…
          </>
        ) : (
          "Save & Build Sequence →"
        )}
      </button>
    </div>
  );
}
