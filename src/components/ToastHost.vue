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
    >
      <div class="toast-row">
        <p
          class="toast-message"
          :role="toast.variant === 'error' ? 'alert' : 'status'"
          aria-atomic="true"
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
import { dismissToast, toastState } from '@/utils/toast';

export default {
  name: 'ToastHost',
  computed: {
    items() {
      return toastState.items;
    },
    itemCount() {
      return toastState.items.length;
    },
  },
  watch: {
    itemCount(len, prev) {
      const previousCount = prev || 0;
      if (len > previousCount) {
        const newest = this.items[this.items.length - 1];
        if (newest && newest.actions.length) {
          this.restoreFocusTo = document.activeElement;
          const id = newest.id;
          this.$nextTick(() => {
            const cancel = this.$el.querySelector(`[data-toast-id="${id}"] [data-toast-cancel]`);
            if (cancel) {
              cancel.focus();
            }
          });
        }
        return;
      }

      if (len < previousCount) {
        this.$nextTick(() => {
          this.restoreFocusIfNeeded();
        });
      }
    },
  },
  data() {
    return {
      restoreFocusTo: null,
    };
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    handleKeydown(event) {
      if (event.key !== 'Escape' || this.itemCount === 0) {
        return;
      }
      this.restoreFocusIfHostHasIt();
      const newest = this.items[this.items.length - 1];
      dismissToast(newest.id, 'escape');
    },
    dismiss(id) {
      this.restoreFocusIfHostHasIt();
      dismissToast(id, 'dismiss');
    },
    runAction(toast, action) {
      if (typeof action.onClick === 'function') {
        action.onClick();
      }
      this.restoreFocusIfHostHasIt();
      dismissToast(toast.id, 'action');
    },
    restoreFocusIfHostHasIt() {
      const previous = this.restoreFocusTo;
      const active = document.activeElement;
      if (!previous || !this.$el || !this.$el.contains(active)) {
        return;
      }
      if (document.contains(previous) && typeof previous.focus === 'function') {
        previous.focus();
      }
      this.restoreFocusTo = null;
    },
    restoreFocusIfNeeded() {
      const previous = this.restoreFocusTo;
      if (!previous || typeof previous.focus !== 'function') {
        return;
      }
      const active = document.activeElement;
      const host = this.$el;
      const focusInsideHost = !!(host && host.contains && host.contains(active));
      const focusLost = !active || active === document.body || active === document.documentElement;
      if ((focusLost || focusInsideHost) && document.contains(previous)) {
        previous.focus();
      }
      if (this.itemCount === 0) {
        this.restoreFocusTo = null;
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
