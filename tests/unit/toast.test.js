import { confirmToast, clearToasts, dismissToast, showToast, toastState } from '@/utils/toast';

describe('toast helper', () => {
  beforeEach(() => {
    clearToasts();
  });

  afterEach(() => {
    clearToasts();
    jest.useRealTimers();
  });

  test('shows a dismissible info toast and returns its id', () => {
    const id = showToast('Saved');

    expect(id).toEqual(expect.any(Number));
    expect(toastState.items).toEqual([
      expect.objectContaining({
        id,
        message: 'Saved',
        variant: 'info',
        actions: [],
      }),
    ]);
  });

  test('accepts success, warn, and error variants', () => {
    showToast('ok', { variant: 'success' });
    showToast('careful', { variant: 'warn' });
    showToast('nope', { variant: 'error' });

    expect(toastState.items.map((item) => item.variant)).toEqual(['success', 'warn', 'error']);
  });

  test('falls back to info for an unknown variant', () => {
    showToast('hmm', { variant: 'celebration' });

    expect(toastState.items[0].variant).toBe('info');
  });

  test('stringifies the message so it can be rendered as text', () => {
    showToast(42);

    expect(toastState.items[0].message).toBe('42');
  });

  test('dismisses a toast by id and ignores unknown ids', () => {
    const id = showToast('Gone soon', { duration: 0 });

    expect(dismissToast(id)).toBe(true);
    expect(toastState.items).toHaveLength(0);
    expect(dismissToast(id)).toBe(false);
  });

  test('calls onDismiss with the reason', () => {
    const onDismiss = jest.fn();
    const id = showToast('Bye', { duration: 0, onDismiss });

    dismissToast(id, 'escape');

    expect(onDismiss).toHaveBeenCalledWith('escape');
  });

  test('auto-dismisses after the duration and not before', () => {
    jest.useFakeTimers();
    showToast('Temporary', { duration: 1000 });

    jest.advanceTimersByTime(999);
    expect(toastState.items).toHaveLength(1);

    jest.advanceTimersByTime(1);
    expect(toastState.items).toHaveLength(0);
  });

  test('does not auto-dismiss a toast with duration 0', () => {
    jest.useFakeTimers();
    showToast('Stay', { duration: 0 });

    jest.advanceTimersByTime(10000);
    expect(toastState.items).toHaveLength(1);
  });

  test('auto-dismisses a plain toast after four seconds', () => {
    jest.useFakeTimers();
    showToast('Saved');

    jest.advanceTimersByTime(3999);
    expect(toastState.items).toHaveLength(1);

    jest.advanceTimersByTime(1);
    expect(toastState.items).toHaveLength(0);
  });

  test('clears the auto-dismiss timer when dismissed early', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    const id = showToast('Early', { duration: 1000, onDismiss });

    dismissToast(id);
    jest.advanceTimersByTime(1000);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('clearToasts removes every toast and settles their dismiss callbacks', () => {
    const onDismiss = jest.fn();
    showToast('One', { duration: 0, onDismiss });
    showToast('Two', { duration: 0 });

    clearToasts();

    expect(toastState.items).toHaveLength(0);
    expect(onDismiss).toHaveBeenCalledWith('clear');
  });

  test('confirmToast resolves true only for the confirm action', async () => {
    const pending = confirmToast('Are you sure you want to reset all data?');

    expect(toastState.items).toHaveLength(1);
    expect(toastState.items[0]).toEqual(expect.objectContaining({
      message: 'Are you sure you want to reset all data?',
      variant: 'warn',
      duration: 0,
    }));
    expect(toastState.items[0].actions.map((action) => action.label)).toEqual(['Confirm', 'Cancel']);

    toastState.items[0].actions[0].onClick();
    dismissToast(toastState.items[0].id, 'action');

    await expect(pending).resolves.toBe(true);
    expect(toastState.items).toHaveLength(0);
  });

  test('confirmToast resolves false for cancel, dismiss, and clear', async () => {
    const cancelled = confirmToast('Reset?', { confirmLabel: 'Confirm reset', cancelLabel: 'Cancel' });
    toastState.items[0].actions[1].onClick();
    dismissToast(toastState.items[0].id, 'action');
    await expect(cancelled).resolves.toBe(false);

    const dismissed = confirmToast('Reset?');
    dismissToast(toastState.items[0].id, 'escape');
    await expect(dismissed).resolves.toBe(false);

    const cleared = confirmToast('Reset?');
    clearToasts();
    await expect(cleared).resolves.toBe(false);
  });

  test('confirmToast does not time out while it is waiting for a choice', () => {
    jest.useFakeTimers();
    const pending = confirmToast('Still there?');

    jest.advanceTimersByTime(20000);
    expect(toastState.items).toHaveLength(1);

    toastState.items[0].actions[1].onClick();
    dismissToast(toastState.items[0].id);
    return expect(pending).resolves.toBe(false);
  });
});
