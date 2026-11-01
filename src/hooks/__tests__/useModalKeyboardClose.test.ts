import { describe, it, expect, vi } from 'vitest';
import { setupModalKeyboardListener } from '../useModalKeyboardClose';

class MockEventTarget {
  private listeners: Map<string, Set<(ev: any) => void>> = new Map();

  addEventListener(type: string, listener: (ev: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (ev: any) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(type: string, event: { key: string }): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach((h) => h(event));
    }
  }
}

describe('Modal Keyboard Listener (Escape key accessibility)', () => {
  it('calls onClose when Escape key is pressed and modal is open', () => {
    const target = new MockEventTarget();
    const onClose = vi.fn();
    const cleanup = setupModalKeyboardListener(true, onClose, target);

    target.dispatchEvent('keydown', { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('does NOT call onClose when another key is pressed', () => {
    const target = new MockEventTarget();
    const onClose = vi.fn();
    const cleanup = setupModalKeyboardListener(true, onClose, target);

    target.dispatchEvent('keydown', { key: 'Enter' });

    expect(onClose).not.toHaveBeenCalled();
    cleanup();
  });

  it('does NOT call onClose when modal is closed', () => {
    const target = new MockEventTarget();
    const onClose = vi.fn();
    const cleanup = setupModalKeyboardListener(false, onClose, target);

    target.dispatchEvent('keydown', { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
    cleanup();
  });

  it('removes listener upon cleanup unbind to prevent memory leaks', () => {
    const target = new MockEventTarget();
    const onClose = vi.fn();
    const cleanup = setupModalKeyboardListener(true, onClose, target);

    cleanup();

    target.dispatchEvent('keydown', { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });
});
