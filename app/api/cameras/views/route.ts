import { NextRequest, NextResponse } from "next/server";
import { fetchOntario511Cameras } from "@/lib/ontario511";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const externalId = searchParams.get("externalId");
  if (!externalId)
    return NextResponse.json({ error: "externalId required" }, { status: 400 });

  try {
    // externalId format: 511on-<Id>-<SourceId> (we used this when seeding)
    const parts = externalId.split("-");
    const idPart = parts.length >= 2 ? parts[1] : null;
    if (!idPart) return NextResponse.json({ views: [] });

    const cameras = await fetchOntario511Cameras({ DitchAppOnly: false });
    const cam = cameras.find((c) => c.externalId.includes(`511on-${idPart}`));
    if (!cam) return NextResponse.json({ views: [] });

    // cam.imageUrl may be a page URL; we need to fetch original camera list again to get Views.
    // For simplicity return the imageUrl as single view and let client use it.
    return NextResponse.json({
      views: [{ id: idPart, url: cam.imageUrl, description: cam.name }],
    });
  } catch (e) {
    console.error("Camera views error:", e);
    return NextResponse.json(
      { error: "Failed to fetch views" },
      { status: 500 },
    );
  }
}
