/**
 * pages/Presenter.tsx — Dedicated presenter screen view `/presenter`.
 * architecture.md section 1 & design.md section 5.7.
 */
import { useEffect } from 'react';
import { Banner, Footer } from '../components/layout';
import { PresenterPanel } from '../components/presenter/PresenterPanel';
import { useAppStore } from '../store/store';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export function PresenterPage() {
  const loadData = useAppStore((s) => s.loadData);
  const loadingState = useAppStore((s) => s.loadingState);

  useEffect(() => {
    if (loadingState === 'idle') loadData();
  }, [loadData, loadingState]);

  useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-navy flex flex-col text-white">
      <Banner />
      <main className="flex-1 p-6">
        <PresenterPanel />
      </main>
      <Footer />
    </div>
  );
}
