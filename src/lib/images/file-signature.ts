/**
 * Identifies an image by its leading bytes ("magic numbers"), never by the
 * file name or the browser-reported MIME type — iOS/Android frequently report
 * HEIC with an empty or wrong type, and users can rename any file.
 *
 * Pure functions only: safe to run in the main thread, a worker or Node.
 */

export type DetectedImageKind = "jpeg" | "png" | "webp" | "heic";

/** How many leading bytes `detectImageKind` needs to see. */
export const SIGNATURE_BYTES = 64;

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs"]);
const HEIF_GENERIC_BRANDS = new Set(["mif1", "msf1"]);

function ascii(bytes: Uint8Array, start: number, length: number): string {
  let out = "";
  for (let i = start; i < start + length && i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i] ?? 0);
  }
  return out;
}

export function detectImageKind(bytes: Uint8Array): DetectedImageKind | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    ascii(bytes, 1, 3) === "PNG" &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }

  // WebP: "RIFF" <size> "WEBP"
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "webp";

  // HEIC/HEIF: ISO-BMFF "ftyp" box at offset 4.
  if (ascii(bytes, 4, 4) === "ftyp") {
    const major = ascii(bytes, 8, 4);
    const boxSize =
      ((bytes[0] ?? 0) << 24) | ((bytes[1] ?? 0) << 16) | ((bytes[2] ?? 0) << 8) | (bytes[3] ?? 0);
    const end = Math.min(bytes.length, boxSize > 16 ? boxSize : 32);
    const compatible: string[] = [];
    for (let i = 16; i + 4 <= end; i += 4) compatible.push(ascii(bytes, i, 4));

    // AVIF shares the generic "mif1" brand with HEIC; it is not supported here.
    if (major === "avif" || major === "avis" || compatible.includes("avif")) return null;
    if (HEIC_BRANDS.has(major)) return "heic";
    if (HEIF_GENERIC_BRANDS.has(major) && compatible.some((brand) => HEIC_BRANDS.has(brand))) {
      return "heic";
    }
  }

  return null;
}

/**
 * Pixel dimensions read from the file header (no decoding), used to refuse
 * "decompression bombs" — a tiny PNG can declare 30000×30000 pixels and exhaust
 * a phone's memory when decoded. Returns null when not determinable (e.g. HEIC).
 */
export function readImageSize(
  bytes: Uint8Array,
  kind: DetectedImageKind,
  jpegSize?: { width: number; height: number } | null,
): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (kind === "png" && bytes.length >= 24) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (kind === "jpeg") return jpegSize ?? null;
  if (kind === "webp" && bytes.length >= 30) {
    const chunk = ascii(bytes, 12, 4);
    if (chunk === "VP8X") {
      const w = 1 + ((bytes[24] ?? 0) | ((bytes[25] ?? 0) << 8) | ((bytes[26] ?? 0) << 16));
      const h = 1 + ((bytes[27] ?? 0) | ((bytes[28] ?? 0) << 8) | ((bytes[29] ?? 0) << 16));
      return { width: w, height: h };
    }
    if (chunk === "VP8 ") {
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    }
    if (chunk === "VP8L" && bytes[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

/** Cheap structural completeness checks for PNG and WebP (JPEG: see jpegIsComplete). */
export function pngHasEnd(tail: Uint8Array): boolean {
  for (let i = tail.length - 8; i >= 0 && i >= tail.length - 2048; i--) {
    if (ascii(tail, i, 4) === "IEND") return true;
  }
  return false;
}

export function webpIsComplete(head: Uint8Array, fileSize: number): boolean {
  if (head.length < 8) return false;
  const declared =
    new DataView(head.buffer, head.byteOffset, head.byteLength).getUint32(4, true) + 8;
  return declared <= fileSize;
}
