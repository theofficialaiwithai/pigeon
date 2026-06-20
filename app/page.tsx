import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Logo } from "@/components/logo";
import { RevealSection } from "@/components/landing/reveal-section";
import { StatsBar } from "@/components/landing/stats-bar";
import {
  CalendarVisual,
  VoiceFingerprintVisual,
  ExportReadyVisual,
} from "@/components/landing/how-it-works-visuals";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-pigeon-warm-rule bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo variant="compact" />
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-sm font-medium text-pigeon-ink-muted hover:text-pigeon-ink transition-colors">
              Live Demo
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-pigeon-ink px-4 py-2 text-sm font-semibold text-white hover:bg-pigeon-ink/90 transition-colors"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:items-center">
          {/* Left: copy */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pigeon-sienna/30 bg-pigeon-sienna/10 px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-pigeon-sienna" />
              <span className="text-xs font-semibold text-pigeon-sienna">
                9 emails · your voice · your calendar
              </span>
            </div>
            <h1 className="font-heading text-4xl font-extrabold leading-tight text-pigeon-ink md:text-5xl">
              Launch emails
              <br />
              <span className="text-pigeon-sienna">in your voice.</span>
              <br />
              In 12 seconds.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-pigeon-ink-muted">
              Tell Pigeon about your cohort and paste five past emails. You get a
              complete 9-email launch sequence — voice-matched, pre-timed to your
              cart dates, and ready to export to ConvertKit.
            </p>
            <p className="mt-4 border-l-4 border-pigeon-sienna pl-4 text-sm italic text-pigeon-ink-muted">
              For cohort course creators who spend days writing launch emails and
              end up with something that doesn&apos;t sound like them anyway.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-xl bg-pigeon-sienna px-7 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 transition-colors"
              >
                See Jordan&apos;s Demo Sequence →
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl border border-pigeon-warm-rule bg-white px-7 py-3.5 text-sm font-semibold text-pigeon-ink hover:bg-pigeon-cream transition-colors"
              >
                Start for Free
              </Link>
            </div>
          </div>

          {/* Right: product mockup + floating chips */}
          <div className="relative">
            {/* Floating chip — top-right, sage */}
            <div
              className="chip-float pointer-events-none absolute -right-4 -top-5 z-10 hidden items-center gap-1.5 rounded-full border border-pigeon-sage/25 bg-white px-3 py-1.5 text-xs font-semibold text-pigeon-sage shadow-md md:flex"
            >
              ✓ Voice-matched
            </div>
            {/* Floating chip — bottom-left, sienna */}
            <div
              className="chip-float pointer-events-none absolute -bottom-5 -left-4 z-10 hidden items-center gap-1.5 rounded-full border border-pigeon-sienna/25 bg-white px-3 py-1.5 text-xs font-semibold text-pigeon-sienna shadow-md md:flex"
              style={{ animationDelay: "1.5s" }}
            >
              ⚡ 12s to draft
            </div>

            <div className="rounded-2xl border border-pigeon-warm-rule bg-white shadow-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-pigeon-warm-rule bg-pigeon-cream px-4 py-3">
                <span className="font-heading text-xs font-bold uppercase tracking-wide text-pigeon-ink">
                  The Mindset Shift Accelerator
                </span>
                <span className="text-xs font-medium text-pigeon-ink-muted">9 of 9 approved</span>
              </div>
              {[
                { pos: 1, type: "Pre-Launch Warmup", subject: "I want to ask you something." },
                { pos: 2, type: "List Primer", subject: "Who this is for (and who it isn't)." },
                { pos: 3, type: "Cart Open", subject: "The door opens today." },
                { pos: 4, type: "Curriculum Deep Dive", subject: "What actually happens inside." },
                { pos: 5, type: "Student Story", subject: "Amara went quiet in every meeting. Then she didn't." },
              ].map((email) => (
                <div
                  key={email.pos}
                  className="flex items-center gap-3 border-b border-pigeon-warm-rule px-4 py-3 last:border-0"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pigeon-ink text-xs font-bold text-white">
                    {email.pos}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-pigeon-ink-muted">
                      {email.type}
                    </div>
                    <div className="truncate text-sm font-medium text-gray-800">
                      {email.subject}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                    ✓
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-pigeon-cream px-4 py-3">
                <span className="text-xs text-pigeon-ink-muted">+ 4 more</span>
                <span className="text-xs font-bold text-pigeon-sienna">Export to Kit →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar — client component handles reveal + count-up */}
      <StatsBar />

      {/* The problem */}
      <RevealSection>
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-heading text-3xl font-extrabold text-pigeon-ink md:text-4xl">
            Writing launch emails is the worst part.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-pigeon-ink-muted">
            You spend more time staring at a blank Notion doc than actually selling.
            Then you hire a copywriter, spend $2k, and get back something that
            doesn&apos;t sound like you. Then you rewrite it anyway.
          </p>
          <p className="mt-4 text-lg font-semibold text-pigeon-ink">
            There&apos;s a better way.
          </p>
        </section>
      </RevealSection>

      {/* How it works — bento card version */}
      <RevealSection>
        <section className="border-y border-pigeon-warm-rule bg-pigeon-cream py-24">
          <div className="mx-auto max-w-6xl px-6">

            {/* Section header */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-pigeon-warm-rule bg-white px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-pigeon-ink" />
                <span className="text-xs font-semibold text-pigeon-ink-muted">How it works</span>
              </div>
            </div>
            <h2 className="mb-4 text-center font-heading text-3xl font-extrabold text-pigeon-ink md:text-4xl">
              From blank page to{" "}
              <span className="text-pigeon-sienna">launch-ready</span>
              {" "}— in three steps.
            </h2>
            <p className="mx-auto mb-16 max-w-xl text-center text-base text-pigeon-ink-muted">
              Tell Pigeon about your cohort, paste a few past emails, and review
              what comes back — already timed to your calendar.
            </p>

            {/* Bento grid */}
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">

              {/* Step 1 */}
              <div>
                <CalendarVisual />
                <h4 className="mt-6 font-heading text-lg text-pigeon-ink">
                  Tell Pigeon about your cohort
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-pigeon-ink-muted">
                  Program name, curriculum, cart open/close dates, cohort start.
                  Pigeon auto-times every email to your calendar.
                </p>
              </div>

              {/* Step 2 */}
              <div>
                <VoiceFingerprintVisual />
                <h4 className="mt-6 font-heading text-lg text-pigeon-ink">
                  Paste 5 of your past emails
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-pigeon-ink-muted">
                  Any emails — launches, newsletters, updates. Pigeon reads how
                  you write, not what you write, to build your Voice Fingerprint.
                </p>
              </div>

              {/* Step 3 */}
              <div>
                <ExportReadyVisual />
                <h4 className="mt-6 font-heading text-lg text-pigeon-ink">
                  Review, approve, export
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-pigeon-ink-muted">
                  Get a 9-email sequence pre-timed to your calendar. Edit
                  anything, approve what you love, export directly to ConvertKit.
                </p>
              </div>

            </div>
          </div>
        </section>
      </RevealSection>

      {/* Demo CTA */}
      <RevealSection>
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-heading text-3xl font-extrabold text-pigeon-ink md:text-4xl">
            See it before you commit.
          </h2>
          <p className="mt-4 text-lg text-pigeon-ink-muted">
            Jordan&apos;s full 9-email sequence for &ldquo;The Mindset Shift Accelerator&rdquo; is live and explorable — no sign-in.
          </p>
          <Link
            href="/demo"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-pigeon-sienna px-8 py-4 text-base font-bold text-white shadow-md hover:bg-orange-600 transition-colors"
          >
            Explore Jordan&apos;s Demo Sequence →
          </Link>
        </section>
      </RevealSection>

      {/* Pricing */}
      <RevealSection>
        <section className="border-y border-pigeon-warm-rule bg-pigeon-cream py-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="font-heading text-3xl font-extrabold text-pigeon-ink">
              Simple, honest pricing.
            </h2>
            <p className="mt-3 text-pigeon-ink-muted">One plan. Everything included.</p>
            <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-pigeon-warm-rule bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="font-heading text-5xl font-extrabold text-pigeon-ink">
                $29
                <span className="text-xl font-semibold text-pigeon-ink-muted">/mo</span>
              </div>
              <p className="mt-2 text-sm text-pigeon-ink-muted">Unlimited cohorts and sequences</p>
              <ul className="mt-6 space-y-3 text-left text-sm text-gray-700">
                {[
                  "Unlimited email sequences",
                  "Voice Fingerprint analysis",
                  "ConvertKit (Kit) export",
                  "Kajabi product import",
                  "Daily digest reminders",
                  "Launch Calendar view",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="font-bold text-pigeon-sienna">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block rounded-xl bg-pigeon-ink py-3 text-center text-sm font-bold text-white hover:bg-pigeon-ink/90 transition-colors"
              >
                Start Free →
              </Link>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Footer */}
      <footer className="border-t border-pigeon-warm-rule py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo variant="compact" />
          <p className="text-xs text-pigeon-ink-muted">
            © 2026 Pigeon. Built for cohort course creators who launch with their whole voice.
          </p>
          <Link href="/demo" className="text-xs font-medium text-pigeon-ink-muted underline underline-offset-2 hover:text-pigeon-ink">
            Live Demo
          </Link>
        </div>
      </footer>
    </div>
  );
}
