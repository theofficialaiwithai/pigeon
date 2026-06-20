import { eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { cohorts, emailSequences, teachers } from "@/lib/schema";
import { sendNotification } from "@/lib/notifications";
import { generateSequenceForCohort } from "@/lib/generate-sequence";
import { pendoTrack } from "@/lib/pendo-track";

export const runtime = "nodejs";
export const maxDuration = 120;

// ─── Payload extraction ───────────────────────────────────────────────────────

interface KajabiPurchase {
  offerId: string | null;
  offerTitle: string | null;
  memberEmail: string | null;
  memberName: string | null;
}

function extractKajabiPurchase(body: unknown): KajabiPurchase {
  const b = body as Record<string, unknown>;

  // Flat shape: { offer: { id, title }, member: { email, name } }
  const flatOffer = b?.offer as Record<string, unknown> | undefined;
  const flatMember = b?.member as Record<string, unknown> | undefined;
  const flatOfferId = (flatOffer?.id as string) ?? null;
  const flatOfferTitle = (flatOffer?.title as string) ?? null;
  const flatMemberEmail = (flatMember?.email as string) ?? null;
  const flatMemberName = (flatMember?.name as string) ?? null;

  if (flatOfferId || flatOfferTitle) {
    return {
      offerId: flatOfferId,
      offerTitle: flatOfferTitle,
      memberEmail: flatMemberEmail,
      memberName: flatMemberName,
    };
  }

  // JSON:API array shape: { payload: [{ type, id, attributes }] }
  const payload = b?.payload;
  if (Array.isArray(payload)) {
    const offerItem = payload.find(
      (item: unknown) => (item as Record<string, unknown>)?.type === "offers"
    ) as Record<string, unknown> | undefined;
    const customerItem = payload.find(
      (item: unknown) => (item as Record<string, unknown>)?.type === "customers"
    ) as Record<string, unknown> | undefined;

    const offerId = (offerItem?.id as string) ?? null;
    const offerAttrs = (offerItem?.attributes as Record<string, unknown>) ?? {};
    const offerTitle = (offerAttrs.title as string) ?? null;
    const customerAttrs = (customerItem?.attributes as Record<string, unknown>) ?? {};
    const memberEmail = (customerAttrs.email as string) ?? null;
    const memberName = (customerAttrs.name as string) ?? null;

    if (offerId || offerTitle) {
      return { offerId, offerTitle, memberEmail, memberName };
    }
  }

  return { offerId: null, offerTitle: null, memberEmail: null, memberName: null };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Log raw body immediately — the only reliable way to confirm the exact
  // payload shape Kajabi delivers for this webhook type.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  console.log("[webhooks/kajabi] raw body:", JSON.stringify(body));

  const { offerId, offerTitle, memberEmail, memberName } = extractKajabiPurchase(body);

  // ── Cohort lookup ───────────────────────────────────────────────────────────

  type CohortRow = typeof cohorts.$inferSelect;
  let cohort: CohortRow | undefined;

  if (offerId) {
    const [row] = await db
      .select()
      .from(cohorts)
      .where(eq(cohorts.kajabiProductId, offerId))
      .limit(1);
    cohort = row;
  }

  if (!cohort && offerTitle) {
    const [row] = await db
      .select()
      .from(cohorts)
      .where(ilike(cohorts.programName, offerTitle))
      .limit(1);
    cohort = row;
  }

  if (!cohort) {
    console.warn("[webhooks/kajabi] No cohort matched:", {
      offerId,
      offerTitle,
      memberEmail,
      memberName,
    });

    void pendoTrack({
      event: "kajabi_enrollment_received",
      visitorId: "system",
      properties: {
        offer_id: offerId,
        offer_title: offerTitle,
        member_email: memberEmail,
        member_name: memberName,
        cohort_matched: false,
      },
    });

    return Response.json({ received: true, matched: false }, { status: 200 });
  }

  // ── Enrollment processing ───────────────────────────────────────────────────

  let actionTaken = "unknown";

  try {
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, cohort.teacherId))
      .limit(1);

    const [sequence] = await db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.cohortId, cohort.id))
      .limit(1);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pigeon.app";
    const enrolleeInfo = [memberName, memberEmail].filter(Boolean).join(" — ");
    const enrolleeSuffix = enrolleeInfo ? ` (${enrolleeInfo})` : "";

    if (!sequence) {
      actionTaken = "generate_sequence";
      // No sequence yet — trigger generation now.
      await generateSequenceForCohort(cohort.id);
    } else if (sequence.status === "approved" || sequence.status === "exported") {
      actionTaken = "notify_approved";
      if (teacher) {
        void sendNotification({
          to: teacher.email,
          subject: `New enrollment in ${cohort.programName}`,
          body: `A new student just enrolled in "${cohort.programName}" via Kajabi${enrolleeSuffix}.\n\nYour email sequence is already approved — no action needed.`,
        });
      }
    } else {
      actionTaken = "notify_action_needed";
      // draft / in_progress — sequence exists but isn't approved yet.
      if (teacher) {
        void sendNotification({
          to: teacher.email,
          subject: `Action needed: new enrollment in ${cohort.programName}`,
          body: `A new student just enrolled in "${cohort.programName}" via Kajabi${enrolleeSuffix}.\n\nYour email sequence for this cohort isn't approved yet. Review and approve it here:\n${appUrl}/cohorts/${cohort.id}/sequence`,
        });
      }
    }

    void pendoTrack({
      event: "kajabi_enrollment_received",
      visitorId: teacher?.clerkUserId ?? "system",
      properties: {
        cohort_id: cohort.id,
        program_name: cohort.programName,
        member_email: memberEmail,
        member_name: memberName,
        offer_id: offerId,
        offer_title: offerTitle,
        cohort_matched: true,
        sequence_exists: !!sequence,
        sequence_status: sequence?.status ?? null,
        action_taken: actionTaken,
      },
    });
  } catch (err) {
    // Log but swallow — Kajabi must always see 200 or it will retry endlessly.
    console.error("[webhooks/kajabi] Error processing enrollment:", err);
  }

  return Response.json({ received: true, matched: true }, { status: 200 });
}
