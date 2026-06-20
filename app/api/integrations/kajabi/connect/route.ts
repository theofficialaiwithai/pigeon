import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformConnections, teachers } from "@/lib/schema";
import { mintKajabiToken, KAJABI_MOCK_PRODUCTS } from "@/lib/kajabi";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { clientId, clientSecret } = (body ?? {}) as {
    clientId?: string;
    clientSecret?: string;
  };

  if (!clientId?.trim() || !clientSecret?.trim()) {
    return NextResponse.json(
      { error: "Client ID and Client Secret are required" },
      { status: 400 }
    );
  }

  // Validate credentials by minting a token
  let accessToken: string;
  try {
    accessToken = await mintKajabiToken(clientId.trim(), clientSecret.trim());
  } catch {
    return NextResponse.json(
      { error: "Invalid Client ID or Secret" },
      { status: 400 }
    );
  }

  // Fetch account name from /v1/me
  const meRes = await fetch("https://api.kajabi.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) {
    return NextResponse.json(
      { error: "Invalid Client ID or Secret" },
      { status: 400 }
    );
  }
  const meData = (await meRes.json()) as {
    data?: { attributes?: { name?: string } };
  };
  const accountName = meData.data?.attributes?.name ?? null;

  // Fetch product count — fall back to mock count if plan doesn't allow it
  let productCount = KAJABI_MOCK_PRODUCTS.length;
  try {
    const productsRes = await fetch("https://api.kajabi.com/v1/products", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (productsRes.ok) {
      const productsData = (await productsRes.json()) as { data?: unknown[] };
      productCount = productsData.data?.length ?? KAJABI_MOCK_PRODUCTS.length;
    }
  } catch {
    // fallback to mock count — don't fail the whole connect flow
  }

  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  // Manual upsert — no unique constraint on (teacher_id, platform)
  const [existing] = await db
    .select({ id: platformConnections.id })
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.teacherId, teacher.id),
        eq(platformConnections.platform, "kajabi")
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(platformConnections)
      .set({
        accessToken: clientId.trim(),
        clientSecret: clientSecret.trim(),
        accountName,
        updatedAt: new Date(),
      })
      .where(eq(platformConnections.id, existing.id));
  } else {
    await db.insert(platformConnections).values({
      teacherId: teacher.id,
      platform: "kajabi",
      accessToken: clientId.trim(),
      clientSecret: clientSecret.trim(),
      accountName,
    });
  }

  return NextResponse.json({ accountName, productCount });
}
