/**
 * Footer — Displays ILLUSTRATIVE / SIMULATED labels on every screen.
 * design.md section 2, rule 2: every value carries an ILLUSTRATIVE or SIMULATED tag.
 *
 * Enhanced with premium dark footer design and system status indicators.
 */
export function Footer() {
  return (
    <footer
      id="illustrative-footer"
      className="w-full flex items-center justify-between px-4 py-1"
      style={{
        background: 'linear-gradient(180deg, rgba(7,14,36,0) 0%, rgba(7,14,36,0.95) 100%)',
        borderTop: '1px solid rgba(28,42,82,0.8)',
      }}
    >
      {/* Left — disclaimer tags */}
      <div className="flex items-center gap-3">
        <span
          className="text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded"
          style={{
            color: 'rgba(143,163,199,0.7)',
            border: '1px solid rgba(28,42,82,0.8)',
            background: 'rgba(28,42,82,0.3)',
          }}
        >
          ILLUSTRATIVE
        </span>
        <span className="text-text-dim text-[9px]">·</span>
        <span
          className="text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded"
          style={{
            color: 'rgba(143,163,199,0.7)',
            border: '1px solid rgba(28,42,82,0.8)',
            background: 'rgba(28,42,82,0.3)',
          }}
        >
          SIMULATED
        </span>
        <span className="text-text-dim text-[9px]">·</span>
        <span className="text-[9px] text-text-dim font-mono">
          All data, locations, times, and metrics are illustrative
        </span>
      </div>

      {/* Center — system status */}
      <div className="flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-lime" style={{ animation: 'blink-dot 3s ease-in-out infinite' }} />
        <span className="text-[9px] font-mono text-text-dim">SYSTEM ONLINE</span>
      </div>

      {/* Right — product name */}
      <div className="text-[9px] text-text-dim font-mono tracking-wider">
        <span className="text-muted font-bold">SOTORKO</span>
        <span className="text-text-dim"> AI Prototype</span>
        <span className="text-text-dim mx-1">·</span>
        <span className="text-text-dim">Demo metrics, not performance evidence</span>
      </div>
    </footer>
  );
}
