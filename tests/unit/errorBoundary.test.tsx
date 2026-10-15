/**
 * tests/unit/errorBoundary.test.tsx — Unit tests for panel ErrorBoundary.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../../src/components/layout/ErrorBoundary';
import { useState } from 'react';

function BuggyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Simulated panel failure');
  }
  return <div>Panel Normal Operation</div>;
}

function TestContainer() {
  const [hasError, setHasError] = useState(true);
  return (
    <ErrorBoundary panelName="Surveillance Wall">
      <BuggyComponent shouldThrow={hasError} />
      <button onClick={() => setHasError(false)}>Fix</button>
    </ErrorBoundary>
  );
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary panelName="Test Panel">
        <div>All Good</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('All Good')).toBeInTheDocument();
  });

  it('catches render errors and renders panel fallback with reload button', () => {
    // Suppress console.error in test output for intentional error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<TestContainer />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Surveillance Wall Encountered an Error/i)).toBeInTheDocument();
    expect(screen.getByText('Simulated panel failure')).toBeInTheDocument();

    const reloadBtn = screen.getByRole('button', { name: /Reload Panel/i });
    expect(reloadBtn).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
