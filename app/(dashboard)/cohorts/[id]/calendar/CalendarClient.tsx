"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDownIcon, Loader2Icon, PauseIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { SendStatus } from "@/lib/schema";

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

interface EmailState {
  id: string;
  position: number;
  emailType: string;
  subjectLine: string;
  scheduledSendAt: string | null;
  approvalStatus: string;
}

interface SendLogEntry {
  id: string;
  emailId: string | null;
  sequencePosition: number | null;
  esp: string;
  status: string;
  errorMessage: string | null;
  sentAt: string;
}

interface CalendarClientProps {
  cohortId: string;
  programName: string;
  cartOpenDate: string | null;
  cartCloseDate: string | null;
  cohortStartDate: string | null;
  initialEmails: EmailState[];
  initialSendStatus: SendStatus;
  sendLogs: SendLogEntry[];
}

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

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

function toSlug(subject: string): string {
  return (
    subject
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "email"
  );
}

function downloadIcs(email: EmailState) {
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

function buildGoogleCalendarUrl(email: EmailState): string {
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

function buildOutlookUrl(email: EmailState): string {
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

function downloadAllIcs(emails: EmailState[], programName: string) {
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

function gapDays(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return <Badge variant="tag-sage">Approved</Badge>;
  return <Badge variant="tag-ink">Draft</Badge>;
}

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
      <span className="text-xs text-pigeon-ink-muted">
        {days} day{days !== 1 ? "s" : ""} gap
      </span>
    </div>
  );
}

function SendLogStatusBadge({ status }: { status: string }) {
  if (status === "success")
    return <Badge variant="tag-sage">Sent</Badge>;
  if (status === "failed")
    return <Badge variant="tag-red">Failed</Badge>;
  return <Badge variant="tag-ink">Skipped</Badge>;
}

export function CalendarClient({
  cohortId,
  programName,
  cartOpenDate,
  cartCloseDate,
  cohortStartDate,
  initialEmails,
  initialSendStatus,
  sendLogs,
}: CalendarClientProps) {
  const router = useRouter();
  const [emailList, setEmailList] = useState<EmailState[]>(initialEmails);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<EmailState | null>(null);
  const [newDatetime, setNewDatetime] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>(initialSendStatus);
  const [statusChanging, setStatusChanging] = useState(false);

  const approvedCount = emailList.filter((e) => e.approvalStatus === "approved").length;
  const allApproved = approvedCount === emailList.length && emailList.length > 0;

  function openDateDialog(email: EmailState) {
    setEditingEmail(email);
    setNewDatetime(email.scheduledSendAt ? toDatetimeLocal(email.scheduledSendAt) : "");
    setDialogOpen(true);
  }

  async function saveDate() {
    if (!editingEmail || !newDatetime) return;
    setSaving(true);
    try {
      const iso = new Date(newDatetime).toISOString();
      const res = await fetch(`/api/emails/${editingEmail.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scheduled_send_at: iso }),
      });
      if (!res.ok) throw new Error("Save failed");
      setEmailList((prev) =>
        prev.map((e) =>
          e.id === editingEmail.id ? { ...e, scheduledSendAt: iso } : e
        )
      );
      setDialogOpen(false);
      toast.success("Send date updated");
    } catch {
      toast.error("Failed to save date");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSendStatus() {
    const next: SendStatus = sendStatus === "active" ? "paused" : "active";
    setStatusChanging(true);
    try {
      const res = await fetch(`/api/cohorts/${cohortId}/send-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setSendStatus(next);
      toast.success(next === "paused" ? "Sends paused" : "Sends resumed");
    } catch {
      toast.error("Could not update send status");
    } finally {
      setStatusChanging(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-pigeon-ink-muted hover:text-pigeon-ink transition-colors"
        >
          ← Dashboard
        </Link>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-pigeon-ink">
              {programName} — Launch Calendar
            </h1>
            <p className="text-sm text-pigeon-ink-muted mt-1">
              {approvedCount} of {emailList.length} emails approved
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {/* Kill switch */}
            {sendStatus !== "cancelled" && (
              <Button
                variant="outline"
                size="sm"
                disabled={statusChanging}
                onClick={toggleSendStatus}
                className={cn(
                  "gap-1.5",
                  sendStatus === "paused" && "border-amber-300 text-amber-700 hover:bg-amber-50"
                )}
              >
                {statusChanging ? (
                  <Loader2Icon size={13} className="animate-spin" />
                ) : sendStatus === "active" ? (
                  <PauseIcon size={13} />
                ) : (
                  <PlayIcon size={13} />
                )}
                {sendStatus === "active" ? "Pause Sends" : "Resume Sends"}
              </Button>
            )}
            {sendStatus === "cancelled" && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                Cancelled
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={emailList.every((e) => !e.scheduledSendAt)}
              title={
                emailList.every((e) => !e.scheduledSendAt)
                  ? "Set at least one send date first"
                  : "Download all scheduled emails as a single .ics file"
              }
              onClick={() => downloadAllIcs(emailList, programName)}
            >
              Export Calendar
            </Button>
          </div>
        </div>

        {/* Paused banner */}
        {sendStatus === "paused" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Sends paused.</strong> The scheduled-send cron will skip all emails for this cohort until you resume.
          </div>
        )}

        {/* Milestone markers */}
        {(cartOpenDate || cartCloseDate || cohortStartDate) && (
          <div className="bg-white rounded-xl border border-pigeon-warm-rule p-5">
            <p className="text-xs font-semibold text-pigeon-ink-muted uppercase tracking-wide mb-4">
              Key Dates
            </p>
            <div className="flex items-center gap-2">
              {cartOpenDate && (
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-pigeon-sienna">
                    {fmtMilestoneDate(cartOpenDate)}
                  </div>
                  <div className="text-xs text-pigeon-ink-muted mt-0.5">Cart Open</div>
                </div>
              )}
              {cartOpenDate && cartCloseDate && (
                <div className="flex-1 h-px bg-pigeon-warm-rule" />
              )}
              {cartCloseDate && (
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-pigeon-ink">
                    {fmtMilestoneDate(cartCloseDate)}
                  </div>
                  <div className="text-xs text-pigeon-ink-muted mt-0.5">Cart Close</div>
                </div>
              )}
              {cartCloseDate && cohortStartDate && (
                <div className="flex-1 h-px bg-pigeon-warm-rule" />
              )}
              {cohortStartDate && (
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-pigeon-sage">
                    {fmtMilestoneDate(cohortStartDate)}
                  </div>
                  <div className="text-xs text-pigeon-ink-muted mt-0.5">Cohort Start</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative ml-4">
          {/* Continuous vertical line */}
          <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-pigeon-warm-rule" />

          <div>
            {emailList.map((email, idx) => {
              const days = idx > 0 ? gapDays(emailList[idx - 1].scheduledSendAt, email.scheduledSendAt) : null;
              const dotColor =
                email.approvalStatus === "approved"
                  ? "bg-pigeon-sage"
                  : "bg-pigeon-ink";

              return (
                <div key={email.id}>
                  {/* Gap label between cards */}
                  {idx > 0 && <GapLabel days={days} />}

                  {/* Card row */}
                  <div className="relative flex items-start">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "absolute left-0 top-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-pigeon-cream flex-shrink-0",
                        dotColor
                      )}
                    >
                      {email.position}
                    </div>

                    {/* Card */}
                    <div className="ml-12 flex-1 bg-white rounded-xl border border-pigeon-warm-rule shadow-sm mb-3 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-heading text-xs font-semibold text-pigeon-ink-muted uppercase tracking-wide mb-1">
                              {TYPE_LABELS[email.emailType] ?? email.emailType}
                            </div>
                            <div className="font-sans text-sm text-gray-800 font-medium leading-snug truncate">
                              {email.subjectLine || (
                                <span className="text-pigeon-ink-muted italic">No subject</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span className="text-xs text-pigeon-ink-muted whitespace-nowrap">
                              {fmtSendAt(email.scheduledSendAt)}
                            </span>
                            <StatusBadge status={email.approvalStatus} />
                          </div>
                        </div>
                      </div>
                      <div className="px-4 pb-3 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDateDialog(email)}
                        >
                          Change Date
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            disabled={!email.scheduledSendAt}
                            render={
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!email.scheduledSendAt}
                                title={
                                  !email.scheduledSendAt
                                    ? "Set a send date first"
                                    : "Add this send date to your calendar"
                                }
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
                </div>
              );
            })}
          </div>
        </div>
        {/* Send Log */}
        {sendLogs.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-heading text-base font-semibold text-pigeon-ink">
              Send Log
            </h2>
            <div className="overflow-hidden rounded-xl border border-pigeon-warm-rule bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pigeon-warm-rule bg-pigeon-cream">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-pigeon-ink-muted uppercase tracking-wide">
                      Email
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-pigeon-ink-muted uppercase tracking-wide">
                      Platform
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-pigeon-ink-muted uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-pigeon-ink-muted uppercase tracking-wide">
                      When
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pigeon-warm-rule">
                  {sendLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-pigeon-cream/50">
                      <td className="px-4 py-3 text-gray-800">
                        {log.sequencePosition != null
                          ? `Email ${log.sequencePosition}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">
                        {log.esp}
                      </td>
                      <td className="px-4 py-3">
                        <SendLogStatusBadge status={log.status} />
                        {log.errorMessage && (
                          <p className="mt-0.5 text-xs text-red-500 max-w-xs truncate" title={log.errorMessage}>
                            {log.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-pigeon-ink-muted whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 bg-white border-t border-pigeon-warm-rule -mx-8 -mb-8 mt-8 px-8 py-3 flex items-center justify-between">
        <span className="text-sm text-pigeon-ink-muted">
          <span className="font-semibold text-pigeon-ink">{approvedCount}</span> of{" "}
          {emailList.length} emails approved
        </span>
        <span
          title={!allApproved ? "Approve all emails first" : undefined}
          className="inline-block"
        >
          <Button
            disabled={!allApproved}
            className="bg-pigeon-sienna text-white hover:bg-pigeon-sienna/90"
            onClick={() => router.push(`/cohorts/${cohortId}/export`)}
          >
            Export to ConvertKit →
          </Button>
        </span>
      </div>

      {/* Change Date dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Send Date</DialogTitle>
          </DialogHeader>
          {editingEmail && (
            <div className="space-y-3">
              <p className="text-sm text-pigeon-ink-muted">
                {TYPE_LABELS[editingEmail.emailType] ?? editingEmail.emailType}
              </p>
              <div>
                <label className="block text-xs font-medium text-pigeon-ink-muted mb-1.5">
                  Scheduled send date &amp; time
                </label>
                <input
                  type="datetime-local"
                  value={newDatetime}
                  onChange={(e) => setNewDatetime(e.target.value)}
                  className="w-full rounded-lg border border-pigeon-warm-rule bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-pigeon-ink focus:ring-2 focus:ring-pigeon-ink/20"
                />
              </div>
            </div>
          )}
          <DialogFooter showCloseButton>
            <Button
              disabled={!newDatetime || saving}
              onClick={saveDate}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
