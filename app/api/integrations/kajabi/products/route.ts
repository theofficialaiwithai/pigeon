import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformConnections, teachers } from "@/lib/schema";
import { mintKajabiToken, KAJABI_MOCK_PRODUCTS } from "@/lib/kajabi";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const [conn] = await db
    .select({
      accessToken: platformConnections.accessToken,
      clientSecret: platformConnections.clientSecret,
    })
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.teacherId, teacher.id),
        eq(platformConnections.platform, "kajabi")
      )
    )
    .limit(1);

  if (!conn) {
    return NextResponse.json({ error: "Kajabi not connected" }, { status: 404 });
  }

  // Mint a fresh token from stored client_id + client_secret
  let accessToken: string;
  try {
    accessToken = await mintKajabiToken(conn.accessToken, conn.clientSecret ?? "");
  } catch {
    // Bad credentials or network error — fall back to mock products
    return NextResponse.json({ products: KAJABI_MOCK_PRODUCTS });
  }

  // Fetch products — fall back to mocks on 401/403 (plan gating) or any error
  try {
    const res = await fetch("https://api.kajabi.com/v1/products", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return NextResponse.json({ products: KAJABI_MOCK_PRODUCTS });
    }

    interface KajabiProductItem {
      id: string;
      attributes?: { title?: string; created_at?: string };
    }
    const data = (await res.json()) as { data?: KajabiProductItem[] };

    const products = (data.data ?? []).map((p) => ({
      id: p.id,
      name: p.attributes?.title ?? p.id,
      startDate: p.attributes?.created_at
        ? p.attributes.created_at.slice(0, 10)
        : null,
    }));

    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ products: KAJABI_MOCK_PRODUCTS });
  }
}
