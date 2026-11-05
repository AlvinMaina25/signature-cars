# Vehicle photo uploads

Every photo goes through one pipeline before it reaches Supabase Storage
(`src/lib/images/`, used by `VehicleForm` → admin new/edit and `/sell`).

1. **Validate** (`validate.ts`) — max 5 MB original; JPEG, PNG, WebP, HEIC/HEIF. The file's
   _bytes_ decide (`file-signature.ts`), not its name or MIME type; truncated files and
   absurd pixel counts are rejected with a message listing the accepted formats.
2. **HEIC** (`heic.ts`) — `heic2any` is imported lazily, only when a HEIC/HEIF file is chosen,
   and produces a q0.95 JPEG intermediate. Failure → "re-save as JPEG" message.
3. **Optimise** (`optimize-core.ts`, run in a Web Worker via `optimize.worker.ts`, main-thread
   fallback) — EXIF orientation applied, longest side capped at 1920 px (never upscaled),
   WebP at q0.85. The result is decoded again and **measured** against the resized source
   (`quality.ts`: block SSIM mean + worst-5%, mean error, colour shift). If it misses the
   thresholds, quality is _raised_ (0.90, 0.95) — never lowered. If the result is not at least
   10 % smaller, or quality can't be confirmed, the original file is uploaded unchanged.
   Already-compressed small JPEG/WebP (≤ 1 bit/pixel, within 1920 px) are skipped.
   Transparent images keep their alpha channel (never flattened onto a background).
4. **Upload** (`services/vehicle-images.ts`) — only the final file, to the existing
   `vehicle-images` bucket, path `<userId>/<uuid>.<webp|jpg|png>`.

Cleanup: files removed from the form before saving are deleted at once; files replaced or
dropped when a listing is saved, and a listing's files when it is deleted, are removed
afterwards — only if no `car_images` row still references them. Cleanup is best-effort.

The thresholds in `optimize-core.ts` are heuristics calibrated on a few test photos. They are a
safety net, not a guarantee of perceived quality.
