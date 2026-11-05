/**
 * Supabase Storage access for vehicle photos (bucket "vehicle-images").
 * Stored URL shape is unchanged: <public bucket URL>/<userId>/<uuid>.<ext>
 * — only the extension/content-type now reflects the optimised file.
 * Uses the browser (anon + user session) client only; no privileged keys.
 */

import { supabase } from "@/integrations/supabase/client";

export const VEHICLE_IMAGES_BUCKET = "vehicle-images";

export interface UploadableImage {
  blob: Blob;
  contentType: string;
  extension: string;
}

export async function uploadVehicleImage(
  image: UploadableImage,
  userId: string,
): Promise<{ url: string; path: string }> {
  const path = `${userId}/${crypto.randomUUID()}.${image.extension}`;
  const { error } = await supabase.storage.from(VEHICLE_IMAGES_BUCKET).upload(path, image.blob, {
    contentType: image.contentType,
    upsert: false,
    // Object names are random and never overwritten, so they can be cached for a year.
    cacheControl: "31536000",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(VEHICLE_IMAGES_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Storage object path for a public URL of this bucket, or null for any other URL (demo images, external links). */
export function storagePathFromPublicUrl(url: string): string | null {
  const probe = supabase.storage.from(VEHICLE_IMAGES_BUCKET).getPublicUrl("__probe__")
    .data.publicUrl;
  const prefix = probe.slice(0, probe.length - "__probe__".length);
  if (!url.startsWith(prefix)) return null;
  const path = decodeURIComponent(url.slice(prefix.length).split("?")[0] ?? "");
  return path || null;
}

/** Removes objects by storage path. Best-effort: never throws (a leftover file must not break a save or an upload flow). */
export async function removeVehicleImagePaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  try {
    const { error } = await supabase.storage.from(VEHICLE_IMAGES_BUCKET).remove(paths);
    if (error) console.warn("Could not remove vehicle image objects", error.message);
  } catch (error) {
    console.warn("Could not remove vehicle image objects", error);
  }
}

/**
 * Deletes the storage objects behind these public URLs — but only those that live in
 * this bucket and are no longer referenced by any car_images row. Best-effort, never throws.
 * (Storage RLS lets admins delete; for other users the call is a harmless no-op.)
 */
export async function removeUnreferencedVehicleImages(urls: string[]): Promise<void> {
  try {
    const candidates = [...new Set(urls)].filter((url) => storagePathFromPublicUrl(url) !== null);
    if (candidates.length === 0) return;

    const { data, error } = await supabase
      .from("car_images")
      .select("image_url")
      .in("image_url", candidates);
    if (error) return; // can't prove it is unused → leave the file alone
    const stillUsed = new Set(
      ((data ?? []) as { image_url: string }[]).map((row) => row.image_url),
    );

    const paths = candidates
      .filter((url) => !stillUsed.has(url))
      .map((url) => storagePathFromPublicUrl(url))
      .filter((path): path is string => path !== null);
    await removeVehicleImagePaths(paths);
  } catch (error) {
    console.warn("Image cleanup skipped", error);
  }
}
