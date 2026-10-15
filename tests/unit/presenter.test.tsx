/**
 * tests/unit/presenter.test.tsx — Unit tests for PresenterPanel & Keyboard Shortcuts (Phase 6).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PresenterPanel } from '../../src/components/presenter/PresenterPanel';
import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts';
import { useAppStore } from '../../src/store/store';
import { useDemoClock } from '../../src/services/clock';
import { createSchedulerState } from '../../src/domain/cueScheduler';
import * as alarmModule from '../../src/services/alarm';

function ShortcutTestHarness({ onTogglePresenter }: { onTogglePresenter?: () => void }) {
  useKeyboardShortcuts({ onTogglePresenter });
  return <div>Shortcut Active</div>;
}

describe('PresenterPanel & Keyboard Shortcuts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAppStore.setState({
      activeScenario: {
        id: 'S1',
        name: 'Single incident',
        description: '',
        durationSec: 60,
        wallLayout: '3x2',
        tiles: [],
        cues: [],
      },
      schedulerState: createSchedulerState(),
    });
    useDemoClock.getState().reset();
  });

  it('renders all 6 scenario buttons and toggles active scenario', () => {
    const selectSpy = vi.spyOn(useAppStore.getState(), 'selectScenario');

    render(
      <MemoryRouter>
        <PresenterPanel />
      </MemoryRouter>,
    );

    const s2Btn = screen.getByRole('button', { name: /S2: False alarm dismiss/i });
    expect(s2Btn).toBeInTheDocument();
    fireEvent.click(s2Btn);

    expect(selectSpy).toHaveBeenCalledWith('S2');
  });

  it('provides quick trigger for fire next alert [N] and reset demo [R]', () => {
    const fireNextSpy = vi.spyOn(useAppStore.getState(), 'fireNextAlert');
    const resetSpy = vi.spyOn(useAppStore.getState(), 'resetDemo');

    render(
      <MemoryRouter>
        <PresenterPanel />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Fire next alert/i }));
    expect(fireNextSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Reset Demo/i }));
    expect(resetSpy).toHaveBeenCalled();
  });

  it('toggles audio mute state', () => {
    const muteSpy = vi.spyOn(alarmModule, 'toggleMute').mockReturnValue(true);

    render(
      <MemoryRouter>
        <PresenterPanel />
      </MemoryRouter>,
    );

    const muteBtn = screen.getByRole('button', { name: /Mute/i });
    fireEvent.click(muteBtn);
    expect(muteSpy).toHaveBeenCalled();
  });

  it('triggers actions from keyboard shortcuts (1-6, Space, N, R, M, P)', () => {
    const onTogglePresenter = vi.fn();
    const selectSpy = vi.spyOn(useAppStore.getState(), 'selectScenario');
    const fireNextSpy = vi.spyOn(useAppStore.getState(), 'fireNextAlert');
    const resetSpy = vi.spyOn(useAppStore.getState(), 'resetDemo');
    const toggleClockSpy = vi.spyOn(useDemoClock.getState(), 'togglePlayPause');
    const toggleMuteSpy = vi.spyOn(alarmModule, 'toggleMute');

    render(<ShortcutTestHarness onTogglePresenter={onTogglePresenter} />);

    // Press '3'
    fireEvent.keyDown(window, { key: '3' });
    expect(selectSpy).toHaveBeenCalledWith('S3');

    // Press ' ' (Space)
    fireEvent.keyDown(window, { key: ' ' });
    expect(toggleClockSpy).toHaveBeenCalled();

    // Press 'N'
    fireEvent.keyDown(window, { key: 'n' });
    expect(fireNextSpy).toHaveBeenCalled();

    // Press 'R'
    fireEvent.keyDown(window, { key: 'r' });
    expect(resetSpy).toHaveBeenCalled();

    // Press 'M'
    fireEvent.keyDown(window, { key: 'm' });
    expect(toggleMuteSpy).toHaveBeenCalled();

    // Press 'P'
    fireEvent.keyDown(window, { key: 'p' });
    expect(onTogglePresenter).toHaveBeenCalled();
  });

  it('ignores shortcuts when user is typing in an input element', () => {
    const onTogglePresenter = vi.fn();
    render(
      <div>
        <ShortcutTestHarness onTogglePresenter={onTogglePresenter} />
        <input data-testid="test-input" />
      </div>,
    );

    const input = screen.getByTestId('test-input');
    fireEvent.keyDown(input, { key: 'p' });
    expect(onTogglePresenter).not.toHaveBeenCalled();
  });
});
