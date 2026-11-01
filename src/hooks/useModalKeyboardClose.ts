import { useEffect } from 'react';

/**
 * Attaches a keyboard listener to window or custom event target for closing modal dialogs on 'Escape'.
 * Safe for SSR and Node test environments. Returns an unbind cleanup function.
 *
 * @param isOpen - Whether the modal dialog is currently visible
 * @param onClose - Callback invoked when the user presses 'Escape'
 * @param target - Optional custom event target (defaults to window in browser)
 * @returns Cleanup function to unbind event listener
 */
export function setupModalKeyboardListener(
  isOpen: boolean,
  onClose: () => void,
  target?: {
    addEventListener: (type: string, listener: (ev: any) => void) => void;
    removeEventListener: (type: string, listener: (ev: any) => void) => void;
  }
): () => void {
  const eventTarget = target ?? (typeof window !== 'undefined' ? window : null);
  if (!isOpen || !eventTarget) return () => {};

  const handleKeyDown = (event: { key: string }): void => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  eventTarget.addEventListener('keydown', handleKeyDown);

  return () => {
    eventTarget.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Custom React hook to handle Escape key dismissal for accessible modal dialogs.
 * Enforces the DRY principle across all educational overlay modals.
 *
 * @param isOpen - Whether the modal dialog is currently visible
 * @param onClose - Callback invoked when the user presses the 'Escape' key
 */
export function useModalKeyboardClose(isOpen: boolean, onClose: () => void): void {
  useEffect(() => setupModalKeyboardListener(isOpen, onClose), [isOpen, onClose]);
}
