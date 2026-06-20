import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropic-fetch";
import { db } from "@/lib/db";
import { teachers, voiceProfiles } from "@/lib/schema";
import { extractJSON } from "@/lib/extract-json";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a voice analyst. Analyse these 5 emails and extract a voice profile.
Return ONLY valid JSON — no markdown, no explanation, no code fences.

{
  "sentence_length": { "classification": string, "score": number, "examples": string[], "rules": string[] },
  "punctuation_patterns": { "classification": string, "score": number, "examples": string[], "rules": string[] },
  "opening_style": { "classification": string, "score": number, "examples": string[], "rules": string[] },
  "closing_style": { "classification": string, "score": number, "examples": string[], "rules": string[] },
  "vocabulary_register": { "classification": string, "score": number, "examples": string[], "rules": string[] },
  "pronoun_usage": { "classification": string, "score": number, "examples": string[], "rules": string[] },
  "storytelling_patterns": { "classification": string, "score": number, "examples": string[], "rules": string[] },
  "cta_style": { "classification": string, "score": number, "examples": string[], "rules": string[] }
}

Score each dimension 1-10 where 10 = extremely distinctive/strong in that dimension.
CRITICAL: examples must be exact quotes from the input emails. Never invent examples.`;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { emails } = body as { emails: string[] };

  if (!Array.isArray(emails) || emails.length !== 5) {
    return NextResponse.json({ error: "Exactly 5 emails required" }, { status: 400 });
  }
  if (emails.some((e) => countWords(e) < 50)) {
    return NextResponse.json(
      { error: "Each email must have at least 50 words" },
      { status: 400 }
    );
  }

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const emailContent = emails
    .map((email, i) => `--- EMAIL ${i + 1} ---\n${email.trim()}`)
    .join("\n\n");

  let rawText: string;
  try {
    const result = await callClaude({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: emailContent }],
    });
    rawText = result.text;
  } catch (claudeErr) {
    console.error("[voice/generate] Claude API error:", claudeErr);
    const message = claudeErr instanceof Error ? claudeErr.message : String(claudeErr);
    return NextResponse.json(
      { error: `AI generation failed: ${message}` },
      { status: 502 }
    );
  }

  let profileData: Record<string, unknown>;
  try {
    profileData = JSON.parse(extractJSON(rawText));
  } catch (parseErr) {
    console.error("[voice/generate] JSON parse error:", parseErr);
    console.error("[voice/generate] Raw Claude response:", rawText);
    return NextResponse.json(
      { error: "Failed to parse AI response. Please try again." },
      { status: 500 }
    );
  }

  const upsertValues = {
    teacherId: teacher.id,
    rawEmails: emails,
    sentenceLength: JSON.stringify(profileData.sentence_length),
    punctuationPatterns: JSON.stringify(profileData.punctuation_patterns),
    openingStyle: JSON.stringify(profileData.opening_style),
    closingStyle: JSON.stringify(profileData.closing_style),
    vocabularyRegister: JSON.stringify(profileData.vocabulary_register),
    pronounUsage: JSON.stringify(profileData.pronoun_usage),
    storytellingPatterns: JSON.stringify(profileData.storytelling_patterns),
    ctaStyle: JSON.stringify(profileData.cta_style),
    fullProfileJson: profileData,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: voiceProfiles.id })
    .from(voiceProfiles)
    .where(eq(voiceProfiles.teacherId, teacher.id))
    .limit(1);

  let saved;
  if (existing) {
    [saved] = await db
      .update(voiceProfiles)
      .set(upsertValues)
      .where(eq(voiceProfiles.id, existing.id))
      .returning();
  } else {
    [saved] = await db
      .insert(voiceProfiles)
      .values(upsertValues)
      .returning();
  }

  return NextResponse.json({ profile: saved, profileData });
}
