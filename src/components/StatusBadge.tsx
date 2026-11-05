const tones: Record<string, string> = {
  available: "bg-success/15 text-success",
  confirmed: "bg-success/15 text-success",
  paid: "bg-success/15 text-success",
  answered: "bg-success/15 text-success",
  approved: "bg-success/15 text-success",
  completed: "bg-accent/15 text-accent",
  reserved: "bg-accent/15 text-accent",
  "in-progress": "bg-accent/15 text-accent",
  new: "bg-accent/15 text-accent",
  pending: "bg-warning/15 text-warning",
  sold: "bg-muted text-mist",
  closed: "bg-muted text-mist",
  cancelled: "bg-destructive/15 text-destructive",
  rejected: "bg-destructive/15 text-destructive",
  refunded: "bg-warning/15 text-warning",
  failed: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = tones[status] ?? "bg-muted text-mist";
  const label = status.replace("-", " ");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${tone}`}
    >
      {label}
    </span>
  );
}
