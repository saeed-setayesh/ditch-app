import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import {
  getActiveOrgMember,
  requireOrgAdmin,
} from "@/lib/orgInspectionAuth";
import { isChecklistSchemaV1 } from "@/lib/inspection/checklistSchema";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  if (!member) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  const templates = await prisma.inspectionTemplate.findMany({
    where: { organizationId: member.organizationId },
    orderBy: { name: "asc" },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 5,
        select: { id: true, version: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  if (!requireOrgAdmin(member)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const description =
    body.description != null ? String(body.description).trim() || null : null;
  const checklistSchema = body.checklistSchema;
  if (!isChecklistSchemaV1(checklistSchema)) {
    return NextResponse.json(
      { error: "checklistSchema must be valid checklist v1 JSON" },
      { status: 400 },
    );
  }

  const created = await prisma.$transaction(async (tx) => {
    const t = await tx.inspectionTemplate.create({
      data: {
        organizationId: member.organizationId,
        name,
        description,
      },
    });
    const v = await tx.inspectionTemplateVersion.create({
      data: {
        templateId: t.id,
        version: 1,
        checklistSchema: checklistSchema as object,
      },
    });
    return { template: t, version: v };
  });

  return NextResponse.json(created);
}
