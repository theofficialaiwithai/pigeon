/**
 * Seed Jordan's demo data into the Neon Postgres database.
 * Usage: npx ts-node --project tsconfig.seed.json scripts/seed-demo.ts
 *
 * Requires DATABASE_URL in .env.local
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import {
  teachers,
  cohorts,
  emailSequences,
  emails,
  emailVariants,
} from "../lib/schema";
import { buildDemoCohort } from "../app/demo/seed-data";

const DEMO_EMAIL = "jordan-demo@pigeon-demo.example";
const DEMO_CLERK_ID = "demo_jordan_clerk_id";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  const cohortData = buildDemoCohort();

  // ── 1. Upsert teacher ────────────────────────────────────────────────────
  let [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.clerkUserId, DEMO_CLERK_ID))
    .limit(1);

  if (!teacher) {
    [teacher] = await db
      .insert(teachers)
      .values({
        clerkUserId: DEMO_CLERK_ID,
        email: DEMO_EMAIL,
        name: "Jordan (Demo)",
      })
      .returning();
    console.log("Created teacher:", teacher.id);
  } else {
    console.log("Teacher already exists:", teacher.id);
  }

  // ── 2. Delete existing demo cohort if any ────────────────────────────────
  const existing = await db
    .select({ id: cohorts.id })
    .from(cohorts)
    .where(eq(cohorts.teacherId, teacher.id));

  for (const c of existing) {
    await db.delete(emailVariants).where(
      eq(emailVariants.emailId, c.id as unknown as string)
    );
    await db.delete(emails).where(eq(emails.sequenceId, c.id as unknown as string));
    await db.delete(emailSequences).where(eq(emailSequences.cohortId, c.id));
    await db.delete(cohorts).where(eq(cohorts.id, c.id));
  }

  // ── 3. Create cohort ─────────────────────────────────────────────────────
  const [cohort] = await db
    .insert(cohorts)
    .values({
      teacherId: teacher.id,
      programName: cohortData.programName,
      curriculumSummary:
        "A six-week cohort for women in leadership who are done playing small. We identify the belief gap, test the old story, and build a new default way of operating under pressure.",
      cartOpenDate: cohortData.cartOpenDate,
      cartCloseDate: cohortData.cartCloseDate,
      cohortStartDate: cohortData.cohortStartDate,
      seatCount: 20,
      priceUsd: 1200,
      status: "approved",
    })
    .returning();
  console.log("Created cohort:", cohort.id);

  // ── 4. Create sequence ───────────────────────────────────────────────────
  const [sequence] = await db
    .insert(emailSequences)
    .values({ cohortId: cohort.id })
    .returning();
  console.log("Created sequence:", sequence.id);

  // ── 5. Insert emails + variants ──────────────────────────────────────────
  for (const e of cohortData.emails) {
    const [inserted] = await db
      .insert(emails)
      .values({
        sequenceId: sequence.id,
        position: e.position,
        emailType: e.emailType,
        subjectLine: e.subjectLine,
        previewText: e.previewText,
        bodyHtml: e.bodyHtml,
        scheduledSendAt: e.scheduledSendAt ? new Date(e.scheduledSendAt) : null,
        approvalStatus: e.approvalStatus,
      })
      .returning();
    console.log(`  Email ${e.position}: ${e.subjectLine}`);

    for (const v of e.variants) {
      await db.insert(emailVariants).values({
        emailId: inserted.id,
        variantType: v.variantType,
        subjectLine: v.subjectLine,
        previewText: v.previewText,
        bodyHtml: v.bodyHtml,
        isSelected: v.variantType === "personal_note",
      });
    }
  }

  console.log("\nSeed complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
