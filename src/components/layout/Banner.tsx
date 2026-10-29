/**
 * Banner — Persistent honesty banner shown on every screen.
 * design.md section 2, rule 1: "PROTOTYPE: scripted detections on pre-labelled clips.
 * No AI model is running."
 *
 * Enhanced with scrolling marquee and premium amber accent styling.
 */
export function Banner() {
  const msg = 'PROTOTYPE: scripted detections on pre-labelled clips. No AI model is running.';
  // Repeat the message so the marquee appears continuous
  const repeated = `${msg}   ·   ${msg}   ·   ${msg}   ·   `;

  return (
    <div
      id="honesty-banner"
      role="status"
      aria-live="polite"
      aria-label={msg}
      className="w-full overflow-hidden relative"
      style={{
        background: 'linear-gradient(90deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.14) 50%, rgba(251,191,36,0.08) 100%)',
        borderBottom: '1px solid rgba(251,191,36,0.25)',
      }}
    >
      {/* Left fade */}
      <div
        className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(7,14,36,0.9), transparent)' }}
      />
      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(270deg, rgba(7,14,36,0.9), transparent)' }}
      />

      {/* Static label pill on the left */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
        <span
          className="w-1.5 h-1.5 rounded-full bg-amber flex-shrink-0"
          style={{ animation: 'alert-pulse 2s ease-in-out infinite' }}
        />
        <span className="text-[9px] font-mono font-bold text-amber uppercase tracking-widest whitespace-nowrap">
          ⚠ PROTOTYPE
        </span>
      </div>

      {/* Scrolling text */}
      <div className="py-1 pl-28">
        <div
          className="whitespace-nowrap text-amber text-[10px] font-mono font-semibold tracking-wide inline-block"
          style={{ animation: 'banner-slide 28s linear infinite' }}
          aria-hidden="true"
        >
          {repeated}{repeated}
        </div>
      </div>
    </div>
  );
}
