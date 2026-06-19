import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-pigeon-bg">
      {/* Nav */}
      <nav className="bg-white border-b border-pigeon-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-heading text-xl font-bold text-pigeon-primary">
            🐦 Pigeon
          </span>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-pigeon-primary hover:text-pigeon-primary/80 transition-colors"
          >
            Sign In →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div>
            <p className="text-sm font-semibold text-pigeon-accent uppercase tracking-wide mb-4">
              Launch email sequences, on autopilot
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-pigeon-primary leading-tight mb-6">
              9 launch emails, written in your voice, timed to your cohort.
            </h1>
            <p className="text-lg text-pigeon-muted leading-relaxed mb-6">
              Tell Pigeon about your course and dates. Paste 5 of your past
              emails. Get a complete, voice-matched 9-email launch sequence —
              ready to review and export.
            </p>
            <p className="text-sm text-pigeon-muted border-l-2 border-pigeon-accent pl-4 mb-10">
              For cohort course creators who spend too long writing launch emails
              and end up with sequences that don't sound like them.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold bg-pigeon-accent text-white hover:bg-pigeon-accent/90 transition-colors"
              >
                Try the Demo — no sign-in needed
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold border border-pigeon-border bg-white text-pigeon-primary hover:bg-pigeon-bg transition-colors"
              >
                Sign In →
              </Link>
            </div>
          </div>

          {/* Right: Inline product mockup */}
          <div className="bg-white rounded-2xl border border-pigeon-border shadow-sm overflow-hidden">
            {/* Mock toolbar */}
            <div className="px-4 py-3 border-b border-pigeon-border flex items-center gap-2 bg-pigeon-bg">
              <span className="font-heading text-xs font-semibold text-pigeon-primary uppercase tracking-wide">
                Launch Sequence — Systems for Solos
              </span>
              <span className="ml-auto text-xs text-pigeon-muted font-medium">
                9 of 9 approved
              </span>
            </div>

            {/* Mock email rows */}
            {[
              { pos: 1, type: "Pre-Launch Warmup", subject: "Something big is coming your way…", approved: true },
              { pos: 2, type: "List Primer", subject: "Are you a freelancer tired of chasing clients?", approved: true },
              { pos: 3, type: "Cart Open", subject: "Doors are open — Systems for Solos is live", approved: true },
              { pos: 4, type: "Curriculum Deep Dive", subject: "What you'll actually learn inside", approved: true },
              { pos: 5, type: "Student Story", subject: "How Priya raised her rates by 40% in 8 weeks", approved: true },
            ].map((email) => (
              <div
                key={email.pos}
                className="flex items-center gap-3 px-4 py-3 border-b border-pigeon-border last:border-b-0 hover:bg-pigeon-bg/50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-pigeon-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {email.pos}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-pigeon-muted mb-0.5">
                    {email.type}
                  </div>
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {email.subject}
                  </div>
                </div>
                {email.approved && (
                  <span className="flex-shrink-0 text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                    Approved
                  </span>
                )}
              </div>
            ))}

            <div className="px-4 py-3 bg-pigeon-bg flex items-center justify-between">
              <span className="text-xs text-pigeon-muted">+ 4 more emails in sequence</span>
              <span className="text-xs font-semibold text-pigeon-accent">
                Export to ConvertKit →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-pigeon-border py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-pigeon-primary text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Add your cohort details",
                body: "Enter your program name, curriculum, cart open/close dates, and cohort start date. Pigeon uses these to pre-time your sequence automatically.",
              },
              {
                step: "2",
                title: "Share 5 sample emails",
                body: "Paste 5 of your past emails so Pigeon can match your voice, rhythm, and style. The more authentic, the better the output.",
              },
              {
                step: "3",
                title: "Review your sequence",
                body: "Get a 9-email sequence pre-timed to your cohort calendar. Edit, approve, or regenerate each email before you export.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-pigeon-primary text-white font-heading font-extrabold text-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-pigeon-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-pigeon-muted leading-relaxed text-sm">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA strip */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-pigeon-primary mb-4">
          Ready to stop starting from scratch?
        </h2>
        <p className="text-pigeon-muted mb-8 max-w-xl mx-auto">
          Try the demo to see a full 9-email sequence, or sign in to start building yours.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold bg-pigeon-accent text-white hover:bg-pigeon-accent/90 transition-colors"
          >
            Try the Demo — no sign-in needed
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold border border-pigeon-border bg-white text-pigeon-primary hover:bg-pigeon-bg transition-colors"
          >
            Sign In →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pigeon-border py-6 text-center">
        <p className="text-xs text-pigeon-muted">
          © 2026 Pigeon. Built for cohort course creators.
        </p>
      </footer>
    </div>
  );
}
