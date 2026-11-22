import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';

/** How long (ms) a notification stays on screen before auto-dismissing. */
const TOAST_DURATION_MS = 3200;

/**
 * Global transient notification (toast) driven by `useCircuitStore.notification`.
 * Auto-dismisses after `TOAST_DURATION_MS`; each new notification restarts the timer.
 * Positioned above the mobile bottom bar and never blocks canvas touches (except its close button).
 *
 * Time Complexity: O(1) render.
 */
export const Toast: React.FC = () => {
  const notification = useCircuitStore((state) => state.notification);
  const dismissNotification = useCircuitStore((state) => state.dismissNotification);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(dismissNotification, TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [notification, dismissNotification]);

  if (!notification) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-center px-4 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="node-info-pop pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl border border-copper bg-void-900 px-3.5 py-2.5 text-xs font-medium text-ink shadow-2xl">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
        <span className="leading-snug flex-1">{notification.message}</span>
        <button
          type="button"
          onClick={dismissNotification}
          aria-label="Tutup notifikasi"
          className="-mr-1 shrink-0 cursor-pointer rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-ink hover:bg-ink/10 active:scale-90 transition-colors"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
