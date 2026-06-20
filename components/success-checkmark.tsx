export function SuccessCheckmark({ size = 56 }: { size?: number }) {
  const pad = size + 24;
  return (
    <div className="flex items-center justify-center rounded-full bg-[var(--sage-lt)]" style={{ width: pad, height: pad }}>
      <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="26" stroke="var(--sage)" strokeWidth="2"
          style={{ strokeDasharray: 163, strokeDashoffset: 163 }}
          className="animate-[draw-circle_0.6s_ease-out_forwards]" />
        <path d="M16 29l8 8 16-16" stroke="var(--sage)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 34, strokeDashoffset: 34 }}
          className="animate-[draw-check_0.4s_ease-out_0.5s_forwards]" />
      </svg>
    </div>
  );
}
