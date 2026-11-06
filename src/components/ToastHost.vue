<template>
  <div
    class="toast-viewport"
    :role="items.length ? 'region' : undefined"
    :aria-label="items.length ? 'Notifications' : undefined"
  >
    <div
      v-for="toast in items"
      :key="toast.id"
      class="toast"
      :class="`toast-${toast.variant}`"
      :data-toast-id="toast.id"
      :role="toast.actions.length ? 'dialog' : undefined"
      :aria-labelledby="toast.actions.length ? `toast-message-${toast.id}` : undefined"
      @mouseenter="onMouseEnter(toast.id)"
      @mouseleave="onMouseLeave(toast.id)"
      @focusin="onFocusIn(toast, $event)"
      @focusout="onFocusOut(toast, $event)"
    >
      <div class="toast-row">
        <p
          :id="`toast-message-${toast.id}`"
          class="toast-message"
          :role="toast.actions.length ? undefined : (toast.variant === 'error' ? 'alert' : 'status')"
          :aria-atomic="toast.actions.length ? undefined : 'true'"
        >{{ toast.message }}</p>
        <button
          type="button"
          class="toast-dismiss"
          aria-label="Dismiss notification"
          @click="dismiss(toast.id)"
        >&times;</button>
      </div>
      <div v-if="toast.actions.length" class="toast-actions">
        <button
          v-for="(action, index) in toast.actions"
          :key="`${toast.id}-${index}`"
          type="button"
          class="toast-action"
          :class="action.variant === 'danger' ? 'toast-action-danger' : 'toast-action-ghost'"
          :data-toast-cancel="action.variant === 'ghost' ? '' : undefined"
          @click="runAction(toast, action)"
        >{{ action.label }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import {
  dismissToast,
  pauseToast,
  resumeToast,
  toastState,
} from '@/utils/toast';

function isFocusLost(element) {
  return !element || element === document.body || element === document.documentElement;
}

export default {
  name: 'ToastHost',
  computed: {
    items() {
      return toastState.items;
    },
    itemCount() {
      return toastState.items.length;
    },
    itemIds() {
      return toastState.items.map((item) => item.id);
    },
  },
  watch: {
    itemIds: {
      handler(nextIds, prevIds = []) {
        this.syncToastFocus(nextIds, prevIds);
      },
      flush: 'post',
    },
  },
  created() {
    this.focusOrigins = new Map();
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
    if (this.itemIds.length) {
      this.syncToastFocus(this.itemIds, []);
    }
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    this.focusOrigins.clear();
  },
  methods: {
    getToastEl(id) {
      if (!this.$el || !this.$el.querySelector) {
        return null;
      }
      return this.$el.querySelector(`[data-toast-id="${id}"]`);
    },
    getPreferredActionEl(id) {
      const toastEl = this.getToastEl(id);
      if (!toastEl) {
        return null;
      }
      return toastEl.querySelector('[data-toast-cancel]') || toastEl.querySelector('.toast-action');
    },
    onMouseEnter(id) {
      pauseToast(id, 'hover');
    },
    onMouseLeave(id) {
      resumeToast(id, 'hover');
    },
    onFocusIn(toast, event) {
      pauseToast(toast.id, 'focus');
      if (!this.focusOrigins.has(toast.id)) {
        const previous = event && event.relatedTarget;
        const toastEl = this.getToastEl(toast.id);
        const fromOutside = previous && !isFocusLost(previous) && (!toastEl || !toastEl.contains(previous));
        if (fromOutside) {
          this.focusOrigins.set(toast.id, previous);
        }
      }
    },
    onFocusOut(toast, event) {
      const toastEl = this.getToastEl(toast.id);
      const next = event && event.relatedTarget;
      if (toastEl && next && toastEl.contains(next)) {
        return;
      }
      resumeToast(toast.id, 'focus');
      if (!toast.actions.length && next && !isFocusLost(next)) {
        this.focusOrigins.delete(toast.id);
      }
    },
    repointDetachedOrigins(removedEl, fallbackOrigin) {
      this.focusOrigins.forEach((savedOrigin, otherId) => {
        if (!savedOrigin) {
          return;
        }
        const insideRemoved = !!(removedEl && removedEl.contains(savedOrigin));
        if (insideRemoved || !document.contains(savedOrigin)) {
          this.focusOrigins.set(otherId, fallbackOrigin || null);
        }
      });
    },
    focusTarget(target) {
      if (target && document.contains(target) && typeof target.focus === 'function') {
        target.focus();
        return true;
      }
      return false;
    },
    focusLatestRemainingActionToast(excludeId) {
      for (let i = this.items.length - 1; i >= 0; i -= 1) {
        const candidate = this.items[i];
        if (candidate.id !== excludeId && candidate.actions.length) {
          const btn = this.getPreferredActionEl(candidate.id);
          if (this.focusTarget(btn)) {
            return true;
          }
        }
      }
      return false;
    },
    restoreFocusForToast(id) {
      if (!this.focusOrigins.has(id)) {
        return;
      }
      const origin = this.focusOrigins.get(id);
      this.focusOrigins.delete(id);

      const toastEl = this.getToastEl(id);
      this.repointDetachedOrigins(toastEl, origin);

      const active = document.activeElement;
      const focusInsideToast = !!(toastEl && toastEl.contains(active));
      if (!focusInsideToast && !isFocusLost(active)) {
        return;
      }
      if (!this.focusTarget(origin)) {
        this.focusLatestRemainingActionToast(id);
      }
    },
    syncToastFocus(nextIds, prevIds) {
      const removedIds = prevIds.filter((id) => !nextIds.includes(id));
      const addedIds = nextIds.filter((id) => !prevIds.includes(id));

      let restorableOrigin = null;
      removedIds.forEach((id) => {
        if (!this.focusOrigins.has(id)) {
          return;
        }
        const origin = this.focusOrigins.get(id);
        this.focusOrigins.delete(id);
        this.repointDetachedOrigins(null, origin);
        if (origin && document.contains(origin)) {
          restorableOrigin = origin;
        }
      });

      const addedActionToasts = addedIds
        .map((id) => this.items.find((item) => item.id === id))
        .filter((item) => item && item.actions.length);

      if (addedActionToasts.length) {
        const active = document.activeElement;
        let chainOrigin = !isFocusLost(active) ? active : restorableOrigin;
        addedActionToasts.forEach((toast) => {
          this.focusOrigins.set(toast.id, chainOrigin || null);
          const actionEl = this.getPreferredActionEl(toast.id);
          if (actionEl) {
            chainOrigin = actionEl;
          }
        });
        const newestAdded = addedActionToasts[addedActionToasts.length - 1];
        this.focusTarget(this.getPreferredActionEl(newestAdded.id));
        return;
      }

      if (restorableOrigin && isFocusLost(document.activeElement)) {
        if (!this.focusTarget(restorableOrigin)) {
          this.focusLatestRemainingActionToast(null);
        }
      }
    },
    handleKeydown(event) {
      if (event.defaultPrevented || event.key !== 'Escape' || this.itemCount === 0) {
        return;
      }
      const newest = this.items[this.items.length - 1];
      this.restoreFocusForToast(newest.id);
      dismissToast(newest.id, 'escape');
    },
    dismiss(id) {
      this.restoreFocusForToast(id);
      dismissToast(id, 'dismiss');
    },
    runAction(toast, action) {
      try {
        if (typeof action.onClick === 'function') {
          action.onClick();
        }
      } finally {
        this.restoreFocusForToast(toast.id);
        dismissToast(toast.id, 'action');
      }
    },
  },
};
</script>

<style scoped>
.toast-viewport {
  position: fixed;
  top: 72px;
  left: 50%;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(24rem, calc(100vw - var(--space-4) * 2));
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-left: 3px solid var(--info);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
}

.toast-success {
  border-left-color: var(--good);
}

.toast-warn {
  border-left-color: var(--warn);
}

.toast-error {
  border-left-color: var(--bad);
}

.toast-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.toast-message {
  flex: 1;
  margin: 0;
  padding-top: 10px;
  font-size: var(--text-sm);
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.toast-dismiss {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  margin: -6px -6px 0 0;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.toast-dismiss:hover {
  background: var(--surface-muted);
  color: var(--text);
}

.toast-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.toast-action {
  min-height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}

.toast-action-ghost {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}

.toast-action-ghost:hover {
  background: var(--surface-muted);
}

.toast-action-danger {
  background: var(--bad-soft);
  color: var(--bad);
  border: 1px solid var(--bad);
}

.toast-action-danger:hover {
  background: var(--bad);
  color: var(--surface);
}

@media (max-width: 559px) {
  .toast-viewport {
    top: 68px;
    width: calc(100vw - var(--space-3) * 2);
  }
}
</style>
