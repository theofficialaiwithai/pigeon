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
  const body = variant === "white" ? "#FFFFFF" : "#2D3282";
  const eyeFill = variant === "white" ? "#2D3282" : "#FFFFFF";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
      aria-label="Pigeon mascot"
      role="img"
    >
      {/* Tail feathers — two overlapping triangles spread left */}
      <polygon points="20,47 6,38 11,51" fill={body} />
      <polygon points="20,47 5,45 10,56" fill={body} />

      {/* Body */}
      <ellipse cx="32" cy="46" rx="16" ry="11" fill={body} />

      {/* Neck — bridges head and body */}
      <ellipse cx="40" cy="36" rx="9" ry="8" fill={body} />

      {/* Head */}
      <circle cx="44" cy="23" r="13" fill={body} />

      {/* Wing accent — orange arc across the body */}
      <path
        d="M17 43 Q28 33 42 41"
        stroke="#F97316"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Beak — orange triangle pointing right */}
      <polygon points="57,23 65,20 57,17" fill="#F97316" />

      {/* Eye — single dot */}
      <circle cx="50" cy="20" r="3" fill={eyeFill} />

      {/* Feet */}
      <polyline
        points="29,57 27,63 22,63"
        stroke={body}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline
        points="36,57 34,63 29,63"
        stroke={body}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Flying pose: small envelope carried below the beak */}
      {pose === "flying" && (
        <g>
          <rect
            x="59"
            y="27"
            width="16"
            height="11"
            rx="1.5"
            fill="white"
            stroke="#F97316"
            strokeWidth="1.5"
          />
          <polyline
            points="59,27 67,34 75,27"
            stroke="#F97316"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      )}
    </svg>
  );
}
