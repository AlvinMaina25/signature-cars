/**
 * Public API for browser-side photo preparation.
 *
 *   const prepared = await prepareImageForUpload(file, { onProgress, signal });
 *   // upload prepared.blob as prepared.contentType
 *
 * validate (signature + size) → [HEIC → JPEG, lazily] → optimise in a Web Worker
 * (falling back to the main thread where workers/OffscreenCanvas are missing).
 * Every failure is thrown as an ImagePrepareError whose `message` is safe to show.
 */

import { convertHeicToJpeg, HeicDecodeError } from "./heic";
import type { DetectedImageKind } from "./file-signature";
import {
  ImageOptimizeError,
  optimizeImageCore,
  type CoreInput,
  type CoreResult,
  type OptimizeOutcome,
  type OptimizeStage,
} from "./optimize-core";
import type { QualityReport } from "./quality";
import { ACCEPTED_FORMATS_TEXT, validateImageFile } from "./validate";
import type { WorkerMessage } from "./optimize.worker";

export type PrepareStage = "validating" | "converting-heic" | OptimizeStage;

export interface PreparedImage {
  blob: Blob;
  contentType: "image/webp" | "image/jpeg" | "image/png";
  extension: "webp" | "jpg" | "png";
  originalBytes: number;
  optimizedBytes: number;
  /** Positive = smaller than the original. 0 when the original was kept; negative only for HEIC (must be converted to be viewable). */
  savedPercent: number;
  outcome: OptimizeOutcome;
  fromHeic: boolean;
  width: number;
  height: number;
  resized: boolean;
  hasAlpha: boolean;
  /** True only if the returned file was measured against the source and met the thresholds. */
  qualityVerified: boolean;
  quality?: number;
  report?: QualityReport;
  /** True when this browser cannot encode WebP from a canvas and JPEG was used instead. */
  webpUnavailable: boolean;
}

export class ImagePrepareError extends Error {
  readonly code: "invalid" | "heic" | "corrupt" | "processing" | "aborted";
  constructor(code: ImagePrepareError["code"], message: string) {
    super(message);
    this.name = "ImagePrepareError";
    this.code = code;
  }
}

export interface PrepareOptions {
  signal?: AbortSignal;
  onProgress?: (stage: PrepareStage, fraction: number) => void;
}

const MIME_FOR_KIND: Record<Exclude<DetectedImageKind, "heic">, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const corruptMessage = (name: string) =>
  `“${name}” could not be read — it may be corrupt. Accepted formats: ${ACCEPTED_FORMATS_TEXT}.`;

function workersUsable(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap === "function"
  );
}

function runInWorker(
  input: CoreInput,
  signal: AbortSignal | undefined,
  onStage: (s: OptimizeStage, f: number) => void,
) {
  return new Promise<CoreResult>((resolve, reject) => {
    const worker = new Worker(new URL("./optimize.worker.ts", import.meta.url), { type: "module" });
    const finish = (fn: () => void) => {
      signal?.removeEventListener("abort", onAbort);
      worker.terminate(); // frees all decoded bitmaps / canvases immediately
      fn();
    };
    const onAbort = () => finish(() => reject(new ImagePrepareError("aborted", "Cancelled.")));
    signal?.addEventListener("abort", onAbort, { once: true });

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type === "progress") onStage(msg.stage as OptimizeStage, msg.fraction);
      else if (msg.type === "done") finish(() => resolve(msg.result));
      else
        finish(() =>
          reject(new ImageOptimizeError(msg.code as ImageOptimizeError["code"], msg.message)),
        );
    };
    // Script failed to load/run (CSP, old browser, …): treated as "workers unavailable".
    worker.onerror = (event) => {
      event.preventDefault();
      finish(() =>
        reject(new ImageOptimizeError("unsupported-environment", "Worker failed to start.")),
      );
    };
    worker.postMessage(input);
  });
}

async function optimize(input: CoreInput, opts: PrepareOptions): Promise<CoreResult> {
  const onStage = (stage: OptimizeStage, fraction: number) => opts.onProgress?.(stage, fraction);
  if (workersUsable()) {
    try {
      return await runInWorker(input, opts.signal, onStage);
    } catch (error) {
      if (error instanceof ImagePrepareError) throw error; // aborted
      // Any worker-side failure: retry once on the main thread before giving up, so a
      // worker quirk is never reported to the user as a "corrupt file".
    }
  }
  if (opts.signal?.aborted) throw new ImagePrepareError("aborted", "Cancelled.");
  return optimizeImageCore(input, onStage);
}

export async function prepareImageForUpload(
  file: File,
  opts: PrepareOptions = {},
): Promise<PreparedImage> {
  const name = file.name || "This file";
  opts.onProgress?.("validating", 0);

  const validation = await validateImageFile(file);
  if (!validation.ok) throw new ImagePrepareError("invalid", validation.message);
  const { kind } = validation;
  if (opts.signal?.aborted) throw new ImagePrepareError("aborted", "Cancelled.");

  let input: CoreInput;
  if (kind === "heic") {
    opts.onProgress?.("converting-heic", 0);
    try {
      const jpeg = await convertHeicToJpeg(file);
      input = { blob: jpeg.slice(0, jpeg.size, "image/jpeg"), kind: "jpeg", isIntermediate: true };
    } catch (error) {
      const detail =
        error instanceof HeicDecodeError && error.stage === "load"
          ? "The HEIC converter could not be loaded — check your connection and try again, or"
          : "This HEIC photo could not be converted. Please";
      throw new ImagePrepareError(
        "heic",
        `“${name}”: ${detail} re-save the photo as JPEG and upload that instead.`,
      );
    }
  } else {
    // Re-type by detected content so a wrong/empty browser MIME never misleads the decoder or the upload.
    input = { blob: file.slice(0, file.size, MIME_FOR_KIND[kind]), kind, isIntermediate: false };
  }
  if (opts.signal?.aborted) throw new ImagePrepareError("aborted", "Cancelled.");

  let result: CoreResult;
  try {
    result = await optimize(input, opts);
  } catch (error) {
    if (error instanceof ImagePrepareError) throw error;
    if (error instanceof ImageOptimizeError && error.code === "decode-failed") {
      throw new ImagePrepareError(
        kind === "heic" ? "heic" : "corrupt",
        kind === "heic"
          ? `“${name}” could not be converted. Please re-save the photo as JPEG and upload that instead.`
          : corruptMessage(name),
      );
    }
    throw new ImagePrepareError(
      "processing",
      `“${name}” could not be processed. Please try again, or use a different photo.`,
    );
  }

  const extension =
    result.mime === "image/webp" ? "webp" : result.mime === "image/png" ? "png" : "jpg";
  return {
    blob:
      result.blob.type === result.mime
        ? result.blob
        : result.blob.slice(0, result.blob.size, result.mime),
    contentType: result.mime,
    extension,
    originalBytes: file.size,
    optimizedBytes: result.blob.size,
    savedPercent: Math.round((1 - result.blob.size / file.size) * 100),
    outcome: result.outcome,
    fromHeic: kind === "heic",
    width: result.width,
    height: result.height,
    resized: result.resized,
    hasAlpha: result.hasAlpha,
    qualityVerified: result.qualityVerified,
    webpUnavailable: result.webpUnavailable,
    ...(result.quality !== undefined ? { quality: result.quality } : {}),
    ...(result.report ? { report: result.report } : {}),
  };
}

/** Runs `worker` over `items` with at most `limit` in flight; results keep input order. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]!, index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return results;
}
