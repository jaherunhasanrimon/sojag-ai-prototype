/**
 * Banner — Persistent honesty banner shown on every screen.
 * design.md section 2, rule 1: "PROTOTYPE: scripted detections on pre-labelled clips.
 * No AI model is running."
 */
export function Banner() {
  return (
    <div
      id="honesty-banner"
      className="w-full bg-amber/10 border-b border-amber/30 px-4 py-1.5 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="text-amber text-xs font-bold tracking-wider uppercase">
        ⚠ PROTOTYPE: scripted detections on pre-labelled clips. No AI model is running.
      </span>
    </div>
  );
}
