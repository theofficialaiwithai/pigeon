import { cn } from "@/lib/utils";

type LogoVariant = "primary" | "compact" | "reversed";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
}

const Icon = ({
  size,
  stroke,
  strokeWidth,
}: {
  size: number;
  stroke: string;
  strokeWidth: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M20 4L3 11L10 14M20 4L13 21L10 14M20 4L10 14"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function Logo({ variant = "compact", className }: LogoProps) {
  if (variant === "primary") {
    return (
      <div className={cn("inline-flex items-center gap-[10px]", className)}>
        <div
          className="flex shrink-0 items-center justify-center rounded-[10px] bg-[var(--ink)]"
          style={{ width: 44, height: 44 }}
        >
          <Icon size={24} stroke="#FAF7F2" strokeWidth={1.8} />
        </div>
        <div>
          <div
            className="font-heading leading-none text-[var(--ink)]"
            style={{ fontSize: 26, letterSpacing: "-0.3px" }}
          >
            Pigeon
          </div>
          <div
            className="mt-[3px] font-sans font-bold uppercase text-[var(--ink-faint)]"
            style={{ fontSize: 9, letterSpacing: "0.14em" }}
          >
            Write in your voice
          </div>
        </div>
      </div>
    );
  }

  if (variant === "reversed") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-[10px] rounded-[10px] bg-[var(--ink)] px-[18px] py-[14px]",
          className
        )}
      >
        <div
          className="flex shrink-0 items-center justify-center rounded-[8px] bg-[var(--sienna)]"
          style={{ width: 34, height: 34 }}
        >
          <Icon size={19} stroke="#FAF0E8" strokeWidth={2} />
        </div>
        <div
          className="font-heading leading-none text-[var(--cream)]"
          style={{ fontSize: 26, letterSpacing: "-0.3px" }}
        >
          Pigeon
        </div>
      </div>
    );
  }

  // compact (default) — navbar
  return (
    <div className={cn("inline-flex items-center gap-[10px]", className)}>
      <div
        className="flex shrink-0 items-center justify-center rounded-[7px] bg-[var(--ink)]"
        style={{ width: 32, height: 32 }}
      >
        <Icon size={17} stroke="#FAF7F2" strokeWidth={2} />
      </div>
      <div
        className="font-heading leading-none text-[var(--ink)]"
        style={{ fontSize: 18, letterSpacing: "-0.3px" }}
      >
        Pigeon
      </div>
    </div>
  );
}
