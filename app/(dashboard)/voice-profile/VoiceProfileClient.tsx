"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DimensionData = {
  classification: string;
  score: number;
  examples: string[];
  rules: string[];
};

export type VoiceProfileData = {
  sentence_length: DimensionData;
  punctuation_patterns: DimensionData;
  opening_style: DimensionData;
  closing_style: DimensionData;
  vocabulary_register: DimensionData;
  pronoun_usage: DimensionData;
  storytelling_patterns: DimensionData;
  cta_style: DimensionData;
};

const DIMENSION_LABELS: { key: keyof VoiceProfileData; label: string }[] = [
  { key: "sentence_length", label: "Sentence Length" },
  { key: "punctuation_patterns", label: "Punctuation" },
  { key: "opening_style", label: "Opening Style" },
  { key: "closing_style", label: "Closing Style" },
  { key: "vocabulary_register", label: "Vocabulary" },
  { key: "pronoun_usage", label: "Pronouns" },
  { key: "storytelling_patterns", label: "Storytelling" },
  { key: "cta_style", label: "CTA Style" },
];

const CARD_LABELS: { key: keyof VoiceProfileData; label: string }[] = [
  { key: "sentence_length", label: "Sentence Length" },
  { key: "punctuation_patterns", label: "Punctuation" },
  { key: "opening_style", label: "Opening Style" },
  { key: "closing_style", label: "Closing Style" },
  { key: "vocabulary_register", label: "Vocabulary" },
  { key: "pronoun_usage", label: "Pronouns" },
  { key: "storytelling_patterns", label: "Storytelling" },
  { key: "cta_style", label: "Call to Action" },
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── State A: Voice Form ──────────────────────────────────────────────────────

function VoiceForm({ onSuccess }: { onSuccess: (data: VoiceProfileData) => void }) {
  const [emailTexts, setEmailTexts] = useState<string[]>(["", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const wordCounts = emailTexts.map(countWords);
  const allQualified = wordCounts.every((c) => c >= 50);

  function updateEmail(index: number, value: string) {
    setEmailTexts((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/voice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailTexts }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Failed to generate profile");
      }
      const data = await res.json();
      onSuccess(data.profileData as VoiceProfileData);

      const urlParams = new URLSearchParams(window.location.search);
      pendo?.track("voice_profile_generated", {
        cohort_id: urlParams.get("from") ?? null,
        email_count: emailTexts.length,
        total_word_count: wordCounts.reduce((a, b) => a + b, 0),
        source_page: window.location.pathname,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 mb-6 text-sm text-pigeon-muted hover:text-pigeon-primary transition-colors"
      >
        ← Dashboard
      </Link>
      <h2 className="font-heading text-[28px] font-bold text-gray-900">
        Build Your Voice Profile
      </h2>
      <p className="mt-3 font-sans text-base text-pigeon-muted">
        Paste 5 emails you&apos;ve sent before — any kind. Launch sequences,
        weekly updates, personal notes. Pigeon reads how you write, not what you
        say.
      </p>

      <div className="mt-8 space-y-5">
        {emailTexts.map((email, i) => {
          const wc = wordCounts[i];
          const qualified = wc >= 50;
          return (
            <Card key={i} className="rounded-xl border border-pigeon-border bg-white shadow-sm">
              <CardContent className="p-5">
                <label className="mb-2 block font-heading text-sm font-semibold text-gray-700">
                  Email {i + 1}
                </label>
                <Textarea
                  value={email}
                  onChange={(e) => updateEmail(i, e.target.value)}
                  placeholder="Paste an email you've sent…"
                  className="min-h-32 resize-y border-pigeon-border bg-white font-sans text-sm focus:border-pigeon-primary"
                />
                <p
                  className={cn(
                    "mt-1.5 font-sans text-xs",
                    wc === 0
                      ? "text-pigeon-muted"
                      : qualified
                      ? "text-pigeon-success"
                      : "text-pigeon-error"
                  )}
                >
                  {wc === 0
                    ? "0 words"
                    : qualified
                    ? `${wc} words ✓`
                    : `${wc} words — needs ${50 - wc} more`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allQualified || loading}
        className={cn(
          "mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-heading text-base font-semibold text-white transition-colors",
          allQualified && !loading
            ? "bg-pigeon-accent hover:bg-orange-600 cursor-pointer"
            : "bg-pigeon-accent/50 cursor-not-allowed"
        )}
      >
        {loading ? (
          <>
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Reading your voice…
          </>
        ) : (
          "Generate Voice Profile →"
        )}
      </button>
    </div>
  );
}

// ─── State B: Profile Display ─────────────────────────────────────────────────

function ProfileDisplay({
  profile,
  returnCohortId,
  onRegenerate,
}: {
  profile: VoiceProfileData;
  returnCohortId: string | null;
  onRegenerate: () => void;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [continuing, setContinuing] = useState(false);

  const radarData = DIMENSION_LABELS.map(({ key, label }) => ({
    dimension: label,
    score: profile[key]?.score ?? 5,
  }));

  async function handleContinueToSequence() {
    if (!returnCohortId) return;
    setContinuing(true);
    try {
      const res = await fetch("/api/sequence/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohortId: returnCohortId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to generate sequence" }));
        throw new Error(err.error ?? "Failed to generate sequence");
      }
      router.push(`/cohorts/${returnCohortId}/sequence`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setContinuing(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 mb-6 text-sm text-pigeon-muted hover:text-pigeon-primary transition-colors"
      >
        ← Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-[28px] font-bold text-gray-900">
            Your Voice Profile
          </h2>
          <p className="mt-2 font-sans text-base text-pigeon-muted">
            This is how Pigeon will write every email in your sequence.
          </p>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="shrink-0 font-sans text-sm text-pigeon-muted underline-offset-2 hover:underline"
        >
          Regenerate
        </button>
      </div>

      {/* Radar chart */}
      <Card className="mb-6 rounded-xl border border-pigeon-border bg-white shadow-sm">
        <CardContent className="p-6">
          <h3 className="mb-4 font-heading text-base font-semibold text-pigeon-primary">
            Voice Fingerprint
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 12, fontFamily: "var(--font-inter)", fill: "#6B7280" }}
              />
              <Radar
                dataKey="score"
                fill="rgba(249, 115, 22, 0.2)"
                stroke="#F97316"
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Dimension cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CARD_LABELS.map(({ key, label }) => {
          const dim = profile[key];
          if (!dim) return null;
          const examples = dim.examples.slice(0, 2);
          return (
            <Card key={key} className="rounded-xl border border-pigeon-border bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="font-heading text-xs font-semibold uppercase tracking-wide text-pigeon-muted">
                  {label}
                </p>
                <p className="mt-1 font-heading text-lg font-semibold text-pigeon-primary">
                  {dim.classification}
                </p>
                {examples.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {examples.map((ex, i) => (
                      <li key={i} className="font-sans text-sm italic text-pigeon-muted line-clamp-2">
                        &ldquo;{ex}&rdquo;
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-8 flex justify-end">
        {returnCohortId ? (
          <button
            onClick={handleContinueToSequence}
            disabled={continuing}
            className={cn(
              buttonVariants(),
              "bg-pigeon-accent text-white hover:bg-orange-600 inline-flex items-center gap-2"
            )}
          >
            {continuing && <Loader2Icon size={14} className="animate-spin" />}
            {continuing ? "Generating sequence…" : "Continue to Sequence →"}
          </button>
        ) : (
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }), "border-pigeon-border")}
          >
            Back to Dashboard
          </Link>
        )}
      </div>

      {/* Regenerate confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-semibold text-gray-900">
              Regenerate voice profile?
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-pigeon-muted">
              This will overwrite your current profile. You&apos;ll need to paste your emails again.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setConfirmOpen(false)}
              className="font-sans text-sm text-pigeon-muted hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={() => { setConfirmOpen(false); onRegenerate(); }}
              className="rounded-lg bg-pigeon-accent px-4 py-2 font-sans text-sm font-medium text-white hover:bg-orange-600"
            >
              Yes, regenerate
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export function VoiceProfileClient({
  initialProfile,
  returnCohortId,
}: {
  initialProfile: VoiceProfileData | null;
  returnCohortId: string | null;
}) {
  const [profile, setProfile] = useState<VoiceProfileData | null>(initialProfile);

  if (profile) {
    return (
      <ProfileDisplay
        profile={profile}
        returnCohortId={returnCohortId}
        onRegenerate={() => setProfile(null)}
      />
    );
  }

  return <VoiceForm onSuccess={(data) => setProfile(data)} />;
}
