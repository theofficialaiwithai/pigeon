import { SignUp } from "@clerk/nextjs";

// Flight-path path from components/logo.tsx — kept in sync by referencing the same string
const PLANE_PATH = "M20 4L3 11L10 14M20 4L13 21L10 14M20 4L10 14";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--parchment)]">

      {/* ── Ambient background layer ──────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">

          {/* ── Paper planes ─────────────────────────────────────────────────── */}

          {/* Plane 1 — top-left, sienna, 38 px */}
          <g
            transform="translate(7%, 10%)"
            opacity="0.09"
            className="auth-bg-el"
            style={{ '--drift-dur': '28s', '--drift-delay': '0s' } as React.CSSProperties}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
              <path d={PLANE_PATH} stroke="var(--sienna)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </g>

          {/* Plane 2 — upper-right, sienna, 26 px */}
          <g
            transform="translate(88%, 16%)"
            opacity="0.10"
            className="auth-bg-el"
            style={{ '--drift-dur': '33s', '--drift-delay': '9s' } as React.CSSProperties}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d={PLANE_PATH} stroke="var(--sienna)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </g>

          {/* Plane 3 — bottom-right, sage, 22 px */}
          <g
            transform="translate(91%, 78%)"
            opacity="0.09"
            className="auth-bg-el"
            style={{ '--drift-dur': '38s', '--drift-delay': '18s' } as React.CSSProperties}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d={PLANE_PATH} stroke="var(--sage)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </g>

          {/* ── Envelopes ────────────────────────────────────────────────────── */}

          {/* Envelope 1 — center-left, ink-faint, 34 px */}
          <g
            transform="translate(4%, 50%)"
            opacity="0.09"
            className="auth-bg-el"
            style={{ '--drift-dur': '25s', '--drift-delay': '4s' } as React.CSSProperties}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="1" stroke="var(--ink-faint)" strokeWidth="1.5" />
              <path d="M2 5l10 9 10-9" stroke="var(--ink-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </g>

          {/* Envelope 2 — lower-left, ink-faint, 26 px */}
          <g
            transform="translate(15%, 80%)"
            opacity="0.08"
            className="auth-bg-el"
            style={{ '--drift-dur': '30s', '--drift-delay': '14s' } as React.CSSProperties}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="1" stroke="var(--ink-faint)" strokeWidth="1.5" />
              <path d="M2 5l10 9 10-9" stroke="var(--ink-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </g>

        </svg>
      </div>

      {/* ── Clerk card ───────────────────────────────────────────────────────── */}
      <div className="relative z-10">
        <SignUp fallbackRedirectUrl="/dashboard" signInUrl="/sign-in" />
      </div>

    </div>
  );
}
