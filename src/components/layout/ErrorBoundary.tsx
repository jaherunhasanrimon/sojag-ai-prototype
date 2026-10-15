import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  panelName?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — Panel-level resilience boundary (design.md section 10).
 * Prevents a failure in one panel from crashing the entire control room.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[SOTORKO ErrorBoundary - ${this.props.panelName ?? 'Panel'}]`,
      error,
      errorInfo,
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="h-full flex flex-col items-center justify-center p-6 bg-navy/90 border border-magenta/40 rounded-lg text-center"
        >
          <span className="text-2xl mb-2">⚠️</span>
          <h3 className="text-xs font-mono font-bold text-magenta uppercase tracking-wider">
            {this.props.panelName ?? 'Panel'} Encountered an Error
          </h3>
          <p className="text-[11px] font-mono text-muted mt-2 max-w-sm break-words">
            {this.state.error?.message ?? 'An unexpected error occurred in this view.'}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-4 text-[10px] font-mono bg-edge/40 hover:bg-edge/80 border border-edge text-white px-3 py-1.5 rounded transition-colors"
          >
            🔄 Reload Panel
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
