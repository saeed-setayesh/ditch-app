import { NextRequest, NextResponse } from "next/server";
import { syncDitchAppCameras, type CameraInput } from "@/lib/cameras";
import { fetchOntario511Cameras } from "@/lib/ontario511";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * One-off or cron-triggered sync of DitchApp traffic cameras from Ontario 511 (real data).
 * Body: { cameras?: CameraInput[] } — if provided, uses that list; otherwise fetches from Ontario 511 API (DitchApp area only).
 * Protected by CRON_SECRET (same as check-nearby-incidents).
 */
export async function POST(request: NextRequest) {
  const secret =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    request.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let cameras: CameraInput[];
    const body = await request.json().catch(() => ({}));
    if (Array.isArray(body.cameras) && body.cameras.length > 0) {
      cameras = body.cameras;
    } else {
      cameras = await fetchOntario511Cameras({ DitchAppOnly: true });
    }
    const count = await syncDitchAppCameras(cameras);
    return NextResponse.json({ ok: true, synced: count });
  } catch (e) {
    console.error("Cameras sync error:", e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
