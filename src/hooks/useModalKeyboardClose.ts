import React, { useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

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

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.getClientRects().length > 0 && window.getComputedStyle(el).visibility !== 'hidden'
  );
}

/**
 * Implements full WCAG dialog keyboard management:
 * 1. Saves and restores focus to the trigger element when the dialog closes.
 * 2. Moves initial focus inside the dialog upon open.
 * 3. Traps Tab / Shift+Tab cycling within the dialog container.
 * 4. Dismisses on Escape when `onClose` is provided.
 *
 * Time Complexity: O(K) per Tab keydown where K is focusable element count in the dialog.
 */
export function useModalFocusTrap(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
  onClose?: () => void
): void {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;

    const rafId = window.requestAnimationFrame(() => {
      const targetContainer = containerRef.current;
      if (!targetContainer) return;
      if (targetContainer.contains(document.activeElement)) return;

      const explicitTarget = targetContainer.querySelector<HTMLElement>(
        '[data-autofocus], [autofocus]'
      );
      if (explicitTarget) {
        explicitTarget.focus();
        return;
      }

      const focusables = getFocusableElements(targetContainer);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        if (!targetContainer.hasAttribute('tabindex')) {
          targetContainer.setAttribute('tabindex', '-1');
        }
        targetContainer.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      const targetContainer = containerRef.current;
      if (!targetContainer) return;

      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = getFocusableElements(targetContainer);
      if (focusables.length === 0) {
        event.preventDefault();
        targetContainer.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !targetContainer.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (!active || active === last || !targetContainer.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', handleKeyDown, true);
      if (previouslyFocused && previouslyFocused.isConnected && container !== previouslyFocused) {
        window.requestAnimationFrame(() => {
          if (previouslyFocused.isConnected) {
            previouslyFocused.focus();
          }
        });
      }
    };
  }, [isOpen, containerRef, onClose]);
}

