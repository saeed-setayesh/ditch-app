import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import {
  getActiveOrgMember,
  requireOrgAdmin,
} from "@/lib/orgInspectionAuth";
import { isChecklistSchemaV1 } from "@/lib/inspection/checklistSchema";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  if (!requireOrgAdmin(member)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id: templateId } = await ctx.params;

  const template = await prisma.inspectionTemplate.findFirst({
    where: { id: templateId, organizationId: member.organizationId },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const checklistSchema = body.checklistSchema;
  if (!isChecklistSchemaV1(checklistSchema)) {
    return NextResponse.json(
      { error: "checklistSchema must be valid checklist v1 JSON" },
      { status: 400 },
    );
  }

  const nextVersion = (template.versions[0]?.version ?? 0) + 1;

  const version = await prisma.inspectionTemplateVersion.create({
    data: {
      templateId,
      version: nextVersion,
      checklistSchema: checklistSchema as object,
    },
  });

  return NextResponse.json({ version });
}
