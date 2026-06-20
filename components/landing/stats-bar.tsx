"use client";
import { useInView } from "@/lib/hooks/use-in-view";
import { useCountUp } from "@/lib/hooks/use-count-up";

const STATS = [
  { stat: "9",       label: "emails per sequence" },
  { stat: "12s",     label: "average generation time" },
  { stat: "1-click", label: "export to ConvertKit" },
] as const;

function AnimatedStat({
  stat,
  label,
  inView,
}: {
  stat: string;
  label: string;
  inView: boolean;
}) {
  // Split "12s" → target=12, suffix="s". "1-click" has no leading digit run → static.
  const match = stat.match(/^(\d+)(.*)/);
  const target = match ? parseInt(match[1]) : null;
  const suffix = match ? match[2] : "";
  const count = useCountUp(target ?? 0, 700, inView && target !== null);

  return (
    <div>
      <div className="font-heading text-3xl font-extrabold text-white">
        {target !== null ? `${count}${suffix}` : stat}
      </div>
      <div className="mt-1 text-sm font-medium text-white/70">{label}</div>
    </div>
  );
}

export function StatsBar() {
  const { ref, isInView } = useInView<HTMLElement>({ threshold: 0.3 });

  return (
    <section
      ref={ref}
      className={`reveal border-y border-pigeon-warm-rule bg-pigeon-ink py-8${isInView ? " is-visible" : ""}`}
    >
      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-8 px-6 text-center">
        {STATS.map(({ stat, label }) => (
          <AnimatedStat key={stat} stat={stat} label={label} inView={isInView} />
        ))}
      </div>
    </section>
  );
}
