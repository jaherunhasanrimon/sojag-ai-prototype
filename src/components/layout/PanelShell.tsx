import type { ReactNode } from 'react';

/**
 * PanelShell — Wrapper for each of the three panels (A, B, C) in the control room.
 * Provides the dark panel background, border, and consistent spacing.
 */
interface PanelShellProps {
  id: string;
  title: string;
  /** Label shown next to the title (e.g. "Display A") */
  label?: string;
  children: ReactNode;
  className?: string;
}

export function PanelShell({ id, title, label, children, className = '' }: PanelShellProps) {
  return (
    <section
      id={id}
      className={`bg-panel border border-edge rounded-lg flex flex-col overflow-hidden ${className}`}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-edge bg-navy/50">
        <div className="flex items-center gap-2">
          {label && (
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider bg-edge/50 px-1.5 py-0.5 rounded">
              {label}
            </span>
          )}
          <h2 className="text-sm font-heading font-semibold text-text-primary">{title}</h2>
        </div>
        <span className="text-[9px] font-mono text-text-dim uppercase">ILLUSTRATIVE</span>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-auto p-2">
        {children}
      </div>
    </section>
  );
}
