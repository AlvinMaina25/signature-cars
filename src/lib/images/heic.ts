/**
 * HEIC/HEIF → JPEG, in the browser. The decoder (heic2any, which bundles libheif
 * as WebAssembly, ~1 MB) is imported lazily: it is only downloaded when someone
 * actually selects a HEIC/HEIF file, so everyone else pays nothing.
 *
 * The JPEG produced here is a high-quality INTERMEDIATE (q 0.95) — the normal
 * optimisation pipeline then resizes and encodes it to WebP.
 */

export const HEIC_INTERMEDIATE_QUALITY = 0.95;

export class HeicDecodeError extends Error {
  readonly stage: "load" | "decode";
  constructor(stage: "load" | "decode", message: string) {
    super(message);
    this.name = "HeicDecodeError";
    this.stage = stage;
  }
}

// HEIC decoding is memory-hungry; run one at a time even if several files were picked.
let queue: Promise<unknown> = Promise.resolve();

export function convertHeicToJpeg(file: Blob): Promise<Blob> {
  const run = queue.then(() => convert(file));
  queue = run.catch(() => undefined);
  return run;
}

async function convert(file: Blob): Promise<Blob> {
  let heic2any: typeof import("heic2any").default;
  try {
    heic2any = (await import("heic2any")).default;
  } catch {
    throw new HeicDecodeError("load", "The HEIC converter could not be loaded.");
  }
  try {
    const out = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: HEIC_INTERMEDIATE_QUALITY,
    });
    const blob = Array.isArray(out) ? out[0] : out; // multi-image HEIC: first image
    if (!blob || blob.size === 0) throw new Error("empty result");
    return blob;
  } catch {
    throw new HeicDecodeError("decode", "This HEIC file could not be decoded.");
  }
}
