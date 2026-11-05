import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  ImagePrepareError,
  mapWithConcurrency,
  prepareImageForUpload,
  type PrepareStage,
  type PreparedImage,
} from "@/lib/images/optimize";
import {
  removeUnreferencedVehicleImages,
  removeVehicleImagePaths,
  uploadVehicleImage,
} from "@/services/vehicle-images";

/** Two photos at a time: enough to overlap upload with compression, light enough for phones. */
const CONCURRENCY = 2;

export type UploadStatus =
  "queued" | "checking" | "converting" | "compressing" | "uploading" | "done" | "error";

export type UploadStats = Pick<
  PreparedImage,
  | "originalBytes"
  | "optimizedBytes"
  | "savedPercent"
  | "outcome"
  | "fromHeic"
  | "resized"
  | "hasAlpha"
  | "webpUnavailable"
>;

export interface UploadItem {
  id: string;
  name: string;
  status: UploadStatus;
  /** 0–100. Upload itself has no byte-level progress, so it is shown as a stage. */
  progress: number;
  stats?: UploadStats;
  error?: string;
}

const STAGE_STATUS: Record<PrepareStage, UploadStatus> = {
  validating: "checking",
  "converting-heic": "converting",
  decoding: "compressing",
  resizing: "compressing",
  encoding: "compressing",
  verifying: "compressing",
};

function uploadErrorMessage(name: string, error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : "";
  if (/row-level security|not authorized|permission|403/i.test(raw)) {
    return `“${name}” could not be uploaded — your account doesn't have permission to upload photos.`;
  }
  if (/network|fetch|failed to/i.test(raw)) {
    return `“${name}” could not be uploaded — check your connection and try again.`;
  }
  return `“${name}” could not be uploaded${raw ? ` (${raw})` : ""}. Please try again.`;
}

/**
 * Validate → compress → upload, for any number of photos, with controlled concurrency.
 * Only the optimised file is uploaded. Files that were uploaded during this session but
 * not yet saved on a listing are tracked so they can be removed again if discarded.
 */
export function useImageUploads(onUploaded: (urls: string[]) => void) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const sessionUrls = useRef(new Set<string>());
  const onUploadedRef = useRef(onUploaded);
  onUploadedRef.current = onUploaded;

  useEffect(() => () => controllerRef.current?.abort(), []);

  const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  }, []);

  const startUploads = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const controller = new AbortController();
      controllerRef.current = controller;
      const { signal } = controller;

      const batch: UploadItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name || "photo",
        status: "queued",
        progress: 0,
      }));
      setItems(batch);
      setBusy(true);

      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) {
          setItems(
            batch.map((item) => ({
              ...item,
              status: "error",
              error: "Please sign in to upload photos.",
            })),
          );
          return;
        }
        const userId = auth.user.id;

        const urls = await mapWithConcurrency(files, CONCURRENCY, async (file, index) => {
          const item = batch[index]!;
          let uploadedPath: string | null = null;
          try {
            const prepared = await prepareImageForUpload(file, {
              signal,
              onProgress: (stage, fraction) =>
                patch(item.id, {
                  status: STAGE_STATUS[stage],
                  progress:
                    stage === "validating"
                      ? 2
                      : stage === "converting-heic"
                        ? 8
                        : Math.round(12 + fraction * 78),
                }),
            });
            if (signal.aborted) return null;

            patch(item.id, { status: "uploading", progress: 92 });
            const { url, path } = await uploadVehicleImage(prepared, userId);
            uploadedPath = path;

            if (signal.aborted) {
              // The form went away while this was uploading: don't leave an orphan behind.
              await removeVehicleImagePaths([path]);
              return null;
            }
            sessionUrls.current.add(url);
            patch(item.id, {
              status: "done",
              progress: 100,
              stats: {
                originalBytes: prepared.originalBytes,
                optimizedBytes: prepared.optimizedBytes,
                savedPercent: prepared.savedPercent,
                outcome: prepared.outcome,
                fromHeic: prepared.fromHeic,
                resized: prepared.resized,
                hasAlpha: prepared.hasAlpha,
                webpUnavailable: prepared.webpUnavailable,
              },
            });
            return url;
          } catch (error) {
            if (error instanceof ImagePrepareError && error.code === "aborted") return null;
            // A failed upload creates no object; if anything did get stored, remove it.
            if (uploadedPath) await removeVehicleImagePaths([uploadedPath]);
            patch(item.id, {
              status: "error",
              progress: 0,
              error:
                error instanceof ImagePrepareError
                  ? error.message
                  : uploadErrorMessage(item.name, error),
            });
            return null;
          }
        });

        if (!signal.aborted) {
          const ok = urls.filter((url): url is string => url !== null);
          if (ok.length > 0) onUploadedRef.current(ok); // selection order is preserved
        }
      } finally {
        setBusy(false);
      }
    },
    [patch],
  );

  const dismiss = useCallback(
    (id: string) => setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );

  /** Call when a photo uploaded in this session is removed from the form before saving. */
  const discardUploaded = useCallback((url: string) => {
    if (!sessionUrls.current.delete(url)) return; // not ours → it belongs to a saved listing; cleaned up on save
    void removeUnreferencedVehicleImages([url]);
  }, []);

  return { items, busy, startUploads, dismiss, discardUploaded };
}
