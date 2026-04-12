import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Ontario 511 does not expose direct image URLs (images.511on.ca does not exist).
 * Redirect to the camera page so iframe or link can open it. Used for legacy /api/cameras/image?viewId= URLs.
 */
export async function GET(request: NextRequest) {
  const viewId = request.nextUrl.searchParams.get("viewId");
  const id = viewId ? parseInt(viewId, 10) : NaN;
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid viewId" }, { status: 400 });
  }

  const cameraPageUrl = `https://511on.ca/map/Cctv/${id}`;
  return NextResponse.redirect(cameraPageUrl, 302);
}
