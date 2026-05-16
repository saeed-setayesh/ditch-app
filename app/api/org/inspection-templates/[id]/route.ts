import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { getActiveOrgMember } from "@/lib/orgInspectionAuth";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  if (!member) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  const { id } = await ctx.params;

  const template = await prisma.inspectionTemplate.findFirst({
    where: { id, organizationId: member.organizationId },
    include: {
      versions: { orderBy: { version: "desc" } },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ template });
}
