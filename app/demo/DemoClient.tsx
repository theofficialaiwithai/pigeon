"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type DemoCohort, type DemoEmail } from "./seed-data";

// ─── Type labels ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  pre_launch_warmup: "Pre-Launch Warmup",
  list_primer: "List Primer",
  cart_open: "Cart Open",
  curriculum_deep_dive: "Curriculum Deep Dive",
  student_story: "Student Story",
  objection_handling: "Objection Handling",
  close_48h: "Closing — 48 Hours",
  close_24h: "Closing — 24 Hours",
  final_call: "Final Call",
};

// ─── ICS helpers (copied from CalendarClient) ────────────────────────────────

function icsEscape(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n");
}

function toIcsDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function toSlug(str: string): string {
  return (
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "email"
  );
}

function buildGoogleCalendarUrl(email: DemoEmail): string {
  if (!email.scheduledSendAt) return "";
  const dtStart = toIcsDate(email.scheduledSendAt);
  const dtEnd = toIcsDate(
    new Date(new Date(email.scheduledSendAt).getTime() + 15 * 60 * 1000).toISOString()
  );
  const title = `Pigeon: Email ${email.position}: ${email.subjectLine || (TYPE_LABELS[email.emailType] ?? email.emailType)}`;
  const details = `Pigeon scheduled launch email.\nEmail ${email.position} of 9 — ${TYPE_LABELS[email.emailType] ?? email.emailType}.\nSubject: ${email.subjectLine || "(no subject)"}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${dtStart}/${dtEnd}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookUrl(email: DemoEmail): string {
  if (!email.scheduledSendAt) return "";
  const start = new Date(email.scheduledSendAt);
  const end = new Date(start.getTime() + 15 * 60 * 1000);
  const title = `Pigeon: Email ${email.position}: ${email.subjectLine || (TYPE_LABELS[email.emailType] ?? email.emailType)}`;
  const body = `Pigeon scheduled launch email. Email ${email.position} of 9 — ${TYPE_LABELS[email.emailType] ?? email.emailType}. Subject: ${email.subjectLine || "(no subject)"}`;
  const params = new URLSearchParams({
    rru: "addevent",
    subject: title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body,
    path: "/calendar/action/compose",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function downloadIcs(email: DemoEmail) {
  if (!email.scheduledSendAt) return;
  const dtStart = toIcsDate(email.scheduledSendAt);
  const dtEnd = toIcsDate(
    new Date(new Date(email.scheduledSendAt).getTime() + 15 * 60 * 1000).toISOString()
  );
  const dtstamp = toIcsDate(new Date().toISOString());
  const summary = icsEscape(
    `Pigeon: Email ${email.position}: ${email.subjectLine || (TYPE_LABELS[email.emailType] ?? email.emailType)}`
  );
  const description = icsEscape(
    `Pigeon scheduled launch email.\nEmail ${email.position} of 9 — ${TYPE_LABELS[email.emailType] ?? email.emailType}.\nSubject: ${email.subjectLine || "(no subject)"}`
  );
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pigeon//Launch Email Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:email-${email.id}@pigeon`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n") + "\r\n"], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `send-date-${toSlug(email.subjectLine || "")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadAllIcs(emails: DemoEmail[], programName: string) {
  const dtstamp = toIcsDate(new Date().toISOString());
  const vevents = emails
    .filter((e) => !!e.scheduledSendAt)
    .map((email) => {
      const dtStart = toIcsDate(email.scheduledSendAt!);
      const dtEnd = toIcsDate(
        new Date(new Date(email.scheduledSendAt!).getTime() + 15 * 60 * 1000).toISOString()
      );
      const summary = icsEscape(
        `Pigeon: Email ${email.position}: ${email.subjectLine || (TYPE_LABELS[email.emailType] ?? email.emailType)}`
      );
      const description = icsEscape(
        `Pigeon scheduled launch email.\nEmail ${email.position} of 9 — ${TYPE_LABELS[email.emailType] ?? email.emailType}.\nSubject: ${email.subjectLine || "(no subject)"}`
      );
      return [
        "BEGIN:VEVENT",
        `UID:email-${email.id}@pigeon`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT",
      ].join("\r\n");
    });
  if (vevents.length === 0) return;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pigeon//Launch Email Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...vevents,
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n") + "\r\n"], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pigeon-launch-${toSlug(programName)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

function fmtMilestoneDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function fmtSendAt(iso: string | null): string {
  if (!iso) return "No date set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function gapDays(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function stripHtmlToText(html: string): string[] {
  // Extract content from <p> tags
  const matches = html.match(/<p>([\s\S]*?)<\/p>/g) ?? [];
  return matches.map((p) =>
    p
      .replace(/<p>/g, "")
      .replace(/<\/p>/g, "")
      .replace(/<a[^>]*>([\s\S]*?)<\/a>/g, "$1")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim()
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function GapLabel({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days === 0)
    return (
      <div className="flex items-center gap-3 py-1 pl-14">
        <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
          ⚠ Same day
        </span>
      </div>
    );
  return (
    <div className="flex items-center gap-3 py-1 pl-14">
      <span className="text-xs text-pigeon-muted">
        {days} day{days !== 1 ? "s" : ""} gap
      </span>
    </div>
  );
}

// ─── Sequence email card ─────────────────────────────────────────────────────

function SequenceEmailCard({ email }: { email: DemoEmail }) {
  const [activeVariant, setActiveVariant] = useState<
    "urgency_led" | "results_led" | "personal_note"
  >("urgency_led");

  const hasVariants = email.variants.length > 0;
  const currentVariant = hasVariants
    ? email.variants.find((v) => v.variantType === activeVariant)
    : null;

  const displaySubject = currentVariant ? currentVariant.subjectLine : email.subjectLine;
  const displayPreview = currentVariant ? currentVariant.previewText : email.previewText;
  const displayBody = currentVariant ? currentVariant.bodyHtml : email.bodyHtml;
  const paragraphs = stripHtmlToText(displayBody);

  return (
    <div className="bg-white rounded-xl border border-pigeon-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-pigeon-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {email.position}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-pigeon-muted uppercase tracking-wide">
            {TYPE_LABELS[email.emailType] ?? email.emailType}
          </span>
        </div>
        <span className="flex-shrink-0 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          Approved
        </span>
      </div>

      {/* Subject + preview */}
      <div className="px-5 pb-3 border-b border-pigeon-border">
        <div className="font-heading text-lg font-semibold text-pigeon-primary leading-snug mb-1">
          {displaySubject}
        </div>
        <div className="text-sm text-pigeon-muted">{displayPreview}</div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {paragraphs.map((para, i) => (
          <p key={i} className="leading-relaxed text-gray-800 text-sm">
            {para}
          </p>
        ))}
      </div>

      {/* Variant switcher for final_call */}
      {hasVariants && (
        <div className="px-5 pb-4 border-t border-pigeon-border pt-4">
          <p className="text-xs font-semibold text-pigeon-muted uppercase tracking-wide mb-3">
            Variants
          </p>
          <div className="flex gap-2 flex-wrap">
            {(
              [
                { key: "urgency_led", label: "Urgency-Led" },
                { key: "results_led", label: "Results-Led" },
                { key: "personal_note", label: "Personal Note" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveVariant(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeVariant === key
                    ? "bg-pigeon-primary text-white"
                    : "border border-pigeon-border text-pigeon-muted hover:border-pigeon-primary/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="px-5 pb-4 flex items-center gap-2 border-t border-pigeon-border pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast("Demo mode — sign in to regenerate emails.")}
          className="text-pigeon-muted"
        >
          Regenerate
        </Button>
        <Button
          size="sm"
          onClick={() => toast("Demo mode — sign in to approve emails.")}
          className="bg-pigeon-success/10 text-pigeon-success border border-pigeon-success/30 hover:bg-pigeon-success/10"
        >
          Approve ✓
        </Button>
      </div>
    </div>
  );
}

// ─── Calendar email card ─────────────────────────────────────────────────────

function CalendarEmailCard({ email }: { email: DemoEmail }) {
  const dotColor =
    email.approvalStatus === "approved" ? "bg-pigeon-success" : "bg-pigeon-primary";

  return (
    <div className="relative flex items-start">
      {/* Timeline dot */}
      <div
        className={`absolute left-0 top-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-pigeon-bg flex-shrink-0 ${dotColor}`}
      >
        {email.position}
      </div>

      {/* Card */}
      <div className="ml-12 flex-1 bg-white rounded-xl border border-pigeon-border shadow-sm mb-3 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-heading text-xs font-semibold text-pigeon-muted uppercase tracking-wide mb-1">
                {TYPE_LABELS[email.emailType] ?? email.emailType}
              </div>
              <div className="font-sans text-sm text-gray-800 font-medium leading-snug truncate">
                {email.subjectLine}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="text-xs text-pigeon-muted whitespace-nowrap">
                {fmtSendAt(email.scheduledSendAt)}
              </span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Approved
              </span>
            </div>
          </div>
        </div>
        <div className="px-4 pb-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Sign in to change send dates"
          >
            Change Date
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  title="Add this send date to your calendar"
                />
              }
            >
              Add to Calendar
              <ChevronDownIcon className="ml-1 size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-52" align="start">
              <DropdownMenuItem
                onClick={() =>
                  window.open(buildGoogleCalendarUrl(email), "_blank")
                }
              >
                Google Calendar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  window.open(buildOutlookUrl(email), "_blank")
                }
              >
                Outlook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadIcs(email)}>
                Apple Calendar / Other (.ics)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function DemoClient({ cohort }: { cohort: DemoCohort }) {
  const [activeTab, setActiveTab] = useState<"sequence" | "calendar">(
    "sequence"
  );

  const approvedCount = cohort.emails.filter(
    (e) => e.approvalStatus === "approved"
  ).length;

  return (
    <div className="min-h-screen bg-pigeon-bg">
      {/* Top nav */}
      <nav className="bg-white border-b border-pigeon-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg font-bold text-pigeon-primary">
            🐦 Pigeon
          </span>
          <span className="inline-flex items-center rounded-full bg-pigeon-accent/10 text-pigeon-accent px-2.5 py-0.5 text-xs font-semibold">
            Demo Mode
          </span>
        </div>
        <Link
          href="/sign-in"
          className="text-sm font-medium text-pigeon-primary hover:text-pigeon-primary/80 transition-colors"
        >
          Sign in to create your own →
        </Link>
      </nav>

      {/* Demo banner */}
      <div className="bg-pigeon-primary/5 border-b border-pigeon-primary/20 px-6 py-2 text-center">
        <p className="text-sm text-pigeon-primary">
          You&apos;re viewing a read-only demo of the Systems for Solos launch
          sequence.{" "}
          <Link
            href="/sign-in"
            className="underline underline-offset-2 font-semibold"
          >
            Sign in to build your own. →
          </Link>
        </p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Program header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-extrabold text-pigeon-primary">
            {cohort.programName}
          </h1>
          <p className="text-sm text-pigeon-muted mt-1">
            Cart open {fmtMilestoneDate(cohort.cartOpenDate)} · Closes{" "}
            {fmtMilestoneDate(cohort.cartCloseDate)} · Cohort starts{" "}
            {fmtMilestoneDate(cohort.cohortStartDate)}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-6 border-b border-pigeon-border mb-6">
          <button
            onClick={() => setActiveTab("sequence")}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === "sequence"
                ? "border-b-2 border-pigeon-primary text-pigeon-primary"
                : "text-pigeon-muted hover:text-gray-700"
            }`}
          >
            Sequence Editor
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === "calendar"
                ? "border-b-2 border-pigeon-primary text-pigeon-primary"
                : "text-pigeon-muted hover:text-gray-700"
            }`}
          >
            Launch Calendar
          </button>
        </div>

        {/* ── Sequence tab ── */}
        {activeTab === "sequence" && (
          <div>
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-pigeon-muted">
                <span className="font-semibold text-pigeon-primary">
                  {approvedCount}
                </span>{" "}
                of {cohort.emails.length} emails approved
              </span>
              <Button
                size="sm"
                disabled
                title="Demo mode — sign in to use this feature"
                className="bg-pigeon-success/10 text-pigeon-success border border-pigeon-success/30"
              >
                Approve All
              </Button>
            </div>

            {/* Email cards */}
            <div className="space-y-4">
              {cohort.emails.map((email, idx) => {
                const days =
                  idx > 0
                    ? gapDays(
                        cohort.emails[idx - 1].scheduledSendAt,
                        email.scheduledSendAt
                      )
                    : null;
                return (
                  <div key={email.id}>
                    {idx > 0 && (
                      <div className="flex items-center gap-3 py-1 px-1 mb-1">
                        {days !== null && (
                          <span className="text-xs text-pigeon-muted">
                            {days === 0
                              ? "⚠ Same day"
                              : `${days} day${days !== 1 ? "s" : ""} gap`}
                          </span>
                        )}
                      </div>
                    )}
                    <SequenceEmailCard email={email} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Calendar tab ── */}
        {activeTab === "calendar" && (
          <div>
            {/* Disclaimer */}
            <p className="text-xs text-pigeon-muted mb-5 text-center italic">
              This is a demo calendar — send dates are for illustration only.
            </p>

            {/* Key dates */}
            <div className="bg-white rounded-xl border border-pigeon-border p-5 mb-6">
              <p className="text-xs font-semibold text-pigeon-muted uppercase tracking-wide mb-4">
                Key Dates
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-pigeon-accent">
                    {fmtMilestoneDate(cohort.cartOpenDate)}
                  </div>
                  <div className="text-xs text-pigeon-muted mt-0.5">Cart Open</div>
                </div>
                <div className="flex-1 h-px bg-pigeon-border" />
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-pigeon-primary">
                    {fmtMilestoneDate(cohort.cartCloseDate)}
                  </div>
                  <div className="text-xs text-pigeon-muted mt-0.5">Cart Close</div>
                </div>
                <div className="flex-1 h-px bg-pigeon-border" />
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-pigeon-success">
                    {fmtMilestoneDate(cohort.cohortStartDate)}
                  </div>
                  <div className="text-xs text-pigeon-muted mt-0.5">Cohort Start</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative ml-4">
              {/* Continuous vertical line */}
              <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-pigeon-border" />

              <div>
                {cohort.emails.map((email, idx) => {
                  const days =
                    idx > 0
                      ? gapDays(
                          cohort.emails[idx - 1].scheduledSendAt,
                          email.scheduledSendAt
                        )
                      : null;
                  return (
                    <div key={email.id}>
                      {idx > 0 && <GapLabel days={days} />}
                      <CalendarEmailCard email={email} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sticky bottom bar */}
            <div className="sticky bottom-0 bg-pigeon-surface border-t border-pigeon-border -mx-4 mt-8 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-pigeon-muted">
                <span className="font-semibold text-pigeon-primary">
                  {approvedCount}
                </span>{" "}
                of {cohort.emails.length} emails approved
              </span>
              <Button
                className="bg-pigeon-accent text-white hover:bg-pigeon-accent/90"
                onClick={() => downloadAllIcs(cohort.emails, cohort.programName)}
              >
                Export Full Launch Calendar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
