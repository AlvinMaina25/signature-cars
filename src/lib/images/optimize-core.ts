/**
 * Image optimisation core. Runs unchanged in a Web Worker (OffscreenCanvas) or
 * on the main thread (HTMLCanvasElement) — see optimize.ts for the dispatcher.
 *
 * Pipeline: decode (EXIF-aware) → cap longest side → WebP @ 0.85 → MEASURE the
 * result against the resized source → only if the measurement fails, raise the
 * quality (never lower it) → keep the original whenever the output is not
 * clearly smaller or quality cannot be confirmed.
 */

import { readJpegMeta } from "./jpeg-meta";
import {
  compareImages,
  compositeOnto,
  meetsThresholds,
  type QualityReport,
  type QualityThresholds,
} from "./quality";

/* ───────────────────────────── configuration ───────────────────────────── */

/** Longest side, in px. Images already within it are never resized or upscaled. */
export const MAX_DIMENSION = 1920;

/** First attempt, then higher qualities only if the measured result is not good enough. */
export const WEBP_QUALITY_STEPS = [0.85, 0.9, 0.95] as const;

/** Used only when the browser cannot encode WebP from a canvas (e.g. Safari). */
export const JPEG_FALLBACK_QUALITY = 0.92;

/** A re-encode must save at least this fraction of the original, otherwise the original is kept. */
export const MIN_SAVINGS_RATIO = 0.1;

/** WebP/JPEG at or below this many bits per pixel (and within MAX_DIMENSION) is treated as already optimised. */
export const ALREADY_OPTIMIZED_BITS_PER_PIXEL = 1.0;

/**
 * Heuristic acceptance thresholds for the objective comparison in quality.ts.
 *
 * They were set from measurements of Chromium's WebP encoder on a handful of
 * test photos (noisy 12 MP phone-style JPEG, hi-res vehicle shot with plate and
 * fine text, transparent PNG, screenshot): at q=0.85 those scored SSIM
 * 0.978–0.999 (worst-5% blocks 0.956+), mean error <= 2.1/255 and colour shift
 * ~0.1/255, while q=0.75 fell below the thresholds. They act as a safety net
 * that triggers a quality increase on unusually hard content. They are NOT a
 * validated measure of perceived quality.
 */
export const QUALITY_THRESHOLDS: QualityThresholds = {
  ssimMean: 0.975,
  ssimP5: 0.94,
  meanAbsError: 3,
  colorShift: 1,
};

/* ─────────────────────────────── public types ──────────────────────────── */

export type SourceKind = "jpeg" | "png" | "webp";

export type OptimizeOutcome =
  /** The re-encoded file replaced the original. */
  | "optimized"
  /** Original is small / already compressed — not touched. */
  | "skipped-already-optimized"
  /** Re-encoding did not save enough (or was larger) — original kept. */
  | "kept-original-not-smaller"
  /** Quality could not be confirmed at an acceptable size — original kept. */
  | "kept-original-quality";

export type OptimizeStage = "decoding" | "resizing" | "encoding" | "verifying";

export interface CoreInput {
  blob: Blob;
  kind: SourceKind;
  /**
   * True when `blob` is itself a conversion product (HEIC → JPEG) and the real
   * original cannot be kept. Disables the "skip"/"minimum savings" shortcuts.
   */
  isIntermediate: boolean;
}

export interface CoreResult {
  blob: Blob;
  mime: "image/webp" | "image/jpeg" | "image/png";
  outcome: OptimizeOutcome;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  resized: boolean;
  hasAlpha: boolean;
  /** Encoder quality used for the returned file (undefined when the original was kept). */
  quality?: number;
  /** Measurement of the returned file vs. the resized source (undefined when not measured). */
  report?: QualityReport;
  /** True only when the returned file was measured and met QUALITY_THRESHOLDS. */
  qualityVerified: boolean;
  attempts: number;
  /** True when WebP encoding was unavailable and JPEG was used instead. */
  webpUnavailable: boolean;
}

export type OptimizeErrorCode = "decode-failed" | "encode-failed" | "unsupported-environment";

export class ImageOptimizeError extends Error {
  readonly code: OptimizeErrorCode;
  constructor(code: OptimizeErrorCode, message: string) {
    super(message);
    this.name = "ImageOptimizeError";
    this.code = code;
  }
}

type Progress = (stage: OptimizeStage, fraction: number) => void;
type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type Ctx2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

/* ─────────────────────────────── canvas helpers ────────────────────────── */

function makeCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  if (typeof document === "undefined") {
    throw new ImageOptimizeError(
      "unsupported-environment",
      "No canvas available in this environment.",
    );
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context(canvas: AnyCanvas): Ctx2D {
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as Ctx2D | null;
  if (!ctx) throw new ImageOptimizeError("unsupported-environment", "Canvas 2D is not available.");
  return ctx;
}

function release(canvas: AnyCanvas) {
  canvas.width = 0;
  canvas.height = 0;
}

function encode(canvas: AnyCanvas, type: string, quality: number): Promise<Blob | null> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type, quality }).catch(() => null);
  return new Promise((resolve) => (canvas as HTMLCanvasElement).toBlob(resolve, type, quality));
}

/* ─────────────────────────────────── decoding ──────────────────────────── */

type Drawable = ImageBitmap | HTMLImageElement | AnyCanvas;

interface Decoded {
  source: Drawable;
  width: number;
  height: number;
  dispose: () => void;
}

/** Draws `bitmap` into a new canvas applying EXIF orientation 2–8 by hand. */
export function applyOrientation(bitmap: ImageBitmap, orientation: number): AnyCanvas {
  const { width, height } = bitmap;
  const swap = orientation >= 5 && orientation <= 8;
  const canvas = makeCanvas(swap ? height : width, swap ? width : height);
  const ctx = context(canvas);
  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      break;
  }
  ctx.drawImage(bitmap, 0, 0);
  return canvas;
}

async function decode(blob: Blob, kind: SourceKind): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      let source: Drawable = bitmap;
      let { width, height } = bitmap;
      let extra: AnyCanvas | null = null;

      // Safety net: some engines ignore `imageOrientation`. For JPEGs with a
      // 90° EXIF rotation we can tell (the stored size is unswapped) and fix it.
      if (kind === "jpeg") {
        const head = new Uint8Array(await blob.slice(0, 256 * 1024).arrayBuffer());
        const meta = readJpegMeta(head);
        if (
          meta &&
          meta.orientation >= 5 &&
          meta.width !== meta.height &&
          bitmap.width === meta.width &&
          bitmap.height === meta.height
        ) {
          const raw = await createImageBitmap(blob, { imageOrientation: "none" });
          // Guard: in engines that treat "none" as "from-image" the bitmap is already upright —
          // never rotate twice.
          if (raw.width === meta.width && raw.height === meta.height) {
            extra = applyOrientation(raw, meta.orientation);
            bitmap.close();
            source = extra;
            width = extra.width;
            height = extra.height;
          }
          raw.close();
        }
      }

      return {
        source,
        width,
        height,
        dispose: () => {
          if (extra) release(extra);
          else bitmap.close();
        },
      };
    } catch {
      /* fall through to <img> decoding on the main thread */
    }
  }

  if (typeof document === "undefined" || typeof Image === "undefined") {
    throw new ImageOptimizeError("decode-failed", "This image could not be decoded.");
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    // <img> honours EXIF orientation by default in all current browsers.
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      dispose: () => undefined,
    };
  } catch {
    throw new ImageOptimizeError("decode-failed", "This image could not be decoded.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Resizes in halving steps (better detail retention than one big jump on some engines). */
function drawResized(decoded: Decoded, targetW: number, targetH: number): AnyCanvas {
  let src: Drawable = decoded.source;
  let sw = decoded.width;
  let sh = decoded.height;
  const temps: AnyCanvas[] = [];

  while (Math.round(sw / 2) >= targetW && Math.round(sh / 2) >= targetH) {
    const w = Math.round(sw / 2);
    const h = Math.round(sh / 2);
    const step = makeCanvas(w, h);
    const sctx = context(step);
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(src as CanvasImageSource, 0, 0, w, h);
    temps.push(step);
    src = step;
    sw = w;
    sh = h;
  }

  const out = makeCanvas(targetW, targetH);
  const ctx = context(out);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src as CanvasImageSource, 0, 0, targetW, targetH);
  // The final canvas may be the only thing still referencing a temp — release the rest.
  for (const t of temps) release(t);
  return out;
}

function hasTransparency(data: Uint8ClampedArray): boolean {
  for (let p = 3; p < data.length; p += 4) if (data[p]! < 255) return true;
  return false;
}

/** Decodes an encoded candidate back to pixels so it can be compared with the reference. */
async function candidatePixels(
  blob: Blob,
  width: number,
  height: number,
): Promise<Uint8ClampedArray> {
  const decoded = await decode(blob, "webp");
  try {
    if (decoded.width !== width || decoded.height !== height) {
      throw new ImageOptimizeError("encode-failed", "Compressed image has unexpected dimensions.");
    }
    const canvas = makeCanvas(width, height);
    const ctx = context(canvas);
    ctx.drawImage(decoded.source as CanvasImageSource, 0, 0);
    const data = ctx.getImageData(0, 0, width, height).data;
    release(canvas);
    return data;
  } finally {
    decoded.dispose();
  }
}

/* ───────────────────────────────── pipeline ────────────────────────────── */

export async function optimizeImageCore(
  input: CoreInput,
  onProgress: Progress = () => {},
): Promise<CoreResult> {
  const { blob, kind, isIntermediate } = input;
  onProgress("decoding", 0);
  const decoded = await decode(blob, kind);
  const originalWidth = decoded.width;
  const originalHeight = decoded.height;

  const baseResult = {
    originalWidth,
    originalHeight,
    width: originalWidth,
    height: originalHeight,
    resized: false,
    hasAlpha: false,
    qualityVerified: false,
    attempts: 0,
    webpUnavailable: false,
  };
  const keepOriginal = (outcome: OptimizeOutcome, extra: Partial<CoreResult> = {}): CoreResult => ({
    ...baseResult,
    blob,
    mime:
      blob.type === "image/png"
        ? "image/png"
        : blob.type === "image/webp"
          ? "image/webp"
          : "image/jpeg",
    outcome,
    ...extra,
  });

  try {
    const longest = Math.max(originalWidth, originalHeight);
    const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1;
    const width = Math.max(1, Math.round(originalWidth * scale));
    const height = Math.max(1, Math.round(originalHeight * scale));
    const resized = scale < 1;

    // Already small and already compressed: re-encoding would only add generation loss.
    if (!isIntermediate && (kind === "jpeg" || kind === "webp") && !resized) {
      const bitsPerPixel = (blob.size * 8) / (originalWidth * originalHeight);
      if (bitsPerPixel <= ALREADY_OPTIMIZED_BITS_PER_PIXEL) {
        decoded.dispose();
        return keepOriginal("skipped-already-optimized");
      }
    }

    onProgress("resizing", 0.15);
    const reference = drawResized(decoded, width, height);
    decoded.dispose();
    const refCtx = context(reference);
    const refData = refCtx.getImageData(0, 0, width, height).data;
    const hasAlpha = kind !== "jpeg" && hasTransparency(refData);
    const geometry = { width, height, resized, hasAlpha };

    // Backgrounds used to compare transparent images (worst case of both must pass).
    const backgrounds = hasAlpha ? [255, 0] : [null];
    const references = backgrounds.map((bg) =>
      bg === null ? refData : compositeOnto(refData, bg),
    );

    const measure = async (candidate: Blob) => {
      const pixels = await candidatePixels(candidate, width, height);
      let worst: QualityReport | null = null;
      let pass = true;
      for (let i = 0; i < backgrounds.length; i++) {
        const bg = backgrounds[i] ?? null;
        const report = compareImages(
          references[i]!,
          bg === null ? pixels : compositeOnto(pixels, bg),
          width,
          height,
        );
        if (!meetsThresholds(report, QUALITY_THRESHOLDS)) pass = false;
        if (!worst || report.ssimMean < worst.ssimMean) worst = report;
      }
      return { report: worst!, pass };
    };

    const isUsable = (candidate: Blob) =>
      isIntermediate ? true : candidate.size <= blob.size * (1 - MIN_SAVINGS_RATIO);

    let attempts = 0;
    let webpUnavailable = false;
    let best: {
      blob: Blob;
      mime: CoreResult["mime"];
      quality: number;
      report: QualityReport;
      pass: boolean;
    } | null = null;

    for (let i = 0; i < WEBP_QUALITY_STEPS.length; i++) {
      const quality = WEBP_QUALITY_STEPS[i]!;
      onProgress("encoding", 0.3 + (i / WEBP_QUALITY_STEPS.length) * 0.5);
      const candidate = await encode(reference, "image/webp", quality);
      if (!candidate || candidate.type !== "image/webp") {
        webpUnavailable = true; // e.g. Safari silently returns PNG
        break;
      }
      attempts++;
      if (!isUsable(candidate)) {
        // Higher qualities only get bigger, so stop and keep the original.
        release(reference);
        return keepOriginal("kept-original-not-smaller", { ...geometry, attempts });
      }
      onProgress("verifying", 0.35 + (i / WEBP_QUALITY_STEPS.length) * 0.5);
      const { report, pass } = await measure(candidate);
      best = { blob: candidate, mime: "image/webp", quality, report, pass };
      if (pass) break;
    }

    // WebP unavailable → high-quality JPEG (opaque images only; JPEG would flatten transparency).
    if (!best && webpUnavailable && !hasAlpha) {
      onProgress("encoding", 0.6);
      const candidate = await encode(reference, "image/jpeg", JPEG_FALLBACK_QUALITY);
      if (candidate && candidate.type === "image/jpeg") {
        attempts++;
        if (isUsable(candidate)) {
          onProgress("verifying", 0.8);
          const { report, pass } = await measure(candidate);
          best = {
            blob: candidate,
            mime: "image/jpeg",
            quality: JPEG_FALLBACK_QUALITY,
            report,
            pass,
          };
        }
      }
    }
    release(reference);

    if (best && best.pass) {
      return {
        ...baseResult,
        ...geometry,
        blob: best.blob,
        mime: best.mime,
        outcome: "optimized",
        quality: best.quality,
        report: best.report,
        qualityVerified: true,
        attempts,
        webpUnavailable,
      };
    }

    // Nothing passed the measurement.
    if (!isIntermediate) {
      return keepOriginal(best ? "kept-original-quality" : "kept-original-not-smaller", {
        ...geometry,
        attempts,
        webpUnavailable,
        ...(best ? { report: best.report } : {}),
      });
    }
    // HEIC intermediate: the true original cannot be stored, so return the best
    // (highest-quality) candidate — clearly marked as unverified — or the intermediate itself.
    if (best) {
      return {
        ...baseResult,
        ...geometry,
        blob: best.blob,
        mime: best.mime,
        outcome: "optimized",
        quality: best.quality,
        report: best.report,
        qualityVerified: false,
        attempts,
        webpUnavailable,
      };
    }
    return keepOriginal("kept-original-quality", { ...geometry, attempts, webpUnavailable });
  } catch (error) {
    decoded.dispose();
    throw error;
  }
}
