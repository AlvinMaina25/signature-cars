/** Signature aurora glow behind every surface of the site. */
export function AuroraBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="aurora-blob animate-floaty -top-40 -left-32 h-[560px] w-[560px] bg-accent/25" />
      <div
        className="aurora-blob top-1/3 right-0 h-[520px] w-[520px] bg-glow/25"
        style={{ animation: "floaty 11s ease-in-out infinite" }}
      />
      <div className="aurora-blob bottom-[-160px] left-1/3 h-[440px] w-[440px] bg-accent/15" />
    </div>
  );
}
