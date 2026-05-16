import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import {
  assertInspectionAccess,
  getActiveOrgMember,
} from "@/lib/orgInspectionAuth";
import { uploadInspectionFile } from "@/lib/inspection/storage";

export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await getActiveOrgMember(userId);
  const { id: inspectionId } = await ctx.params;

  const inspection = await prisma.vehicleInspection.findUnique({
    where: { id: inspectionId },
    select: {
      id: true,
      organizationId: true,
      driverUserId: true,
      status: true,
    },
  });

  if (!inspection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gate = await assertInspectionAccess({
    userId,
    member,
    inspection,
    needWrite: true,
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const kindRaw = String(form.get("kind") ?? "photo");
  const kind = kindRaw === "signature" ? "signature" : "photo";
  const itemIdField = form.get("itemId");
  const itemId =
    typeof itemIdField === "string" && itemIdField.trim()
      ? itemIdField.trim()
      : null;

  if (kind === "signature" && itemId) {
    return NextResponse.json(
      { error: "Signature attachments must not reference an item" },
      { status: 400 },
    );
  }

  if (itemId) {
    const row = await prisma.vehicleInspectionItem.findFirst({
      where: { id: itemId, inspectionId },
    });
    if (!row) {
      return NextResponse.json({ error: "Invalid itemId" }, { status: 400 });
    }
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const contentType = file.type || "application/octet-stream";
  const ext =
    kind === "signature"
      ? "png"
      : contentType.includes("jpeg")
        ? "jpg"
        : contentType.includes("webp")
          ? "webp"
          : "png";
  const rand = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const filename = `${kind}-${rand}.${ext}`;

  const stored = await uploadInspectionFile({
    prefix: `${inspection.organizationId}/${inspectionId}`,
    filename,
    body: buf,
    contentType,
  });

  const attachment = await prisma.inspectionAttachment.create({
    data: {
      inspectionId,
      itemId,
      kind,
      storageKey: stored.storageKey,
      publicUrl: stored.publicUrl,
      contentType,
    },
  });

  return NextResponse.json({ attachment });
}
