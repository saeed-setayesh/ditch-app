import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isUserAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PatchBody = {
  proActive?: boolean;
  role?: "user" | "admin";
};

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || !(await isUserAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data: {
    tier?: string;
    stripeSubscriptionStatus?: string | null;
    role?: string;
  } = {};

  if (typeof body.proActive === "boolean") {
    if (body.proActive) {
      data.tier = "pro";
      data.stripeSubscriptionStatus = "active";
    } else {
      data.tier = "free";
      data.stripeSubscriptionStatus = null;
    }
  }

  if (body.role === "admin" || body.role === "user") {
    if (id === session.user.id && body.role === "user") {
      return NextResponse.json(
        { error: "You cannot remove your own admin role here." },
        { status: 400 },
      );
    }
    data.role = body.role;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields — send proActive and/or role." },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tier: true,
      stripeSubscriptionStatus: true,
    },
  });

  return NextResponse.json({ user: updated });
}
