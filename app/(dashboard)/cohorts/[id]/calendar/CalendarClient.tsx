"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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

interface CalendarClientProps {
  cohortId: string;
  programName: string;
  cartOpenDate: string | null;
  cartCloseDate: string | null;
  cohortStartDate: string | null;
  initialEmails: EmailState[];
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

function gapDays(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        Approved
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      Draft
    </span>
  );
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
      <span className="text-xs text-pigeon-muted">
        {days} day{days !== 1 ? "s" : ""} gap
      </span>
    </div>
  );
}

export function CalendarClient({
  cohortId,
  programName,
  cartOpenDate,
  cartCloseDate,
  cohortStartDate,
  initialEmails,
}: CalendarClientProps) {
  const router = useRouter();
  const [emailList, setEmailList] = useState<EmailState[]>(initialEmails);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<EmailState | null>(null);
  const [newDatetime, setNewDatetime] = useState("");
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="flex flex-col">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-pigeon-primary">
            {programName} — Launch Calendar
          </h1>
          <p className="text-sm text-pigeon-muted mt-1">
            {approvedCount} of {emailList.length} emails approved
          </p>
        </div>

        {/* Milestone markers */}
        {(cartOpenDate || cartCloseDate || cohortStartDate) && (
          <div className="bg-white rounded-xl border border-pigeon-border p-5">
            <p className="text-xs font-semibold text-pigeon-muted uppercase tracking-wide mb-4">
              Key Dates
            </p>
            <div className="flex items-center gap-2">
              {cartOpenDate && (
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-pigeon-accent">
                    {fmtMilestoneDate(cartOpenDate)}
                  </div>
                  <div className="text-xs text-pigeon-muted mt-0.5">Cart Open</div>
                </div>
              )}
              {cartOpenDate && cartCloseDate && (
                <div className="flex-1 h-px bg-pigeon-border" />
              )}
              {cartCloseDate && (
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-pigeon-primary">
                    {fmtMilestoneDate(cartCloseDate)}
                  </div>
                  <div className="text-xs text-pigeon-muted mt-0.5">Cart Close</div>
                </div>
              )}
              {cartCloseDate && cohortStartDate && (
                <div className="flex-1 h-px bg-pigeon-border" />
              )}
              {cohortStartDate && (
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold text-pigeon-success">
                    {fmtMilestoneDate(cohortStartDate)}
                  </div>
                  <div className="text-xs text-pigeon-muted mt-0.5">Cohort Start</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative ml-4">
          {/* Continuous vertical line */}
          <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-pigeon-border" />

          <div>
            {emailList.map((email, idx) => {
              const days = idx > 0 ? gapDays(emailList[idx - 1].scheduledSendAt, email.scheduledSendAt) : null;
              const dotColor =
                email.approvalStatus === "approved"
                  ? "bg-pigeon-success"
                  : "bg-pigeon-primary";

              return (
                <div key={email.id}>
                  {/* Gap label between cards */}
                  {idx > 0 && <GapLabel days={days} />}

                  {/* Card row */}
                  <div className="relative flex items-start">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "absolute left-0 top-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-pigeon-bg flex-shrink-0",
                        dotColor
                      )}
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
                              {email.subjectLine || (
                                <span className="text-pigeon-muted italic">No subject</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span className="text-xs text-pigeon-muted whitespace-nowrap">
                              {fmtSendAt(email.scheduledSendAt)}
                            </span>
                            <StatusBadge status={email.approvalStatus} />
                          </div>
                        </div>
                      </div>
                      <div className="px-4 pb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDateDialog(email)}
                        >
                          Change Date
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 bg-pigeon-surface border-t border-pigeon-border -mx-8 -mb-8 mt-8 px-8 py-3 flex items-center justify-between">
        <span className="text-sm text-pigeon-muted">
          <span className="font-semibold text-pigeon-primary">{approvedCount}</span> of{" "}
          {emailList.length} emails approved
        </span>
        <span
          title={!allApproved ? "Approve all emails first" : undefined}
          className="inline-block"
        >
          <Button
            disabled={!allApproved}
            className="bg-pigeon-accent text-white hover:bg-pigeon-accent/90"
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
              <p className="text-sm text-pigeon-muted">
                {TYPE_LABELS[editingEmail.emailType] ?? editingEmail.emailType}
              </p>
              <div>
                <label className="block text-xs font-medium text-pigeon-muted mb-1.5">
                  Scheduled send date &amp; time
                </label>
                <input
                  type="datetime-local"
                  value={newDatetime}
                  onChange={(e) => setNewDatetime(e.target.value)}
                  className="w-full rounded-lg border border-pigeon-border bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-pigeon-primary focus:ring-2 focus:ring-pigeon-primary/20"
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
