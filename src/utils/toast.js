import { reactive } from 'vue';

const DEFAULT_DURATION = 4000;
const VARIANTS = ['info', 'success', 'warn', 'error'];

export const toastState = reactive({
  items: [],
});

let nextId = 1;
const timers = new Map();

function normalizeVariant(variant) {
  return VARIANTS.includes(variant) ? variant : 'info';
}

function normalizeDuration(duration) {
  if (duration === undefined) {
    return DEFAULT_DURATION;
  }
  const value = Number(duration);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value;
}

/**
 * Show a non-blocking toast. Duration 0 stays until the user dismisses it.
 * @param {unknown} message
 * @param {{ variant?: string, duration?: number, actions?: Array<{ label: string, onClick?: Function, variant?: string }>, onDismiss?: Function }} [options]
 * @returns {number}
 */
export function showToast(message, options = {}) {
  const id = nextId;
  nextId += 1;
  const duration = normalizeDuration(options.duration);
  const item = {
    id,
    message: String(message),
    variant: normalizeVariant(options.variant),
    duration,
    actions: Array.isArray(options.actions) ? options.actions : [],
    onDismiss: typeof options.onDismiss === 'function' ? options.onDismiss : null,
  };

  toastState.items.push(item);

  if (duration > 0) {
    timers.set(id, setTimeout(() => {
      dismissToast(id, 'timeout');
    }, duration));
  }

  return id;
}

/**
 * Remove one toast. Calls onDismiss once, with the reason.
 * @param {number} id
 * @param {string} [reason]
 * @returns {boolean}
 */
export function dismissToast(id, reason = 'dismiss') {
  const index = toastState.items.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }

  const [item] = toastState.items.splice(index, 1);
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  if (typeof item.onDismiss === 'function') {
    item.onDismiss(reason);
  }
  return true;
}

export function clearToasts() {
  [...toastState.items].forEach((item) => dismissToast(item.id, 'clear'));
}

/**
 * Non-blocking confirmation. Resolves true for the confirm action.
 * Cancel, dismiss, Escape, and clear resolve false. It does not time out.
 * @param {unknown} message
 * @param {{ confirmLabel?: string, cancelLabel?: string, variant?: string, confirmVariant?: string }} [options]
 * @returns {Promise<boolean>}
 */
export function confirmToast(message, options = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    showToast(message, {
      variant: options.variant || 'warn',
      duration: 0,
      onDismiss: () => finish(false),
      actions: [
        {
          label: options.confirmLabel || 'Confirm',
          variant: options.confirmVariant || 'danger',
          onClick: () => finish(true),
        },
        {
          label: options.cancelLabel || 'Cancel',
          variant: 'ghost',
          onClick: () => finish(false),
        },
      ],
    });
  });
}
