import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type { UploadItem, UploadStatus } from "@/hooks/useImageUploads";
import { formatBytes } from "@/lib/images/validate";

const STATUS_LABEL: Record<UploadStatus, string> = {
  queued: "Waiting…",
  checking: "Checking file…",
  converting: "Converting HEIC…",
  compressing: "Optimising photo…",
  uploading: "Uploading…",
  done: "",
  error: "",
};

function resultLine(stats: NonNullable<UploadItem["stats"]>): { main: string; note: string } {
  const {
    originalBytes,
    optimizedBytes,
    savedPercent,
    outcome,
    fromHeic,
    resized,
    webpUnavailable,
  } = stats;
  const sizes = `${formatBytes(originalBytes)} → ${formatBytes(optimizedBytes)}`;
  const notes: string[] = [];
  if (fromHeic) notes.push("converted from HEIC");
  if (resized) notes.push("resized to 1920px");

  if (outcome === "optimized") {
    const main =
      savedPercent >= 0
        ? `${sizes} · saved ${savedPercent}%`
        : `${sizes} · converted for compatibility`;
    return { main, note: notes.join(", ") };
  }
  const reason =
    outcome === "skipped-already-optimized"
      ? "already optimised — kept as is"
      : webpUnavailable && outcome === "kept-original-not-smaller"
        ? "original kept — this browser can't compress this photo type safely"
        : outcome === "kept-original-not-smaller"
          ? "original kept — recompressing wouldn't make it meaningfully smaller"
          : "original kept — recompressing would have reduced quality";
  return { main: `${formatBytes(originalBytes)} · saved 0%`, note: [reason, ...notes].join(", ") };
}

export function PhotoUploadStatus({
  items,
  onDismiss,
}: {
  items: UploadItem[];
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 space-y-2" aria-live="polite">
      {items.map((item) => {
        const inProgress = item.status !== "done" && item.status !== "error";
        const result = item.status === "done" && item.stats ? resultLine(item.stats) : null;
        return (
          <li key={item.id} className="rounded-xl border border-border px-3 py-2.5 text-sm">
            <div className="flex items-center gap-2">
              {inProgress && <Loader2 className="size-4 shrink-0 animate-spin text-mist" />}
              {item.status === "done" && <CheckCircle2 className="size-4 shrink-0 text-accent" />}
              {item.status === "error" && (
                <AlertCircle className="size-4 shrink-0 text-destructive" />
              )}
              <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
              {!inProgress && (
                <button
                  type="button"
                  onClick={() => onDismiss(item.id)}
                  aria-label={`Dismiss ${item.name}`}
                  className="grid size-6 shrink-0 place-items-center rounded-full text-mist hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            {inProgress && (
              <>
                <Progress
                  value={item.progress}
                  className="mt-2 h-1.5"
                  aria-label={`${item.name} progress`}
                />
                <p className="mt-1 text-xs text-mist">{STATUS_LABEL[item.status]}</p>
              </>
            )}
            {result && (
              <p className="mt-1 text-xs text-mist">
                {result.main}
                {result.note ? ` — ${result.note}` : ""}
              </p>
            )}
            {item.status === "error" && item.error && (
              <p className="mt-1 text-xs text-destructive">{item.error}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
