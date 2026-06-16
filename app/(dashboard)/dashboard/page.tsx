import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PigeonMascot } from "@/components/PigeonMascot";
import { cn } from "@/lib/utils";
import { TeacherSync } from "./sync";

type CohortStatus = "draft" | "in-progress" | "approved" | "exported";

const STATUS_STYLES: Record<
  CohortStatus,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  "in-progress": { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  approved: { label: "Approved", className: "bg-green-100 text-green-700" },
  exported: { label: "Exported", className: "bg-purple-100 text-purple-700" },
};

const MOCK_COHORTS = [
  {
    id: "mock-1",
    programName: "The Bold Creator Accelerator",
    status: "draft" as CohortStatus,
    cartOpenDate: "July 1",
    cartCloseDate: "July 7",
  },
  {
    id: "mock-2",
    programName: "Zero to Launched",
    status: "approved" as CohortStatus,
    cartOpenDate: "Aug 15",
    cartCloseDate: "Aug 22",
  },
];

export default function DashboardPage() {
  const cohorts = MOCK_COHORTS;

  return (
    <>
      <TeacherSync />

      {/* Header row */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-heading text-[28px] font-bold text-gray-900">
          Your Cohorts
        </h2>
        <Link
          href="/cohorts/new"
          className={cn(
            buttonVariants(),
            "bg-pigeon-accent text-white hover:bg-orange-600"
          )}
        >
          + New Cohort
        </Link>
      </div>

      {cohorts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cohorts.map((cohort) => {
            const status = STATUS_STYLES[cohort.status] ?? STATUS_STYLES.draft;
            return (
              <Card
                key={cohort.id}
                className="rounded-xl border border-pigeon-border bg-white shadow-sm"
              >
                <CardContent className="p-6">
                  {/* Program name + status badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading text-lg font-semibold leading-snug text-gray-900">
                      {cohort.programName}
                    </h3>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Cart dates */}
                  <p className="mt-2 font-sans text-sm text-pigeon-muted">
                    Cart open: {cohort.cartOpenDate} → Cart close:{" "}
                    {cohort.cartCloseDate}
                  </p>

                  {/* Continue button */}
                  <div className="mt-5">
                    <Link
                      href={`/cohorts/${cohort.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "border-pigeon-border text-pigeon-primary hover:bg-pigeon-bg"
                      )}
                    >
                      Continue →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="mt-20 flex flex-col items-center text-center">
          <PigeonMascot pose="perched" size={64} />
          <h3 className="mt-4 font-heading text-xl font-semibold text-gray-900">
            No cohorts yet.
          </h3>
          <p className="mt-2 font-sans text-sm text-pigeon-muted">
            Start your first launch sequence.
          </p>
          <Link
            href="/cohorts/new"
            className={cn(
              buttonVariants(),
              "mt-6 bg-pigeon-accent text-white hover:bg-orange-600"
            )}
          >
            + New Cohort
          </Link>
        </div>
      )}
    </>
  );
}
