import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isUserAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !(await isUserAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tier: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripeSubscriptionStatus: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}
