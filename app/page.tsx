import Link from "next/link";
import { PigeonMascot } from "@/components/PigeonMascot";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-pigeon-border bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <PigeonMascot pose="perched" size={28} />
            <span className="font-heading text-xl font-bold text-pigeon-primary">Pigeon</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-sm font-medium text-pigeon-muted hover:text-pigeon-primary transition-colors">
              Live Demo
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-pigeon-primary px-4 py-2 text-sm font-semibold text-white hover:bg-pigeon-primary/90 transition-colors"
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
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pigeon-accent/30 bg-pigeon-accent/10 px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-pigeon-accent" />
              <span className="text-xs font-semibold text-pigeon-accent">
                9 emails · your voice · your calendar
              </span>
            </div>
            <h1 className="font-heading text-4xl font-extrabold leading-tight text-pigeon-primary md:text-5xl">
              Launch emails
              <br />
              <span className="text-pigeon-accent">in your voice.</span>
              <br />
              In 12 seconds.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-pigeon-muted">
              Tell Pigeon about your cohort and paste five past emails. You get a
              complete 9-email launch sequence — voice-matched, pre-timed to your
              cart dates, and ready to export to ConvertKit.
            </p>
            <p className="mt-4 border-l-4 border-pigeon-accent pl-4 text-sm italic text-pigeon-muted">
              For cohort course creators who spend days writing launch emails and
              end up with something that doesn&apos;t sound like them anyway.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-xl bg-pigeon-accent px-7 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 transition-colors"
              >
                See Jordan&apos;s Demo Sequence →
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl border border-pigeon-border bg-white px-7 py-3.5 text-sm font-semibold text-pigeon-primary hover:bg-pigeon-bg transition-colors"
              >
                Start for Free
              </Link>
            </div>
          </div>

          {/* Right: product mockup */}
          <div className="rounded-2xl border border-pigeon-border bg-white shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-pigeon-border bg-pigeon-bg px-4 py-3">
              <span className="font-heading text-xs font-bold uppercase tracking-wide text-pigeon-primary">
                The Mindset Shift Accelerator
              </span>
              <span className="text-xs font-medium text-pigeon-muted">9 of 9 approved</span>
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
                className="flex items-center gap-3 border-b border-pigeon-border px-4 py-3 last:border-0"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pigeon-primary text-xs font-bold text-white">
                  {email.pos}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-pigeon-muted">
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
            <div className="flex items-center justify-between bg-pigeon-bg px-4 py-3">
              <span className="text-xs text-pigeon-muted">+ 4 more</span>
              <span className="text-xs font-bold text-pigeon-accent">Export to Kit →</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-pigeon-border bg-pigeon-primary py-8">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-8 px-6 text-center">
          {[
            { stat: "9", label: "emails per sequence" },
            { stat: "12s", label: "average generation time" },
            { stat: "1-click", label: "export to ConvertKit" },
          ].map(({ stat, label }) => (
            <div key={stat}>
              <div className="font-heading text-3xl font-extrabold text-white">{stat}</div>
              <div className="mt-1 text-sm font-medium text-white/70">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The problem */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="font-heading text-3xl font-extrabold text-pigeon-primary md:text-4xl">
          Writing launch emails is the worst part.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-pigeon-muted">
          You spend more time staring at a blank Notion doc than actually selling.
          Then you hire a copywriter, spend $2k, and get back something that
          doesn&apos;t sound like you. Then you rewrite it anyway.
        </p>
        <p className="mt-4 text-lg font-semibold text-pigeon-primary">
          There&apos;s a better way.
        </p>
      </section>

      {/* How it works */}
      <section className="border-y border-pigeon-border bg-pigeon-bg py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-14 text-center font-heading text-3xl font-extrabold text-pigeon-primary md:text-4xl">
            How it works
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Tell Pigeon about your cohort",
                body: "Program name, curriculum, cart open/close dates, cohort start. Pigeon auto-times every email to your calendar.",
              },
              {
                step: "2",
                title: "Paste 5 of your past emails",
                body: "Any emails — launches, newsletters, updates. Pigeon reads how you write, not what you write, to build your Voice Fingerprint.",
              },
              {
                step: "3",
                title: "Review, approve, export",
                body: "Get a 9-email sequence pre-timed to your calendar. Edit anything, approve what you love, export directly to ConvertKit.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pigeon-primary font-heading text-xl font-extrabold text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-pigeon-primary">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-pigeon-muted">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="font-heading text-3xl font-extrabold text-pigeon-primary md:text-4xl">
          See it before you commit.
        </h2>
        <p className="mt-4 text-lg text-pigeon-muted">
          Jordan&apos;s full 9-email sequence for &ldquo;The Mindset Shift Accelerator&rdquo; is live and explorable — no sign-in.
        </p>
        <Link
          href="/demo"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-pigeon-accent px-8 py-4 text-base font-bold text-white shadow-md hover:bg-orange-600 transition-colors"
        >
          Explore Jordan&apos;s Demo Sequence →
        </Link>
      </section>

      {/* Pricing */}
      <section className="border-y border-pigeon-border bg-pigeon-bg py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-heading text-3xl font-extrabold text-pigeon-primary">
            Simple, honest pricing.
          </h2>
          <p className="mt-3 text-pigeon-muted">One plan. Everything included.</p>
          <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-pigeon-border bg-white p-8 shadow-sm">
            <div className="font-heading text-5xl font-extrabold text-pigeon-primary">
              $29
              <span className="text-xl font-semibold text-pigeon-muted">/mo</span>
            </div>
            <p className="mt-2 text-sm text-pigeon-muted">Unlimited cohorts and sequences</p>
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
                  <span className="font-bold text-pigeon-accent">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up"
              className="mt-8 block rounded-xl bg-pigeon-primary py-3 text-center text-sm font-bold text-white hover:bg-pigeon-primary/90 transition-colors"
            >
              Start Free →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pigeon-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <PigeonMascot pose="perched" size={20} />
            <span className="font-heading text-sm font-bold text-pigeon-primary">Pigeon</span>
          </div>
          <p className="text-xs text-pigeon-muted">
            © 2026 Pigeon. Built for cohort course creators who launch with their whole voice.
          </p>
          <Link href="/demo" className="text-xs font-medium text-pigeon-muted underline underline-offset-2 hover:text-pigeon-primary">
            Live Demo
          </Link>
        </div>
      </footer>
    </div>
  );
}
