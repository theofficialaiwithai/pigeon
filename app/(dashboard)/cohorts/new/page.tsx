import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { platformConnections, teachers } from "@/lib/schema";
import { CohortFormClient } from "./CohortFormClient";

export default async function NewCohortPage() {
  const { userId } = await auth();

  let hasKajabi = false;

  if (userId) {
    const [teacher] = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.clerkUserId, userId))
      .limit(1);

    if (teacher) {
      const [conn] = await db
        .select({ id: platformConnections.id })
        .from(platformConnections)
        .where(
          and(
            eq(platformConnections.teacherId, teacher.id),
            eq(platformConnections.platform, "kajabi")
          )
        )
        .limit(1);

      hasKajabi = !!conn;
    }
  }

  return <CohortFormClient hasKajabi={hasKajabi} />;
}
