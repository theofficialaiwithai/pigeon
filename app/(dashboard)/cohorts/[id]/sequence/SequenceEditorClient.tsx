"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeftIcon, PencilIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { EmailPreviewCard } from "@/components/email-preview-card";
import { GeneratingIndicator } from "@/components/generating-indicator";
import { SuccessCheckmark } from "@/components/success-checkmark";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailVariant {
  id: string;
  variantType: string;
  subjectLine: string;
  previewText: string;
  bodyHtml: string;
  isSelected: boolean;
}

export interface EmailData {
  id: string;
  position: number;
  emailType: string;
  subjectLine: string;
  previewText: string;
  bodyHtml: string;
  scheduledSendAt: string | null;
  approvalStatus: string;
  variants: EmailVariant[];
}

type RegenerateResponse = {
  subjectLine: string;
  previewText: string;
  bodyHtml: string;
  variants?: Array<{
    variantType: string;
    subjectLine: string;
    previewText: string;
    bodyHtml: string;
  }>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  pre_launch_warmup: "Pre-Launch Warmup",
  list_primer: "List Primer",
  cart_open: "Cart Open",
  curriculum_deep_dive: "Curriculum Deep Dive",
  student_story: "Student Story",
  objection_handling: "Objection Handling",
  close_48h: "Cart Closing — 48h",
  close_24h: "Cart Closing — 24h",
  final_call: "Final Call",
};

const VARIANT_LABELS: Record<string, string> = {
  urgency_led: "Urgency-Led",
  results_led: "Results-Led",
  personal_note: "Personal Note",
};

// ─── HTML ↔ plain text helpers ────────────────────────────────────────────────

function htmlToText(html: string): string {
  return (html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) ?? [html])
    .map((p) => p.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .join("\n\n");
}

function textToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p}</p>`)
    .join("");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Stable pseudo-random score in 78–95% derived from email id. Replace with real data when available. */
function deriveVoiceMatchScore(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) {
    n = (n * 31 + id.charCodeAt(i)) & 0xffff;
  }
  return 78 + (n % 18);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

// ─── BodyEditor ───────────────────────────────────────────────────────────────

function BodyEditor({
  initialHtml,
  onChange,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
}) {
  const [text, setText] = useState(() => htmlToText(initialHtml));

  return (
    <textarea
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(textToHtml(e.target.value));
      }}
      rows={8}
      className="w-full resize-none outline-none font-sans text-[15px] leading-relaxed text-gray-800 bg-transparent"
    />
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return <Badge variant="tag-sage">Approved</Badge>;
  if (status === "edited")
    return <Badge variant="tag-gold">Edited</Badge>;
  return <Badge variant="tag-ink">Draft</Badge>;
}

// ─── RegenerateButton ─────────────────────────────────────────────────────────

function RegenerateButton({
  isRegenerating,
  onClick,
}: {
  isRegenerating: boolean;
  onClick: () => void;
}) {
  if (isRegenerating) {
    return <GeneratingIndicator label="Regenerating" />;
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-pigeon-ink-muted gap-1"
    >
      <RefreshCwIcon className="w-3.5 h-3.5" />
      Regenerate
    </Button>
  );
}

// ─── EmailCard ────────────────────────────────────────────────────────────────

function EmailCard({
  email,
  isRegenerating,
  regenerateError,
  onApprove,
  onEdit,
  onChange,
  onRegenerate,
}: {
  email: EmailData;
  isRegenerating: boolean;
  regenerateError?: string;
  onApprove: () => void;
  onEdit: () => void;
  onChange: (field: "subjectLine" | "previewText" | "bodyHtml", value: string) => void;
  onRegenerate: () => void;
}) {
  const approved = email.approvalStatus === "approved";

  return (
    <Card className="bg-white rounded-xl p-6 border border-pigeon-warm-rule space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pigeon-ink text-white text-sm font-bold flex items-center justify-center">
          {email.position}
        </span>
        <span className="font-sans text-sm font-semibold text-pigeon-ink">
          {TYPE_LABELS[email.emailType] ?? email.emailType}
        </span>
        {email.scheduledSendAt && (
          <span className="font-sans text-sm text-pigeon-ink-muted">
            · {fmtDate(email.scheduledSendAt)}
          </span>
        )}
        <div className="ml-auto">
          <StatusBadge status={email.approvalStatus} />
        </div>
      </div>

      {/* Subject line */}
      <input
        value={email.subjectLine}
        placeholder="Subject line…"
        onChange={(e) => onChange("subjectLine", e.target.value)}
        disabled={isRegenerating}
        className="w-full font-heading text-[18px] font-semibold text-pigeon-ink border-b border-transparent focus:border-pigeon-ink outline-none pb-1 transition-colors bg-transparent disabled:opacity-50"
      />

      {/* Preview text */}
      <input
        value={email.previewText}
        placeholder="Preview text…"
        onChange={(e) => onChange("previewText", e.target.value)}
        disabled={isRegenerating}
        className="w-full font-sans text-sm text-pigeon-ink-muted border-b border-transparent focus:border-pigeon-ink-muted outline-none pb-1 transition-colors bg-transparent disabled:opacity-50"
      />

      {/* Body — always show branded preview; editing shows textarea below when not approved */}
      <div className={cn(isRegenerating && "opacity-50 pointer-events-none")}>
        <EmailPreviewCard
          key={email.id}
          id={email.id}
          subject={email.subjectLine}
          recipient="Your subscribers"
          sender="You"
          voiceMatchScore={deriveVoiceMatchScore(email.id)}
          body={htmlToText(email.bodyHtml)}
        />
        {!approved && (
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-pigeon-ink-muted mb-1.5">Edit Body</p>
            <div className="border border-pigeon-warm-rule rounded-lg p-3 focus-within:ring-1 focus-within:ring-pigeon-ink/30 transition-shadow min-h-32">
              <BodyEditor
                key={email.id + (isRegenerating ? "-loading" : "")}
                initialHtml={email.bodyHtml}
                onChange={(html) => onChange("bodyHtml", html)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-2 border-t border-pigeon-warm-rule">
        <RegenerateButton isRegenerating={isRegenerating} onClick={onRegenerate} />
        {approved ? (
          <div className="flex items-center gap-2">
            <SuccessCheckmark size={20} />
            <span className="font-sans text-sm font-medium text-[var(--sage)]">Approved</span>
            <Button variant="ghost" size="sm" onClick={onEdit} disabled={isRegenerating}>
              <PencilIcon className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="bg-pigeon-ink hover:bg-pigeon-ink/90 text-white"
            onClick={onApprove}
            disabled={isRegenerating}
          >
            Approve ✓
          </Button>
        )}
      </div>

      {regenerateError && (
        <p className="text-xs text-pigeon-sienna">{regenerateError}</p>
      )}
    </Card>
  );
}

// ─── FinalCallCard ────────────────────────────────────────────────────────────

function FinalCallCard({
  email,
  activeTab,
  setActiveTab,
  selectedVariantId,
  setSelectedVariantId,
  isRegenerating,
  regenerateError,
  onApprove,
  onEdit,
  onRegenerate,
  onVariantChange,
}: {
  email: EmailData;
  activeTab: string;
  setActiveTab: (v: string) => void;
  selectedVariantId: string | null;
  setSelectedVariantId: (id: string) => void;
  isRegenerating: boolean;
  regenerateError?: string;
  onApprove: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  onVariantChange: (variantId: string, field: "subjectLine" | "previewText" | "bodyHtml", value: string) => void;
}) {
  const approved = email.approvalStatus === "approved";
  const activeVariant =
    email.variants.find((v) => v.variantType === activeTab) ?? email.variants[0];

  if (!activeVariant) return null;

  return (
    <Card className="bg-white rounded-xl p-6 border border-pigeon-warm-rule space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pigeon-ink text-white text-sm font-bold flex items-center justify-center">
          {email.position}
        </span>
        <span className="font-sans text-sm font-semibold text-pigeon-ink">
          {TYPE_LABELS[email.emailType] ?? email.emailType}
        </span>
        {email.scheduledSendAt && (
          <span className="font-sans text-sm text-pigeon-ink-muted">
            · {fmtDate(email.scheduledSendAt)}
          </span>
        )}
        <div className="ml-auto">
          <StatusBadge status={email.approvalStatus} />
        </div>
      </div>

      {/* Active variant content — editable fields + preview + body editor */}
      <div
        className={cn(
          "space-y-3",
          isRegenerating && "opacity-50 pointer-events-none"
        )}
      >
        <input
          key={activeVariant.id + "-subject"}
          defaultValue={activeVariant.subjectLine}
          placeholder="Subject line…"
          disabled={isRegenerating}
          onChange={(e) => onVariantChange(activeVariant.id, "subjectLine", e.target.value)}
          className="w-full font-heading text-[18px] font-semibold text-pigeon-ink border-b border-transparent focus:border-pigeon-ink outline-none pb-1 transition-colors bg-transparent disabled:opacity-50"
        />
        <input
          key={activeVariant.id + "-preview"}
          defaultValue={activeVariant.previewText}
          placeholder="Preview text…"
          disabled={isRegenerating}
          onChange={(e) => onVariantChange(activeVariant.id, "previewText", e.target.value)}
          className="w-full font-sans text-sm text-pigeon-ink-muted border-b border-transparent focus:border-pigeon-ink-muted outline-none pb-1 transition-colors bg-transparent disabled:opacity-50"
        />
        <EmailPreviewCard
          key={activeVariant.id}
          id={activeVariant.id}
          subject={activeVariant.subjectLine}
          recipient="Your subscribers"
          sender="You"
          voiceMatchScore={deriveVoiceMatchScore(activeVariant.id)}
          body={htmlToText(activeVariant.bodyHtml)}
        />
        {!approved && (
          <div className="mt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-pigeon-ink-muted mb-1.5">Edit Body</p>
            <div className="border border-pigeon-warm-rule rounded-lg p-3 focus-within:ring-1 focus-within:ring-pigeon-ink/30 transition-shadow min-h-32">
              <BodyEditor
                key={activeVariant.id + (isRegenerating ? "-loading" : "")}
                initialHtml={activeVariant.bodyHtml}
                onChange={(html) => onVariantChange(activeVariant.id, "bodyHtml", html)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Variant toggle — below body, above actions */}
      <div className="flex gap-2">
        {email.variants.map((v) => {
          const isActive = v.variantType === activeTab;
          const isDimmed = selectedVariantId !== null && selectedVariantId !== v.id;
          return (
            <Button
              key={v.variantType}
              size="default"
              variant={isActive ? "default" : "outline"}
              disabled={isRegenerating}
              className={cn(
                "flex-1",
                isActive
                  ? "bg-pigeon-ink hover:bg-pigeon-ink/90 text-white border-pigeon-ink"
                  : cn("text-pigeon-ink-muted", isDimmed && "opacity-50")
              )}
              onClick={() => setActiveTab(v.variantType)}
            >
              {VARIANT_LABELS[v.variantType] ?? v.variantType}
            </Button>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-2 border-t border-pigeon-warm-rule">
        <RegenerateButton isRegenerating={isRegenerating} onClick={onRegenerate} />
        {approved ? (
          <div className="flex items-center gap-2">
            <SuccessCheckmark size={20} />
            <span className="font-sans text-sm font-medium text-[var(--sage)]">Approved</span>
            <Button variant="ghost" size="sm" onClick={onEdit} disabled={isRegenerating}>
              <PencilIcon className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {selectedVariantId === activeVariant.id ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--sage)]">
                <SuccessCheckmark size={14} /> Selected
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={isRegenerating}
                onClick={() => setSelectedVariantId(activeVariant.id)}
              >
                Select This Variant
              </Button>
            )}
            {selectedVariantId === activeVariant.id && (
              <Button
                size="sm"
                className="bg-pigeon-ink hover:bg-pigeon-ink/90 text-white"
                disabled={isRegenerating}
                onClick={onApprove}
              >
                Approve ✓
              </Button>
            )}
          </div>
        )}
      </div>

      {regenerateError && (
        <p className="text-xs text-pigeon-sienna">{regenerateError}</p>
      )}
    </Card>
  );
}

// ─── SequenceEditorClient (root) ──────────────────────────────────────────────

interface Props {
  cohortId: string;
  programName: string;
  initialEmails: EmailData[];
}

export function SequenceEditorClient({ cohortId, programName, initialEmails }: Props) {
  const router = useRouter();
  const [emailList, setEmailList] = useState<EmailData[]>(initialEmails);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);

  // Per-email regeneration state
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [regenerateErrors, setRegenerateErrors] = useState<Map<string, string>>(new Map());

  const finalCallEmail = emailList.find((e) => e.emailType === "final_call");
  const [fcActiveTab, setFcActiveTab] = useState(
    finalCallEmail?.variants[0]?.variantType ?? "urgency_led"
  );
  const [fcSelectedVariantId, setFcSelectedVariantId] = useState<string | null>(
    finalCallEmail?.variants.find((v) => v.isSelected)?.id ?? null
  );

  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const variantSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const approvedCount = emailList.filter((e) => e.approvalStatus === "approved").length;
  const progressPct = Math.round((approvedCount / 9) * 100);

  // ── state helpers ──────────────────────────────────────────────────────────

  function updateEmail(id: string, patch: Partial<EmailData>) {
    setEmailList((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function scheduleSave(emailId: string) {
    const existing = saveTimers.current.get(emailId);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      setEmailList((current) => {
        const email = current.find((e) => e.id === emailId);
        if (email) {
          fetch(`/api/emails/${emailId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              subject_line: email.subjectLine,
              preview_text: email.previewText,
              body_html: email.bodyHtml,
              approval_status: email.approvalStatus,
            }),
          }).catch(() => toast.error("Auto-save failed"));
        }
        return current;
      });
    }, 1000);
    saveTimers.current.set(emailId, t);
  }

  function scheduleVariantSave(
    variantId: string,
    field: "subjectLine" | "previewText" | "bodyHtml",
    value: string
  ) {
    const existing = variantSaveTimers.current.get(variantId);
    if (existing) clearTimeout(existing);
    const apiField = field === "subjectLine" ? "subject_line" : field === "previewText" ? "preview_text" : "body_html";
    const t = setTimeout(() => {
      fetch(`/api/emails/variants/${variantId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [apiField]: value }),
      }).catch(() => toast.error("Auto-save failed"));
    }, 1000);
    variantSaveTimers.current.set(variantId, t);
  }

  function handleVariantChange(
    email: EmailData,
    variantId: string,
    field: "subjectLine" | "previewText" | "bodyHtml",
    value: string
  ) {
    const newStatus = email.approvalStatus === "approved" ? "edited" : email.approvalStatus;
    setEmailList((prev) =>
      prev.map((e) => {
        if (e.id !== email.id) return e;
        return {
          ...e,
          approvalStatus: newStatus,
          variants: e.variants.map((v) =>
            v.id === variantId ? { ...v, [field]: value } : v
          ),
        };
      })
    );
    scheduleVariantSave(variantId, field, value);
  }

  function handleChange(
    email: EmailData,
    field: "subjectLine" | "previewText" | "bodyHtml",
    value: string
  ) {
    const newStatus = email.approvalStatus === "approved" ? "edited" : email.approvalStatus;
    updateEmail(email.id, { [field]: value, approvalStatus: newStatus });
    scheduleSave(email.id);
  }

  async function approveEmail(email: EmailData) {
    if (email.emailType === "final_call" && !fcSelectedVariantId) {
      toast.error("Select a variant before approving");
      return;
    }
    const pending = saveTimers.current.get(email.id);
    if (pending) {
      clearTimeout(pending);
      saveTimers.current.delete(email.id);
    }
    try {
      const body =
        email.emailType === "final_call" && fcSelectedVariantId
          ? { variantId: fcSelectedVariantId }
          : {};
      const res = await fetch(`/api/emails/${email.id}/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      updateEmail(email.id, { approvalStatus: "approved" });
    } catch {
      toast.error("Failed to approve email");
    }
  }

  function editEmail(email: EmailData) {
    updateEmail(email.id, { approvalStatus: "draft" });
    fetch(`/api/emails/${email.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subject_line: email.subjectLine,
        preview_text: email.previewText,
        body_html: email.bodyHtml,
        approval_status: "draft",
      }),
    }).catch(() => toast.error("Failed to reset approval"));
  }

  async function handleRegenerate(email: EmailData) {
    setRegeneratingIds((prev) => { const s = new Set(prev); s.add(email.id); return s; });
    setRegenerateErrors((prev) => {
      const next = new Map(prev);
      next.delete(email.id);
      return next;
    });

    try {
      const res = await fetch(`/api/emails/${email.id}/regenerate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Regeneration failed");
      }
      const data = (await res.json()) as RegenerateResponse;

      const patch: Partial<EmailData> = {
        subjectLine: data.subjectLine,
        previewText: data.previewText,
        bodyHtml: data.bodyHtml,
        approvalStatus: "draft",
      };

      if (data.variants) {
        patch.variants = data.variants
          .map((v) => {
            const existing = email.variants.find((ev) => ev.variantType === v.variantType);
            return existing
              ? { ...existing, subjectLine: v.subjectLine, previewText: v.previewText, bodyHtml: v.bodyHtml }
              : null;
          })
          .filter((v): v is EmailVariant => v !== null);
      }

      updateEmail(email.id, patch);
      toast.success("Email regenerated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Regeneration failed";
      setRegenerateErrors((prev) => { const m = new Map(prev); m.set(email.id, message); return m; });
      toast.error(message);
    } finally {
      setRegeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(email.id);
        return next;
      });
    }
  }

  async function handleApproveAll() {
    setApprovingAll(true);
    try {
      await Promise.all(
        emailList.map((email) => {
          const body: Record<string, string> = {};
          if (email.emailType === "final_call" && fcSelectedVariantId) {
            body.variantId = fcSelectedVariantId;
          }
          return fetch(`/api/emails/${email.id}/approve`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
        })
      );
      setEmailList((prev) => prev.map((e) => ({ ...e, approvalStatus: "approved" })));
      setConfirmOpen(false);
      router.push(`/cohorts/${cohortId}/calendar`);
    } catch {
      toast.error("Failed to approve all emails");
      setApprovingAll(false);
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-pigeon-ink-muted hover:text-pigeon-ink transition-colors"
      >
        <ChevronLeftIcon size={14} />
        Dashboard
      </Link>
      <h1 className="font-heading text-[28px] font-bold text-pigeon-ink leading-tight">
        {programName} — Launch Sequence
      </h1>

      <Progress value={progressPct}>
        <ProgressLabel className="text-sm font-medium text-pigeon-ink-muted">
          {approvedCount} of 9 approved
        </ProgressLabel>
      </Progress>

      <div className="space-y-4">
        {emailList.map((email) =>
          email.emailType === "final_call" ? (
            <FinalCallCard
              key={email.id}
              email={email}
              activeTab={fcActiveTab}
              setActiveTab={setFcActiveTab}
              selectedVariantId={fcSelectedVariantId}
              setSelectedVariantId={setFcSelectedVariantId}
              isRegenerating={regeneratingIds.has(email.id)}
              regenerateError={regenerateErrors.get(email.id)}
              onApprove={() => approveEmail(email)}
              onEdit={() => editEmail(email)}
              onRegenerate={() => handleRegenerate(email)}
              onVariantChange={(variantId, field, value) =>
                handleVariantChange(email, variantId, field, value)
              }
            />
          ) : (
            <EmailCard
              key={email.id}
              email={email}
              isRegenerating={regeneratingIds.has(email.id)}
              regenerateError={regenerateErrors.get(email.id)}
              onApprove={() => approveEmail(email)}
              onEdit={() => editEmail(email)}
              onChange={(field, value) => handleChange(email, field, value)}
              onRegenerate={() => handleRegenerate(email)}
            />
          )
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between pt-4 border-t border-pigeon-warm-rule">
        <Button
          variant="outline"
          onClick={() => router.push(`/cohorts/${cohortId}/calendar`)}
        >
          View Calendar →
        </Button>
        <Button
          className="bg-pigeon-sienna hover:bg-pigeon-sienna/90 text-white"
          onClick={() => setConfirmOpen(true)}
        >
          Approve All
        </Button>
      </div>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open: boolean) => setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve all 9 emails?</DialogTitle>
            <DialogDescription>
              Every email in this sequence will be marked as approved. You can
              still edit and re-approve individual emails afterwards.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={approvingAll}
            >
              Cancel
            </Button>
            <Button
              className="bg-pigeon-sienna hover:bg-pigeon-sienna/90 text-white"
              onClick={handleApproveAll}
              disabled={approvingAll}
            >
              {approvingAll ? "Approving…" : "Approve All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
