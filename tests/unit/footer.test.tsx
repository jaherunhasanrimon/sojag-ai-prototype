/**
 * Unit tests for the Footer component.
 * Verifies ILLUSTRATIVE/SIMULATED labels are present (design.md section 2, rule 2).
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Footer } from '../../src/components/layout/Footer';

describe('Footer', () => {
  it('renders ILLUSTRATIVE label', () => {
    render(<Footer />);
    expect(screen.getByText('ILLUSTRATIVE')).toBeInTheDocument();
  });

  it('renders SIMULATED label', () => {
    render(<Footer />);
    expect(screen.getByText('SIMULATED')).toBeInTheDocument();
  });

  it('includes demo metrics disclaimer', () => {
    render(<Footer />);
    expect(
      screen.getByText(/Demo metrics, not performance evidence/),
    ).toBeInTheDocument();
  });
});
