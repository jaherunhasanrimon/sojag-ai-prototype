import type { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * PanelShell — Wrapper for each of the three panels (A, B, C) in the control room.
 * Provides the dark panel background, border, and consistent spacing.
 * Automatically wraps content in a panel-level ErrorBoundary for resilience.
 *
 * Enhanced with glassmorphism, glowing top-border accent, and animated header.
 */
interface PanelShellProps {
  id: string;
  title: string;
  /** Label shown next to the title (e.g. "Display A") */
  label?: string;
  children: ReactNode;
  className?: string;
}

const LABEL_ACCENTS: Record<string, string> = {
  'Display A': 'rgba(34,211,238,0.8)',   // cyan — surveillance wall
  'Display B': 'rgba(224,69,123,0.8)',   // magenta — incident screen
  'Display C': 'rgba(198,244,50,0.8)',   // lime — queue
};

export function PanelShell({ id, title, label, children, className = '' }: PanelShellProps) {
  const accentColor = label ? (LABEL_ACCENTS[label] ?? 'rgba(198,244,50,0.8)') : 'rgba(28,42,82,0.8)';

  return (
    <section
      id={id}
      className={`flex flex-col overflow-hidden rounded-xl ${className}`}
      style={{
        background: 'rgba(13,23,48,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(28,42,82,0.9)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Glowing top accent line */}
      <div
        className="h-px w-full flex-shrink-0"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
      />

      {/* Panel header */}
      <div
        className="flex items-center justify-between px-3 py-2 flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, rgba(28,42,82,0.25) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(28,42,82,0.6)',
        }}
      >
        <div className="flex items-center gap-2">
          {label && (
            <span
              className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{
                color: accentColor,
                border: `1px solid ${accentColor.replace('0.8', '0.25')}`,
                background: accentColor.replace('0.8', '0.08'),
              }}
            >
              {label}
            </span>
          )}
          <h2
            className="text-xs font-semibold tracking-wide"
            style={{ fontFamily: 'var(--font-heading)', color: 'rgba(255,255,255,0.9)' }}
          >
            {title}
          </h2>
        </div>
        <span
          className="text-[8px] font-mono uppercase tracking-widest"
          style={{ color: 'rgba(74,94,128,0.8)' }}
        >
          ILLUSTRATIVE
        </span>
      </div>

      {/* Panel content with ErrorBoundary protection */}
      <div className="flex-1 overflow-auto p-2 min-h-0">
        <ErrorBoundary panelName={title}>{children}</ErrorBoundary>
      </div>
    </section>
  );
}
