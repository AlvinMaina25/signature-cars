/// <reference lib="webworker" />
/**
 * Web Worker wrapper around optimizeImageCore so decoding, resizing, encoding and
 * quality measurement never block the UI thread. One job per worker; the caller
 * terminates the worker afterwards, which also releases all of its memory.
 */

import { ImageOptimizeError, optimizeImageCore, type CoreInput } from "./optimize-core";

export type WorkerRequest = CoreInput;
export type WorkerMessage =
  | { type: "progress"; stage: string; fraction: number }
  | { type: "done"; result: Awaited<ReturnType<typeof optimizeImageCore>> }
  | { type: "error"; code: string; message: string };

const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    const result = await optimizeImageCore(event.data, (stage, fraction) =>
      scope.postMessage({ type: "progress", stage, fraction } satisfies WorkerMessage),
    );
    scope.postMessage({ type: "done", result } satisfies WorkerMessage);
  } catch (error) {
    scope.postMessage({
      type: "error",
      code: error instanceof ImageOptimizeError ? error.code : "unknown",
      message: error instanceof Error ? error.message : String(error),
    } satisfies WorkerMessage);
  }
};
