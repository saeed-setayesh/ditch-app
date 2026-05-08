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

/** Throttle Ontario 511 ingest so warm paths do not hammer 511on.ca. */
let lastOntario511IngestMs = 0;
const ONTARIO511_INGEST_MIN_GAP_MS = 4 * 60 * 60 * 1000;

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
 * When city is DitchApp, ingests from Ontario 511 when the catalog is empty or thin (throttled).
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

  if (city === "DitchApp") {
    const now = Date.now();
    const thinCatalog = list.length < 45;
    const due =
      list.length === 0 ||
      (thinCatalog && now - lastOntario511IngestMs >= ONTARIO511_INGEST_MIN_GAP_MS);
    if (due) {
      try {
        const cameras = await fetchOntario511Cameras({ DitchAppOnly: true });
        if (cameras.length > 0) {
          await syncDitchAppCameras(cameras);
          lastOntario511IngestMs = now;
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
        console.warn("Ontario 511 camera ingest failed:", e);
      }
    }
  }

  return list;
}
