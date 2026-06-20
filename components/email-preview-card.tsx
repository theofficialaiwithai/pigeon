"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface EmailPreviewCardProps {
  /** Key the component by this id — changing it resets and retriggers the count-up */
  id: string;
  subject: string;
  recipient: string;
  sender: string;
  /** 0–100 integer rendered with count-up animation */
  voiceMatchScore: number;
  /** Plain text body; multi-paragraph blocks separated by \n\n */
  body: string;
  className?: string;
}

export function EmailPreviewCard({
  id,
  subject,
  recipient,
  sender,
  voiceMatchScore,
  body,
  className,
}: EmailPreviewCardProps) {
  const [displayScore, setDisplayScore] = useState(0);

  // Count-up animation: 0 → voiceMatchScore over ~800ms, ease-out cubic
  useEffect(() => {
    setDisplayScore(0);
    const duration = 800;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(eased * voiceMatchScore));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, voiceMatchScore]);

  const paragraphs = body.split(/\n\n+/).filter(Boolean);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[var(--warm-rule)] bg-white ${className ?? ""}`}
    >
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between border-b border-[var(--warm-rule)] bg-[var(--parchment)] px-4 py-3">
        {/* Traffic-light dots */}
        <div className="flex items-center gap-[4px]">
          <span className="block h-2 w-2 rounded-full" style={{ background: "#E8BBAA" }} />
          <span className="block h-2 w-2 rounded-full" style={{ background: "#E8CC70" }} />
          <span className="block h-2 w-2 rounded-full" style={{ background: "#9EBDA0" }} />
        </div>

        <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
          Draft Preview
        </span>

        {/* tag-ink badge with smaller override text size */}
        <Badge variant="tag-ink" className="text-[8.5px]">
          AI-generated · review before sending
        </Badge>
      </div>

      {/* ── Body ── */}
      <div className="px-[22px] py-[22px]">
        {/* Subject */}
        <div className="mb-1 font-heading text-[17px] leading-snug text-[var(--ink)]">
          {subject || (
            <span className="italic text-[var(--ink-faint)]">No subject yet</span>
          )}
        </div>

        {/* Meta line */}
        <div className="mb-[14px] text-[10.5px] text-[var(--ink-faint)]">
          To: {recipient} · From: {sender} · Voice match:{" "}
          <span className="font-semibold tabular-nums">{displayScore}%</span>
        </div>

        {/* Body quote — accent italic serif with sienna left border */}
        <div
          className="font-accent text-[13.5px] italic leading-[1.8] text-[var(--ink-muted)]"
          style={{ borderLeft: "2.5px solid var(--sienna)", paddingLeft: 14 }}
        >
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => (
              <p key={i} className={i > 0 ? "mt-3" : ""}>
                {p}
              </p>
            ))
          ) : (
            <span className="opacity-40">No body content yet…</span>
          )}
        </div>
      </div>
    </div>
  );
}
