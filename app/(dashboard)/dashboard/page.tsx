import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { cohorts, teachers } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PigeonMascot } from "@/components/PigeonMascot";
import { cn } from "@/lib/utils";
import { TeacherSync } from "./sync";

type BadgeVariant = "tag-ink" | "tag-gold" | "tag-sage";
const STATUS_STYLES: Record<string, { label: string; badgeVariant: BadgeVariant }> = {
  draft:    { label: "Draft",           badgeVariant: "tag-ink" },
  ready:    { label: "Sequence Ready",  badgeVariant: "tag-gold" },
  approved: { label: "Approved",        badgeVariant: "tag-sage" },
  exported: { label: "Exported",        badgeVariant: "tag-sage" },
};

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(y, m - 1, d)
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();

  let cohortList: (typeof cohorts.$inferSelect)[] = [];

  if (userId) {
    const [teacher] = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.clerkUserId, userId))
      .limit(1);

    if (teacher) {
      cohortList = await db
        .select()
        .from(cohorts)
        .where(eq(cohorts.teacherId, teacher.id))
        .orderBy(cohorts.createdAt);
    }
  }

  return (
    <>
      <TeacherSync />

      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-heading text-[28px] font-bold text-gray-900">
          Your Cohorts
        </h2>
        <Link
          href="/cohorts/new"
          className={cn(
            buttonVariants(),
            "bg-pigeon-sienna text-white hover:bg-orange-600"
          )}
        >
          + New Cohort
        </Link>
      </div>

      {cohortList.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cohortList.map((cohort) => {
            const status =
              STATUS_STYLES[cohort.status ?? "draft"] ?? STATUS_STYLES.draft;
            return (
              <Card
                key={cohort.id}
                className="rounded-xl border border-pigeon-warm-rule bg-white shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading text-lg font-semibold leading-snug text-gray-900">
                      {cohort.programName}
                    </h3>
                    <Badge variant={status.badgeVariant}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="mt-2 font-sans text-sm text-pigeon-ink-muted">
                    Cart open {fmtDate(cohort.cartOpenDate)} → closes{" "}
                    {fmtDate(cohort.cartCloseDate)}
                  </p>
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
                      className="text-xs text-pigeon-ink-muted hover:text-pigeon-ink underline underline-offset-2 transition-colors"
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
      )}
    </>
  );
}
