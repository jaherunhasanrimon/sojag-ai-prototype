/**
 * Footer — Displays ILLUSTRATIVE / SIMULATED labels on every screen.
 * design.md section 2, rule 2: every value carries an ILLUSTRATIVE or SIMULATED tag.
 */
export function Footer() {
  return (
    <footer
      id="illustrative-footer"
      className="w-full bg-navy border-t border-edge px-4 py-1.5 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <span className="text-[10px] text-muted uppercase tracking-widest font-mono">
          ILLUSTRATIVE
        </span>
        <span className="text-[10px] text-text-dim">•</span>
        <span className="text-[10px] text-muted uppercase tracking-widest font-mono">
          SIMULATED
        </span>
        <span className="text-[10px] text-text-dim">•</span>
        <span className="text-[10px] text-text-dim font-mono">
          All data, locations, times, and metrics are illustrative
        </span>
      </div>
      <div className="text-[10px] text-text-dim font-mono">
        SOTORKO AI Prototype — Demo metrics, not performance evidence
      </div>
    </footer>
  );
}
