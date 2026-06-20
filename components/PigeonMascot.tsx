type PigeonMascotProps = {
  pose?: "perched" | "flying";
  size?: number;
  variant?: "default" | "white";
};

export function PigeonMascot({
  pose = "perched",
  size = 48,
  variant = "default",
}: PigeonMascotProps) {
  const body = variant === "white" ? "#FFFFFF" : "#2E4158";
  const accent = variant === "white" ? "rgba(255,255,255,0.65)" : "#E8C89A";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pigeon logo"
      role="img"
    >
      {/* Tail — wedge extending lower-left */}
      <polygon points="25,64 2,50 9,73 20,71" fill={body} />

      {/* Body */}
      <ellipse cx="46" cy="63" rx="26" ry="17" fill={body} />

      {/* Neck */}
      <ellipse cx="57" cy="48" rx="13" ry="11" fill={body} />

      {/* Head */}
      <circle cx="62" cy="32" r="12" fill={body} />

      {/* Beak */}
      <polygon points="72,29 80,32 72,35" fill={body} />

      {/* Eye */}
      <circle cx="66" cy="27" r="2.5" fill={accent} />

      {/* Wing — beige V/envelope chevron */}
      <polygon points="18,58 35,72 60,54" fill={accent} />

      {/* Feet */}
      <polyline
        points="40,80 37,87 29,87"
        stroke={body}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline
        points="49,80 46,87 38,87"
        stroke={body}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Flying pose: envelope carried in beak */}
      {pose === "flying" && (
        <g>
          <rect
            x="84"
            y="27"
            width="16"
            height="11"
            rx="1.5"
            fill="white"
            stroke={accent}
            strokeWidth="1.5"
          />
          <polyline
            points="84,27 92,34 100,27"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      )}
    </svg>
  );
}
