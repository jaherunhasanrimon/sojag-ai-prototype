/**
 * hooks/useKeyboardShortcuts.ts — Global presenter keyboard shortcuts (design.md section 5.7).
 *
 * Shortcuts:
 * - 1–6: Select scenarios S1–S6
 * - N: Fire next alert
 * - R: Reset demo
 * - Space: Pause/play
 * - M: Mute alarm
 * - F: Toggle fullscreen
 * - P: Toggle presenter panel overlay
 */
import { useEffect } from 'react';
import { useAppStore } from '../store/store';
import { useDemoClock } from '../services/clock';
import { toggleMute } from '../services/alarm';

interface KeyboardShortcutOptions {
  onTogglePresenter?: () => void;
}

export function useKeyboardShortcuts(options?: KeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const store = useAppStore.getState();
      const clock = useDemoClock.getState();

      switch (e.key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6': {
          e.preventDefault();
          const scenarioId = `S${e.key}`;
          store.selectScenario(scenarioId);
          console.log(`[SOTORKO Shortcut] Switched to scenario ${scenarioId}`);
          break;
        }

        case 'n':
        case 'N': {
          e.preventDefault();
          store.fireNextAlert();
          console.log('[SOTORKO Shortcut] Fired next alert');
          break;
        }

        case 'r':
        case 'R': {
          e.preventDefault();
          store.resetDemo();
          console.log('[SOTORKO Shortcut] Reset demo');
          break;
        }

        case ' ': {
          e.preventDefault();
          clock.togglePlayPause();
          break;
        }

        case 'm':
        case 'M': {
          e.preventDefault();
          toggleMute();
          break;
        }

        case 'f':
        case 'F': {
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
          break;
        }

        case 'p':
        case 'P': {
          e.preventDefault();
          options?.onTogglePresenter?.();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
