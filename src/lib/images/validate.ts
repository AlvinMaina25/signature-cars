/**
 * Upload validation, shared by every photo entry point.
 * Order: size → declared type/extension (cheap gate) → file signature (authoritative)
 * → sanity limit on pixel count. Decoding failures (truncated/corrupt data that has a
 * valid header) are caught later, by the optimiser, and reported with the same wording.
 */

import {
  detectImageKind,
  pngHasEnd,
  readImageSize,
  webpIsComplete,
  type DetectedImageKind,
} from "./file-signature";
import { jpegIsComplete, readJpegMeta } from "./jpeg-meta";

export const MAX_ORIGINAL_BYTES = 5 * 1024 * 1024; // 5 MB — unchanged from the previous limit
/** Refuses images that would need an unreasonable amount of memory to decode. */
export const MAX_PIXELS = 64_000_000;

/**
 * `accept` for every photo <input>. MIME types AND extensions: iOS/Android often
 * report HEIC with an empty or wrong type, so extensions are what make the picker
 * (and drag-and-drop filtering) work for those files.
 */
export const IMAGE_ACCEPT_ATTRIBUTE =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";

export const ACCEPTED_FORMATS_TEXT = "JPEG, PNG, WebP or HEIC/HEIF";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "jpe", "png", "webp", "heic", "heif"]);

export type ValidationResult =
  { ok: true; kind: DetectedImageKind } | { ok: false; message: string };

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 2 : 1)} MB`;
}

export async function validateImageFile(file: File): Promise<ValidationResult> {
  const name = file.name || "This file";
  const unsupported = (why: string): ValidationResult => ({
    ok: false,
    message: `“${name}” ${why} Accepted formats: ${ACCEPTED_FORMATS_TEXT}.`,
  });

  if (file.size === 0) return unsupported("is empty.");
  if (file.size > MAX_ORIGINAL_BYTES) {
    return {
      ok: false,
      message: `“${name}” is ${formatBytes(file.size)} — photos must be ${formatBytes(MAX_ORIGINAL_BYTES)} or smaller.`,
    };
  }

  // Cheap gate on the declared type / extension. An empty or generic MIME type is
  // tolerated (that is how HEIC often arrives); a clearly different one is not.
  const mime = file.type.toLowerCase();
  const mimeAmbiguous = mime === "" || mime === "application/octet-stream";
  if (!ALLOWED_MIME.has(mime) && !ALLOWED_EXT.has(extensionOf(file.name)) && !mimeAmbiguous) {
    return unsupported("is not a supported photo format.");
  }

  // Authoritative check: the file's own bytes.
  let head: Uint8Array;
  try {
    head = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
  } catch {
    return unsupported("could not be read.");
  }
  const kind = detectImageKind(head);
  if (!kind)
    return unsupported("is not a valid image of a supported type, or the file is corrupt.");

  const jpeg = kind === "jpeg" ? readJpegMeta(head) : null;
  if (kind === "jpeg" && !jpeg) return unsupported("looks like a corrupt or incomplete JPEG.");

  // Truncated downloads keep a valid header and would otherwise be "repaired" into a half-grey photo.
  try {
    if (kind === "jpeg" && jpeg) {
      const whole = new Uint8Array(await file.arrayBuffer()); // <= 5 MB, checked above
      if (!jpegIsComplete(whole, jpeg.scanStart))
        return unsupported("is incomplete or corrupt (the file ends too early).");
    } else if (kind === "png") {
      const tail = new Uint8Array(await file.slice(Math.max(0, file.size - 2048)).arrayBuffer());
      if (!pngHasEnd(tail))
        return unsupported("is incomplete or corrupt (the file ends too early).");
    } else if (kind === "webp" && !webpIsComplete(head, file.size)) {
      return unsupported("is incomplete or corrupt (the file ends too early).");
    }
  } catch {
    return unsupported("could not be read.");
  }
  const size = readImageSize(head, kind, jpeg);
  if (size && (size.width === 0 || size.height === 0)) return unsupported("is a corrupt image.");
  if (size && size.width * size.height > MAX_PIXELS) {
    return {
      ok: false,
      message: `“${name}” is ${size.width}×${size.height} pixels — too large to process safely. Please use a smaller photo.`,
    };
  }

  return { ok: true, kind };
}
