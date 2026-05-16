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

  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    take: 500,
    select: { id: true, name: true },
  });

  return NextResponse.json({ organizations });
}
