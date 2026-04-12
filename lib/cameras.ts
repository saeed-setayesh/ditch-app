import { prisma } from "@/lib/db";
import { fetchOntario511Cameras } from "@/lib/ontario511";

export type CameraInput = {
  externalId: string;
  lat: number;
  lng: number;
  name: string;
  roadName?: string | null;
  intersection?: string | null;
  imageUrl: string;
  city?: string;
};

/** Guard so we only auto-fetch from Ontario 511 once per process when DB is empty. */
let ontario511AutoFetched = false;

/**
 * Upsert traffic cameras into the database. Used for ingestion from DitchApp Open Data
 * or Ontario 511. Call periodically (e.g. weekly) to refresh metadata.
 */
export async function syncDitchAppCameras(
  cameras: CameraInput[],
): Promise<number> {
  let count = 0;
  for (const c of cameras) {
    await prisma.trafficCamera.upsert({
      where: { externalId: c.externalId },
      create: {
        externalId: c.externalId,
        lat: c.lat,
        lng: c.lng,
        name: c.name,
        roadName: c.roadName ?? null,
        intersection: c.intersection ?? null,
        imageUrl: c.imageUrl,
        city: c.city ?? "DitchApp",
      },
      update: {
        lat: c.lat,
        lng: c.lng,
        name: c.name,
        roadName: c.roadName ?? null,
        intersection: c.intersection ?? null,
        imageUrl: c.imageUrl,
        city: c.city ?? "DitchApp",
      },
    });
    count++;
  }
  return count;
}

/**
 * Fetch cameras for a city (default DitchApp). Used by nearby API.
 * When city is DitchApp and DB has no cameras, fetches once from Ontario 511 and upserts (real data).
 */
export async function getCamerasByCity(city: string = "DitchApp") {
  let list = await prisma.trafficCamera.findMany({
    where: { city },
    select: {
      id: true,
      externalId: true,
      lat: true,
      lng: true,
      name: true,
      roadName: true,
      intersection: true,
      imageUrl: true,
      city: true,
    },
  });

  if (city === "DitchApp" && list.length === 0 && !ontario511AutoFetched) {
    ontario511AutoFetched = true;
    try {
      const cameras = await fetchOntario511Cameras({ DitchAppOnly: true });
      if (cameras.length > 0) {
        await syncDitchAppCameras(cameras);
        list = await prisma.trafficCamera.findMany({
          where: { city },
          select: {
            id: true,
            externalId: true,
            lat: true,
            lng: true,
            name: true,
            roadName: true,
            intersection: true,
            imageUrl: true,
            city: true,
          },
        });
      }
    } catch (e) {
      console.warn("Auto-fetch Ontario 511 cameras failed:", e);
    }
  }

  return list;
}
