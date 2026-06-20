"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLinkIcon, Loader2Icon, XIcon } from "lucide-react";
import { SuccessCheckmark } from "@/components/success-checkmark";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  pre_launch_warmup: "Pre-Launch Warmup",
  list_primer: "List Primer",
  cart_open: "Cart Open",
  curriculum_deep_dive: "Curriculum Deep Dive",
  student_story: "Student Story",
  objection_handling: "Objection Handling",
  close_48h: "Close — 48h",
  close_24h: "Close — 24h",
  final_call: "Final Call",
};

interface EmailRow {
  id: string;
  position: number;
  emailType: string;
  subjectLine: string;
  scheduledSendAt: string | null;
  convertkitBroadcastId: string | null;
}

interface ExportResult {
  emailId: string;
  success: boolean;
  broadcastId?: string;
  error?: string;
}

interface Props {
  cohortId: string;
  programName: string;
  kitAccountName: string | null;
  webhookConnected: boolean;
  emails: EmailRow[];
  initialExported: boolean;
  initialPartial: boolean;
}

function formatDate(iso: string | null) {
  if (!iso) return "No date set";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ExportClient({
  cohortId,
  programName,
  kitAccountName,
  webhookConnected,
  emails,
  initialExported,
  initialPartial,
}: Props) {
  const [exporting, setExporting] = useState(false);
  const [results, setResults] = useState<ExportResult[] | null>(null);
  const [done, setDone] = useState(initialExported);

  const [webhookExporting, setWebhookExporting] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{ ok: boolean; message: string } | null>(null);

  const resultMap = new Map(results?.map((r) => [r.emailId, r]));

  async function handleKitExport() {
    setExporting(true);
    setResults(null);
    try {
      const res = await fetch("/api/export/convertkit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohortId }),
      });
      const data = (await res.json()) as { results?: ExportResult[]; allSucceeded?: boolean; error?: string };
      if (!res.ok) {
        setResults([{ emailId: "__global__", success: false, error: data.error ?? "Export failed" }]);
      } else {
        setResults(data.results ?? []);
        if (data.allSucceeded) setDone(true);
      }
    } catch {
      setResults([{ emailId: "__global__", success: false, error: "Network error — please try again" }]);
    } finally {
      setExporting(false);
    }
  }

  async function handleWebhookExport() {
    setWebhookExporting(true);
    setWebhookResult(null);
    try {
      const res = await fetch("/api/integrations/webhook/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohortId }),
      });
      const data = (await res.json()) as { ok?: boolean; emailCount?: number; error?: string };
      if (!res.ok || !data.ok) {
        setWebhookResult({ ok: false, message: data.error ?? "Export failed" });
      } else {
        setWebhookResult({
          ok: true,
          message: `Sent ${data.emailCount ?? emails.length} emails to your webhook. Check your Zap or Scenario to confirm.`,
        });
      }
    } catch {
      setWebhookResult({ ok: false, message: "Network error — please try again" });
    } finally {
      setWebhookExporting(false);
    }
  }

  const globalKitError = results?.find((r) => r.emailId === "__global__")?.error;

  // ── Fully exported to Kit state ─────────────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-lg space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-pigeon-ink-muted hover:text-pigeon-ink transition-colors"
        >
          ← Dashboard
        </Link>
        <div className="bg-white rounded-xl border border-pigeon-warm-rule p-8 text-center space-y-4">
          <div className="mx-auto flex items-center justify-center">
            <SuccessCheckmark size={48} />
          </div>
          <h2 className="font-heading text-lg font-semibold text-pigeon-ink">
            Exported to Kit
          </h2>
          <p className="text-sm text-pigeon-ink-muted">
            All {emails.length} emails for <strong>{programName}</strong> are
            now scheduled broadcasts in your Kit account ({kitAccountName}).
          </p>
          <a
            href="https://app.kit.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-pigeon-sienna px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            Go activate it in Kit
            <ExternalLinkIcon size={14} />
          </a>
        </div>
        {/* Still allow webhook export even after Kit export */}
        {webhookConnected && (
          <WebhookExportCard
            exporting={webhookExporting}
            result={webhookResult}
            onExport={handleWebhookExport}
          />
        )}
      </div>
    );
  }

  // ── Ready to export / partial state ────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-pigeon-ink-muted hover:text-pigeon-ink transition-colors"
      >
        ← Dashboard
      </Link>

      {/* Kit export card — only shown when Kit is connected */}
      {kitAccountName && (
        <div className="bg-white rounded-xl border border-pigeon-warm-rule p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-base font-semibold text-pigeon-ink">
                Export to Kit
              </h2>
              <p className="mt-1 text-sm text-pigeon-ink-muted">
                {programName} · Connected as{" "}
                <span className="font-medium text-gray-700">{kitAccountName}</span>
              </p>
            </div>
            <button
              onClick={handleKitExport}
              disabled={exporting}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-pigeon-ink px-5 py-2 text-sm font-semibold text-white hover:bg-pigeon-ink/90 disabled:opacity-60 transition-colors"
            >
              {exporting && <Loader2Icon size={14} className="animate-spin" />}
              {exporting ? "Exporting…" : initialPartial ? "Re-export All" : "Export All Emails"}
            </button>
          </div>

          {initialPartial && !results && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Some emails were already exported. Re-exporting will create new broadcasts for all emails.
            </p>
          )}

          {globalKitError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{globalKitError}</p>
          )}
        </div>
      )}

      {/* Webhook export card — only shown when webhook is connected */}
      {webhookConnected && (
        <WebhookExportCard
          exporting={webhookExporting}
          result={webhookResult}
          onExport={handleWebhookExport}
        />
      )}

      {/* Email list */}
      <div className="space-y-2">
        {emails.map((email) => {
          const result = resultMap.get(email.id);
          const wasAlreadyExported = !result && !!email.convertkitBroadcastId;

          return (
            <div
              key={email.id}
              className={cn(
                "bg-white rounded-xl border px-5 py-4 flex items-center gap-4",
                result?.success
                  ? "border-green-200"
                  : result && !result.success
                  ? "border-red-200"
                  : "border-pigeon-warm-rule"
              )}
            >
              <span className="w-6 shrink-0 text-center text-xs font-semibold text-pigeon-ink-muted">
                {email.position}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{email.subjectLine}</p>
                <p className="text-xs text-pigeon-ink-muted">
                  {TYPE_LABELS[email.emailType] ?? email.emailType} · {formatDate(email.scheduledSendAt)}
                </p>
                {result?.error && (
                  <p className="text-xs text-red-600 mt-0.5">{result.error}</p>
                )}
              </div>

              <div className="shrink-0">
                {exporting && !result && (
                  <Loader2Icon size={16} className="animate-spin text-pigeon-ink-muted" />
                )}
                {result?.success && <SuccessCheckmark size={20} />}
                {result && !result.success && <XIcon size={16} className="text-red-500" />}
                {wasAlreadyExported && !result && (
                  <span className="text-xs text-pigeon-ink-muted">Already exported</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Webhook export card subcomponent ────────────────────────────────────────

function WebhookExportCard({
  exporting,
  result,
  onExport,
}: {
  exporting: boolean;
  result: { ok: boolean; message: string } | null;
  onExport: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-pigeon-warm-rule p-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-base font-semibold text-pigeon-ink">
            Export via Zapier / Make
          </h2>
          <p className="mt-1 text-sm text-pigeon-ink-muted">
            Send all 9 emails as a single JSON payload to your connected webhook.
          </p>
        </div>
        <button
          onClick={onExport}
          disabled={exporting}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-pigeon-warm-rule bg-white px-5 py-2 text-sm font-semibold text-pigeon-ink hover:bg-pigeon-cream disabled:opacity-60 transition-colors"
        >
          {exporting && <Loader2Icon size={14} className="animate-spin" />}
          {exporting ? "Sending…" : "Export via Webhook"}
        </button>
      </div>

      {result && (
        <p
          className={cn(
            "text-xs rounded-lg px-3 py-2",
            result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          )}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
