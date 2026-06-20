import { auth } from "@clerk/nextjs/server";
import { eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { cohorts, teachers, sendLog } from "@/lib/schema";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TeacherSync } from "./sync";
import { CohortList, type CohortRow } from "./CohortList";

export default async function DashboardPage() {
  const { userId } = await auth();

  let cohortRows: CohortRow[] = [];

  if (userId) {
    const [teacher] = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.clerkUserId, userId))
      .limit(1);

    if (teacher) {
      const rawCohorts = await db
        .select()
        .from(cohorts)
        .where(eq(cohorts.teacherId, teacher.id))
        .orderBy(cohorts.createdAt);

      // Determine which cohorts have any successful sends (for delete-confirm copy).
      let sentCohortIds = new Set<string>();
      if (rawCohorts.length > 0) {
        const cohortIds = rawCohorts.map((c) => c.id);
        const sentRows = await db
          .selectDistinct({ cohortId: sendLog.cohortId })
          .from(sendLog)
          .where(inArray(sendLog.cohortId, cohortIds));
        sentCohortIds = new Set(sentRows.map((r) => r.cohortId));
      }

      cohortRows = rawCohorts.map((c) => ({
        id: c.id,
        programName: c.programName,
        cartOpenDate: c.cartOpenDate,
        cartCloseDate: c.cartCloseDate,
        cohortStartDate: c.cohortStartDate,
        status: c.status,
        archivedAt: c.archivedAt ?? null,
        hasSentEmails: sentCohortIds.has(c.id),
      }));
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

      <CohortList initialCohorts={cohortRows} />
    </>
  );
}
