import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

export type StoredBlob = {
  storageKey: string;
  publicUrl: string;
};

/**
 * Upload inspection binary (photo/signature). Uses Vercel Blob when
 * BLOB_READ_WRITE_TOKEN is set; otherwise writes under INSPECTION_LOCAL_UPLOAD_DIR.
 */
export async function uploadInspectionFile(opts: {
  /** Logical folder prefix e.g. orgId/inspectionId */
  prefix: string;
  filename: string;
  body: Buffer;
  contentType: string;
}): Promise<StoredBlob> {
  const { prefix, filename, body, contentType } = opts;
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (token) {
    const pathname = `${prefix.replace(/^\//, "").replace(/\/$/, "")}/${filename}`;
    const blob = await put(pathname, body, {
      access: "public",
      token,
      contentType,
    });
    return {
      storageKey: pathname,
      publicUrl: blob.url,
    };
  }

  const baseDir =
    process.env.INSPECTION_LOCAL_UPLOAD_DIR?.trim() ||
    path.join(process.cwd(), ".data", "inspection-uploads");
  const safePrefix = prefix.replace(/[^a-zA-Z0-9/_-]/g, "_");
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dir = path.join(baseDir, safePrefix);
  await mkdir(dir, { recursive: true });
  const storageKey = path.join(safePrefix, safeName);
  const fullPath = path.join(baseDir, storageKey);
  await writeFile(fullPath, body);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const publicUrl = baseUrl
    ? `${baseUrl}/api/org/inspection-files?key=${encodeURIComponent(storageKey)}`
    : `/api/org/inspection-files?key=${encodeURIComponent(storageKey)}`;

  return { storageKey, publicUrl };
}
