import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { getActiveOrgMember } from "@/lib/orgInspectionAuth";

export const dynamic = "force-dynamic";

/**
 * Proxies local-disk inspection uploads (when not using Vercel Blob).
 * Also resolves attachmentId → redirect or stream when needed.
 */
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  if (!member) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  const url = new URL(request.url);
  const attachmentId = url.searchParams.get("attachmentId");
  const keyParam = url.searchParams.get("key");

  let storageKey: string | null = null;
  let redirectUrl: string | null = null;

  if (attachmentId) {
    const att = await prisma.inspectionAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        inspection: { select: { organizationId: true } },
      },
    });
    if (!att || att.inspection.organizationId !== member.organizationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    storageKey = att.storageKey;
    if (att.publicUrl?.startsWith("http")) {
      redirectUrl = att.publicUrl;
    }
  } else if (keyParam) {
    const att = await prisma.inspectionAttachment.findFirst({
      where: { storageKey: keyParam },
      include: {
        inspection: { select: { organizationId: true } },
      },
    });
    if (!att || att.inspection.organizationId !== member.organizationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    storageKey = att.storageKey;
    if (att.publicUrl?.startsWith("http")) {
      redirectUrl = att.publicUrl;
    }
  } else {
    return NextResponse.json(
      { error: "attachmentId or key required" },
      { status: 400 },
    );
  }

  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  const baseDir =
    process.env.INSPECTION_LOCAL_UPLOAD_DIR?.trim() ||
    path.join(process.cwd(), ".data", "inspection-uploads");
  const fullPath = path.join(baseDir, storageKey ?? "");
  if (!fullPath.startsWith(baseDir) || !existsSync(fullPath)) {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }

  const buf = await readFile(fullPath);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
