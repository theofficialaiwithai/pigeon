"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreVertical, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PigeonMascot } from "@/components/PigeonMascot";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = "tag-ink" | "tag-gold" | "tag-sage";

const STATUS_STYLES: Record<string, { label: string; badgeVariant: BadgeVariant }> = {
  draft:    { label: "Draft",          badgeVariant: "tag-ink" },
  ready:    { label: "Sequence Ready", badgeVariant: "tag-gold" },
  approved: { label: "Approved",       badgeVariant: "tag-sage" },
  exported: { label: "Exported",       badgeVariant: "tag-sage" },
};

export interface CohortRow {
  id: string;
  programName: string;
  cartOpenDate: string | null;
  cartCloseDate: string | null;
  cohortStartDate: string | null;
  status: string | null;
  archivedAt: Date | null;
  hasSentEmails: boolean;
}

type Tab = "Current" | "Past" | "Archived";

// ─── Bucketing ────────────────────────────────────────────────────────────────

function bucketCohort(cohort: CohortRow): Tab {
  if (cohort.archivedAt) return "Archived";
  if (!cohort.cohortStartDate) return "Current";
  const today = new Date().toISOString().slice(0, 10);
  return cohort.cohortStartDate >= today ? "Current" : "Past";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(y, m - 1, d)
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CohortList({ initialCohorts }: { initialCohorts: CohortRow[] }) {
  const [cohorts, setCohorts] = useState<CohortRow[]>(initialCohorts);
  const [tab, setTab] = useState<Tab>("Current");
  const [deleteTarget, setDeleteTarget] = useState<CohortRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const bucketed = {
    Current:  cohorts.filter((c) => bucketCohort(c) === "Current"),
    Past:     cohorts.filter((c) => bucketCohort(c) === "Past"),
    Archived: cohorts.filter((c) => bucketCohort(c) === "Archived"),
  };
  const visible = bucketed[tab];

  // ── Archive toggle ──────────────────────────────────────────────────────────

  async function handleArchiveToggle(cohort: CohortRow) {
    const wasArchived = !!cohort.archivedAt;

    // Optimistic update
    setCohorts((prev) =>
      prev.map((c) =>
        c.id === cohort.id
          ? { ...c, archivedAt: wasArchived ? null : new Date() }
          : c
      )
    );

    try {
      const res = await fetch(`/api/cohorts/${cohort.id}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      toast.success(wasArchived ? `"${cohort.programName}" unarchived.` : `"${cohort.programName}" archived.`);
    } catch {
      // Revert on failure
      setCohorts((prev) =>
        prev.map((c) =>
          c.id === cohort.id ? { ...c, archivedAt: cohort.archivedAt } : c
        )
      );
      toast.error("Something went wrong. Please try again.");
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/cohorts/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCohorts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.programName}" deleted.`);
      setDeleteTarget(null);
    } catch {
      toast.error("Delete failed. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  // ─── Empty state ─────────────────────────────────────────────────────────────

  const totalCohorts = cohorts.length;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {totalCohorts === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center">
          <PigeonMascot pose="perched" size={64} />
          <h3 className="mt-4 font-heading text-xl font-semibold text-gray-900">
            No cohorts yet.
          </h3>
          <p className="mt-2 font-sans text-sm text-pigeon-ink-muted">
            Start your first launch sequence.
          </p>
          <Link
            href="/cohorts/new"
            className={cn(
              buttonVariants(),
              "mt-6 bg-pigeon-sienna text-white hover:bg-orange-600"
            )}
          >
            + New Cohort
          </Link>
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className="mb-6 flex">
            <div className="inline-flex rounded-full bg-pigeon-cream p-1">
              {(["Current", "Past", "Archived"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm transition-all",
                    tab === t
                      ? "bg-white text-pigeon-ink shadow-sm"
                      : "text-pigeon-ink-muted hover:text-pigeon-ink"
                  )}
                >
                  {t}
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-xs",
                      tab === t
                        ? "bg-pigeon-cream text-pigeon-ink"
                        : "text-pigeon-ink-muted"
                    )}
                  >
                    {bucketed[t].length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Cohort grid */}
          {visible.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {visible.map((cohort) => {
                const statusStyle =
                  STATUS_STYLES[cohort.status ?? "draft"] ?? STATUS_STYLES.draft;
                const isArchived = !!cohort.archivedAt;

                return (
                  <Card
                    key={cohort.id}
                    className="relative rounded-xl border border-pigeon-warm-rule bg-white shadow-sm"
                  >
                    {/* Overflow menu */}
                    <div className="absolute right-3 top-3 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-pigeon-ink-muted transition-colors hover:bg-pigeon-cream hover:text-pigeon-ink"
                              aria-label="Cohort options"
                            />
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
                          <DropdownMenuItem
                            onClick={() => handleArchiveToggle(cohort)}
                          >
                            {isArchived ? (
                              <>
                                <ArchiveRestore className="h-4 w-4" />
                                Unarchive
                              </>
                            ) : (
                              <>
                                <Archive className="h-4 w-4" />
                                Archive
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(cohort)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-3 pr-8">
                        <h3 className="font-heading text-lg font-semibold leading-snug text-gray-900">
                          {cohort.programName}
                        </h3>
                        <Badge variant={statusStyle.badgeVariant}>
                          {statusStyle.label}
                        </Badge>
                      </div>
                      <p className="mt-2 font-sans text-sm text-pigeon-ink-muted">
                        Cart open {fmtDate(cohort.cartOpenDate)} → closes{" "}
                        {fmtDate(cohort.cartCloseDate)}
                      </p>
                      {isArchived && (
                        <p className="mt-1 text-xs text-pigeon-ink-muted/70">
                          Archived
                        </p>
                      )}
                      <div className="mt-5 flex items-center gap-3">
                        <Link
                          href={`/cohorts/${cohort.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "border-pigeon-warm-rule text-pigeon-ink hover:bg-pigeon-cream"
                          )}
                        >
                          Continue →
                        </Link>
                        <Link
                          href={`/cohorts/${cohort.id}/export`}
                          className="text-xs text-pigeon-ink-muted underline underline-offset-2 transition-colors hover:text-pigeon-ink"
                        >
                          Export to Kit
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center text-center text-pigeon-ink-muted">
              <p className="text-sm">No {tab.toLowerCase()} cohorts.</p>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open: boolean) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{deleteTarget?.programName}&rdquo;?</DialogTitle>
            <DialogDescription>
              This permanently deletes {deleteTarget?.programName} and its email
              sequence. This can&apos;t be undone.
              {deleteTarget?.hasSentEmails && (
                <span className="mt-1 block">
                  Already-sent emails won&apos;t be unsent, but their record here
                  will be removed.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              autoFocus
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete cohort"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
