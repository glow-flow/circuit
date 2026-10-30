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
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 md:bottom-8"
    >
      <div className="node-info-pop pointer-events-auto flex max-w-sm items-start gap-2 rounded-xl border border-amber-400/50 bg-void-900/95 px-3.5 py-2.5 text-xs font-medium text-amber-100 shadow-glow backdrop-blur-md">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <span className="leading-snug">{notification.message}</span>
        <button
          type="button"
          onClick={dismissNotification}
          aria-label="Tutup"
          className="-mr-1 shrink-0 cursor-pointer rounded p-0.5 text-amber-200/70 hover:text-white active:scale-90"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
