/**
 * Unit tests for the honesty Banner component.
 * Verifies the non-negotiable honesty requirements from design.md section 2.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Banner } from '../../src/components/layout/Banner';

describe('Banner', () => {
  it('renders the prototype honesty text', () => {
    render(<Banner />);
    expect(
      screen.getByText(/PROTOTYPE:.*scripted detections.*No AI model/i),
    ).toBeInTheDocument();
  });

  it('has the honesty-banner id', () => {
    render(<Banner />);
    expect(document.getElementById('honesty-banner')).toBeInTheDocument();
  });
});
