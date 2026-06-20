"use client";
import { useInView } from "@/lib/hooks/use-in-view";

// ─── CalendarVisual ────────────────────────────────────────────────────────────

const CALENDAR_ROWS: { label: string; chip: "sienna" | "sage" | null }[] = [
  { label: "Jun 1",                   chip: null },
  { label: "Jun 3",                   chip: null },
  { label: "Jun 8",                   chip: null },
  { label: "Jun 10",                  chip: null },
  { label: "Cart Opens · Jun 15",     chip: "sienna" },
  { label: "Cohort Starts · Jun 22",  chip: "sage" },
];

export function CalendarVisual() {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.25 });

  return (
    <div
      ref={ref}
      className="h-56 overflow-hidden rounded-2xl border border-pigeon-warm-rule bg-[var(--parchment)]"
      style={{
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%)",
        maskImage:        "linear-gradient(to bottom, transparent 0%, black 30%)",
      }}
    >
      <div className="flex flex-col gap-2.5 px-5 pt-5">
        {CALENDAR_ROWS.map(({ label, chip }, i) => (
          <div
            key={label}
            style={{
              opacity:    isInView ? 1 : 0,
              transform:  isInView ? "translateY(0)" : "translateY(8px)",
              transition: `opacity 0.4s ease ${i * 80}ms, transform 0.4s ease ${i * 80}ms`,
            }}
          >
            {chip === "sienna" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sienna-lt)] px-3 py-1 text-xs font-semibold text-[var(--sienna)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--sienna)]" />
                {label}
              </span>
            ) : chip === "sage" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sage-lt)] px-3 py-1 text-xs font-semibold text-[var(--sage)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--sage)]" />
                {label}
              </span>
            ) : (
              <span className="text-xs text-[var(--ink-faint)]">{label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VoiceFingerprintVisual ────────────────────────────────────────────────────

// Three email-snippet cards fanned from a flat stack on scroll-into-view.
// Back two are blurred / dimmed; front card is sharp.
const FAN_CARDS = [
  { rotate: -8, tx: -14, opacity: 0.65, blur: true,  z: 1, delay: 0   },
  { rotate:  0, tx:   0, opacity: 0.72, blur: true,  z: 2, delay: 90  },
  { rotate:  8, tx:  14, opacity: 1.0,  blur: false, z: 3, delay: 180 },
] as const;

export function VoiceFingerprintVisual() {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.25 });

  return (
    <div
      ref={ref}
      className="relative h-56 overflow-hidden rounded-2xl border border-pigeon-warm-rule bg-[var(--parchment)]"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(226,217,205,0.9) 1px, transparent 1px)",
        backgroundSize:  "16px 16px",
      }}
    >
      {/* Fanned cards */}
      <div className="absolute inset-0 flex items-center justify-center">
        {FAN_CARDS.map(({ rotate, tx, opacity, blur, z, delay }) => (
          <div
            key={rotate}
            className="absolute w-36 rounded-lg bg-white p-3 shadow-sm"
            style={{
              opacity,
              zIndex: z,
              filter: blur ? "blur(1px)" : "none",
              transform: isInView
                ? `rotate(${rotate}deg) translateX(${tx}px)`
                : "rotate(0deg) translateX(0px)",
              transition: `transform 0.6s ease-out ${delay}ms`,
            }}
          >
            <div className="mb-1.5 h-2    w-3/4 rounded bg-gray-100" />
            <div className="mb-1   h-1.5  w-full rounded bg-gray-100" />
            <div className=        "h-1.5 w-2/3  rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Voice-match badge — fades in after fan completes */}
      <div
        className="absolute bottom-4 right-4 z-20 rounded-full bg-[var(--sienna)] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm"
        style={{
          opacity:    isInView ? 1 : 0,
          transform:  isInView ? "scale(1)" : "scale(0.8)",
          transition: `opacity 0.25s ease ${isInView ? "640ms" : "0ms"},
                       transform 0.25s ease ${isInView ? "640ms" : "0ms"}`,
        }}
      >
        94% Voice Match
      </div>
    </div>
  );
}

// ─── ExportReadyVisual ─────────────────────────────────────────────────────────

export function ExportReadyVisual() {
  return (
    <div className="relative h-56 overflow-hidden rounded-2xl border border-pigeon-warm-rule bg-[var(--parchment)]">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-5">
        {/* Back notification — blurred depth layer */}
        <div
          className="w-full rounded-xl bg-white px-4 py-3 shadow-sm"
          style={{
            opacity: 0.58,
            filter:  "blur(1px)",
            transform: "translateY(-6px) scaleX(0.96)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-lg" style={{ background: "var(--sage)" }} />
            <div>
              <div className="text-xs font-semibold text-[var(--ink)]">Sequence exported</div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-faint)]">ConvertKit · Jun 20</div>
            </div>
          </div>
        </div>

        {/* Front notification — bobs gently */}
        <div className="card-bob relative z-10 -mt-1 w-full rounded-xl bg-white px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-lg" style={{ background: "var(--sienna)" }} />
            <div>
              <div className="text-xs font-semibold text-[var(--ink)]">9 of 9 approved</div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-faint)]">Ready to send</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
