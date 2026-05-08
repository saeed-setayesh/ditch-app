import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const MAX_BODY = 2000;

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.crowdPost.findMany({
    where: {
      moderationState: "visible",
      suspiciousScore: { lt: 50 },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    posts: rows.map((p) => ({
      id: p.id,
      body: p.body,
      createdAt: p.createdAt.toISOString(),
      user: p.user,
    })),
  });
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = String((body as { body?: unknown }).body ?? "").trim();
  if (text.length < 2 || text.length > MAX_BODY) {
    return NextResponse.json(
      { error: `Body length must be 2–${MAX_BODY}` },
      { status: 400 },
    );
  }

  let suspiciousScore = 0;
  if (text.length < 8) suspiciousScore += 12;

  const duplicate = await prisma.crowdPost.findFirst({
    where: {
      userId,
      body: text,
      createdAt: {
        gte: new Date(Date.now() - 3 * 60_000),
      },
    },
  });
  if (duplicate) suspiciousScore += 45;

  const repetition = await prisma.crowdPost.count({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
  });
  if (repetition >= 4) suspiciousScore += 35;

  const moderationState =
    suspiciousScore >= 50 ? "hidden" : "visible";

  const post = await prisma.crowdPost.create({
    data: {
      userId,
      body: text,
      suspiciousScore,
      moderationState,
    },
  });

  if (moderationState === "visible") {
    await prisma.rewardLedgerEntry.create({
      data: {
        userId,
        delta: 5,
        reason: "crowd_post_visible",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    id: post.id,
    moderationState: post.moderationState,
  });
}
