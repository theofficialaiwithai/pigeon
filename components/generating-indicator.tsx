export function GeneratingIndicator({ label = "Generating" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="relative inline-flex h-3.5 w-3.5">
        <span className="absolute inset-0 rounded-full border-2 border-[var(--sienna-lt)]" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--sienna)] animate-spin" />
      </span>
      <span
        className="bg-[length:200%_100%] bg-clip-text text-transparent text-[13px] font-bold uppercase tracking-[0.08em] animate-[shimmer_2.2s_linear_infinite]"
        style={{ backgroundImage: "linear-gradient(110deg, var(--ink-muted) 35%, var(--sienna) 50%, var(--ink-muted) 65%)" }}
      >
        {label}
      </span>
    </div>
  );
}
