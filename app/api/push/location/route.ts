import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

function validLat(lat: unknown): lat is number {
  return typeof lat === "number" && lat >= -90 && lat <= 90;
}
function validLng(lng: unknown): lng is number {
  return typeof lng === "number" && lng >= -180 && lng <= 180;
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, deviceId, lat, lng } = body as {
      endpoint?: string;
      deviceId?: string;
      lat?: number;
      lng?: number;
    };

    if (!validLat(lat) || !validLng(lng)) {
      return NextResponse.json(
        { error: "Valid lat (-90..90) and lng (-180..180) required" },
        { status: 400 }
      );
    }

    // Get session userId
    const userId = await getSessionUserId();

    if (endpoint && typeof endpoint === "string") {
      const updated = await prisma.pushSubscription.updateMany({
        where: { endpoint },
        data: { lastLat: lat, lastLng: lng },
      });
      if (updated.count === 0) {
        return NextResponse.json(
          { error: "Subscription not found" },
          { status: 404 }
        );
      }
    } else if (userId) {
      await prisma.pushSubscription.updateMany({
        where: { userId },
        data: { lastLat: lat, lastLng: lng },
      });
    } else if (deviceId && typeof deviceId === "string") {
      await prisma.pushSubscription.updateMany({
        where: { deviceId },
        data: { lastLat: lat, lastLng: lng },
      });
    } else {
      return NextResponse.json(
        { error: "Either endpoint, deviceId, or auth session required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Push location update error:", e);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}
