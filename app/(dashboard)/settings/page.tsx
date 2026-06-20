import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { platformConnections, teachers } from "@/lib/schema";
import { KajabiConnectCard } from "./KajabiConnectCard";
import { KitConnectCard } from "./KitConnectCard";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-pigeon-border p-6 space-y-5">
      <div>
        <h2 className="font-heading text-base font-semibold text-pigeon-primary">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-pigeon-muted">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
      <span className="w-36 shrink-0 text-sm font-medium text-pigeon-muted pt-0.5">
        {label}
      </span>
      <div className="flex-1 text-sm text-gray-800">{children}</div>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ok
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {ok ? "✓" : "!"} {label}
    </span>
  );
}

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);

  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    teacher?.email ??
    "—";

  const name =
    clerkUser?.fullName ??
    teacher?.name ??
    "—";

  const timezone = teacher?.timezone ?? "America/New_York";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://pigeon-gold.vercel.app";
  const webhookUrl = `${appUrl}/api/webhooks/kajabi`;

  const resendConfigured = !!(
    process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
  );

  // Fetch both platform connections in parallel
  const [kajabiConn, kitConn] = await Promise.all([
    teacher
      ? db
          .select({ accountName: platformConnections.accountName })
          .from(platformConnections)
          .where(
            and(
              eq(platformConnections.teacherId, teacher.id),
              eq(platformConnections.platform, "kajabi")
            )
          )
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    teacher
      ? db
          .select({ accountName: platformConnections.accountName })
          .from(platformConnections)
          .where(
            and(
              eq(platformConnections.teacherId, teacher.id),
              eq(platformConnections.platform, "convertkit")
            )
          )
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Account */}
      <Section title="Account">
        <Row label="Name">{name}</Row>
        <Row label="Email">{email}</Row>
        <Row label="Timezone">
          <form action="/api/settings/timezone" method="POST" className="flex items-center gap-3">
            <select
              name="timezone"
              defaultValue={timezone}
              className="rounded-lg border border-pigeon-border bg-white px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-pigeon-primary focus:ring-2 focus:ring-pigeon-primary/20"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-pigeon-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-pigeon-primary/90 transition-colors"
            >
              Save
            </button>
          </form>
          <p className="mt-1.5 text-xs text-pigeon-muted">
            Used to schedule your launch emails at 9 AM in this timezone.
          </p>
        </Row>
      </Section>

      {/* Notifications */}
      <Section title="Email Notifications">
        <Row label="Status">
          <StatusPill
            ok={resendConfigured}
            label={resendConfigured ? "Configured" : "Not configured"}
          />
        </Row>
        {!resendConfigured && (
          <Row label="">
            <p className="text-xs text-pigeon-muted leading-relaxed">
              Set <code className="font-mono bg-gray-100 px-1 rounded">RESEND_API_KEY</code> and{" "}
              <code className="font-mono bg-gray-100 px-1 rounded">RESEND_FROM_EMAIL</code> in
              your Vercel project environment variables to enable notifications when sequences are
              generated and when students enroll via Kajabi.
            </p>
          </Row>
        )}
        {resendConfigured && (
          <Row label="Sending from">
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
              {process.env.RESEND_FROM_EMAIL}
            </span>
          </Row>
        )}
      </Section>

      {/* Kajabi — featured first */}
      <Section
        title="Connect Kajabi"
        description="Import your programs automatically. Pigeon reads your Kajabi product library and fills your cohort details for you."
      >
        <Row label="API Credentials">
          <KajabiConnectCard initialAccountName={kajabiConn?.accountName ?? null} />
        </Row>
        <Row label="Enrollment webhook">
          <div className="space-y-2">
            <code className="block rounded-lg bg-gray-50 border border-pigeon-border px-3 py-2 text-xs font-mono text-gray-700 break-all">
              {webhookUrl}
            </code>
            <p className="text-xs text-pigeon-muted leading-relaxed">
              In Kajabi: <strong>Settings → Integrations → Webhooks</strong>.
              Add this URL and select the <strong>Purchase</strong> event. Pigeon
              will auto-generate a sequence when a new student enrolls, or notify
              you if one already exists.
            </p>
          </div>
        </Row>
      </Section>

      {/* Kit */}
      <Section title="Kit (ConvertKit) Integration">
        <Row label="Kit API Key">
          <KitConnectCard initialAccountName={kitConn?.accountName ?? null} />
        </Row>
      </Section>
    </div>
  );
}
