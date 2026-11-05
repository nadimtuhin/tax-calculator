import { mount } from '@vue/test-utils';
import App from '@/App.vue';
import ToastHost from '@/components/ToastHost.vue';
import {
  clearToasts,
  confirmToast,
  dismissToast,
  showToast,
  toastState,
} from '@/utils/toast';

describe('ToastHost', () => {
  let wrapper;

  beforeEach(() => {
    clearToasts();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
    clearToasts();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  function mountHost() {
    wrapper = mount(ToastHost, { attachTo: document.body });
    return wrapper;
  }

  test('renders the message as text, escapes markup, and does not block the page', async () => {
    mountHost();
    showToast('Random data populated! 🎲 <img src=x onerror=alert(1)>', { variant: 'success', duration: 0 });
    await wrapper.vm.$nextTick();

    const toast = wrapper.find('.toast');
    expect(toast.exists()).toBe(true);
    expect(toast.text()).toContain('Random data populated! 🎲 <img src=x onerror=alert(1)>');
    expect(toast.find('[role="status"]').exists()).toBe(true);
    expect(toast.find('img').exists()).toBe(false);
    expect(wrapper.find('[aria-modal="true"]').exists()).toBe(false);
    expect(wrapper.find('.toast-viewport').exists()).toBe(true);
  });

  test('uses an alert role for errors', async () => {
    mountHost();
    showToast('Error importing data. Please check the file format.', { variant: 'error', duration: 0 });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[role="alert"]').text()).toContain('Error importing data. Please check the file format.');
  });

  test('exposes accessible dialog semantics on actionable toasts', async () => {
    mountHost();
    confirmToast('Are you sure you want to reset all data?');
    await wrapper.vm.$nextTick();

    const dialog = wrapper.find('[role="dialog"]');
    expect(dialog.exists()).toBe(true);
    const labelledBy = dialog.attributes('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(wrapper.find(`#${labelledBy}`).text()).toBe('Are you sure you want to reset all data?');
    expect(wrapper.find('[aria-modal="true"]').exists()).toBe(false);
  });

  test('dismisses from the close button', async () => {
    mountHost();
    showToast('All data has been reset!', { duration: 0 });
    await wrapper.vm.$nextTick();

    await wrapper.find('[aria-label="Dismiss notification"]').trigger('click');

    expect(toastState.items).toHaveLength(0);
    expect(wrapper.find('.toast').exists()).toBe(false);
  });

  test('Escape closes the newest toast, ignores defaultPrevented, and leaves older ones', async () => {
    mountHost();
    showToast('Older', { duration: 0 });
    showToast('Newer', { duration: 0 });
    await wrapper.vm.$nextTick();

    const prevented = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    prevented.preventDefault();
    window.dispatchEvent(prevented);
    await wrapper.vm.$nextTick();
    expect(toastState.items).toHaveLength(2);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(toastState.items.map((item) => item.message)).toEqual(['Older']);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await wrapper.vm.$nextTick();
    expect(toastState.items).toHaveLength(1);
  });

  test('runs an action and dismisses the toast even if onClick throws', async () => {
    mountHost();
    const onClick = jest.fn();
    showToast('Are you sure?', {
      duration: 0,
      actions: [
        { label: 'Confirm reset', variant: 'danger', onClick },
        { label: 'Cancel', variant: 'ghost', onClick: jest.fn() },
      ],
    });
    await wrapper.vm.$nextTick();

    const confirm = wrapper.findAll('.toast-action').find((button) => button.text() === 'Confirm reset');
    await confirm.trigger('click');

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(toastState.items).toHaveLength(0);

    showToast('Throwing action', {
      duration: 0,
      actions: [
        {
          label: 'Boom',
          variant: 'danger',
          onClick: () => {
            throw new Error('boom');
          },
        },
      ],
    });
    await wrapper.vm.$nextTick();

    expect(() => wrapper.vm.runAction(toastState.items[0], toastState.items[0].actions[0])).toThrow('boom');
    expect(toastState.items).toHaveLength(0);
  });

  test('moves focus to Cancel for a choice and restores it on Escape', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Reset';
    document.body.appendChild(trigger);
    trigger.focus();

    mountHost();
    showToast('Are you sure you want to reset all data?', {
      duration: 0,
      actions: [
        { label: 'Confirm reset', variant: 'danger', onClick: jest.fn() },
        { label: 'Cancel', variant: 'ghost', onClick: jest.fn() },
      ],
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(document.activeElement.textContent).toBe('Cancel');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(document.activeElement).toBe(trigger);
    expect(toastState.items).toHaveLength(0);
  });

  test('keeps focus on open confirmation when an unrelated toast times out or closes via Escape', async () => {
    jest.useFakeTimers();
    const trigger = document.createElement('button');
    trigger.textContent = 'Reset';
    document.body.appendChild(trigger);
    trigger.focus();

    mountHost();
    confirmToast('Reset all data?');
    await wrapper.vm.$nextTick();
    expect(document.activeElement.textContent).toBe('Cancel');

    showToast('Temporary status', { duration: 1000 });
    await wrapper.vm.$nextTick();
    expect(document.activeElement.textContent).toBe('Cancel');

    jest.advanceTimersByTime(1000);
    await wrapper.vm.$nextTick();
    expect(document.activeElement.textContent).toBe('Cancel');

    showToast('Newer info', { duration: 0 });
    await wrapper.vm.$nextTick();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(toastState.items).toHaveLength(1);
    expect(document.activeElement.textContent).toBe('Cancel');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();
    expect(toastState.items).toHaveLength(0);
    expect(document.activeElement).toBe(trigger);
  });

  test('focuses replacement confirmation added in the same tick and preserves original focus target', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Reset';
    document.body.appendChild(trigger);
    trigger.focus();

    mountHost();
    confirmToast('First question?');
    await wrapper.vm.$nextTick();
    const firstId = toastState.items[0].id;
    expect(document.activeElement.textContent).toBe('Cancel');

    dismissToast(firstId);
    confirmToast('Second question?', { cancelLabel: 'Keep data' });
    await wrapper.vm.$nextTick();

    expect(document.activeElement.textContent).toBe('Keep data');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(trigger);
  });

  test('preserves original focus target across stacked confirmations regardless of dismissal order', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Reset';
    document.body.appendChild(trigger);
    trigger.focus();

    mountHost();
    confirmToast('First?', { cancelLabel: 'Cancel first' });
    await wrapper.vm.$nextTick();
    const firstId = toastState.items[0].id;
    expect(document.activeElement.textContent).toBe('Cancel first');

    confirmToast('Second?', { cancelLabel: 'Cancel second' });
    await wrapper.vm.$nextTick();
    expect(document.activeElement.textContent).toBe('Cancel second');

    // Dismiss older confirmation first while newer stays focused
    dismissToast(firstId);
    await wrapper.vm.$nextTick();
    expect(document.activeElement.textContent).toBe('Cancel second');

    // Dismiss remaining confirmation; focus returns to original trigger
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(trigger);
  });

  test('pauses timed toast while focused or hovered and restores focus on dismiss', async () => {
    jest.useFakeTimers();
    const trigger = document.createElement('button');
    trigger.textContent = 'Random';
    document.body.appendChild(trigger);
    trigger.focus();

    mountHost();
    showToast('Random data populated!', { variant: 'success', duration: 1000 });
    await wrapper.vm.$nextTick();

    jest.advanceTimersByTime(600);
    const dismissBtn = wrapper.find('[aria-label="Dismiss notification"]').element;
    dismissBtn.focus();

    // Does not auto-dismiss while dismiss control holds keyboard focus
    jest.advanceTimersByTime(5000);
    await wrapper.vm.$nextTick();
    expect(toastState.items).toHaveLength(1);
    expect(document.activeElement).toBe(dismissBtn);

    // Dismissing while focused restores focus to previous control instead of dropping to body
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();
    expect(toastState.items).toHaveLength(0);
    expect(document.activeElement).toBe(trigger);

    // Also pauses on pointer hover and resumes on leave
    showToast('Hover toast', { duration: 1000 });
    await wrapper.vm.$nextTick();
    await wrapper.find('.toast').trigger('mouseenter');
    jest.advanceTimersByTime(3000);
    expect(toastState.items).toHaveLength(1);

    await wrapper.find('.toast').trigger('mouseleave');
    jest.advanceTimersByTime(1000);
    await wrapper.vm.$nextTick();
    expect(toastState.items).toHaveLength(0);
  });

  test('unmounts cleanly while a confirmation toast is still pending', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Reset';
    document.body.appendChild(trigger);
    trigger.focus();

    mountHost();
    confirmToast('Pending confirmation?');
    await wrapper.vm.$nextTick();
    expect(document.activeElement.textContent).toBe('Cancel');

    expect(() => wrapper.unmount()).not.toThrow();
    wrapper = null;
  });

  test('removes the Escape listener when unmounted', async () => {
    mountHost();
    showToast('Stay', { duration: 0 });
    await wrapper.vm.$nextTick();

    wrapper.unmount();
    wrapper = null;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(toastState.items).toHaveLength(1);
  });
});

describe('App toast wiring', () => {
  test('mounts the toast host for the whole app', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Navbar: true,
          StarModal: true,
          ToastHost: { template: '<div class="toast-host-stub" />' },
          'router-view': true,
        },
      },
    });

    expect(wrapper.find('.toast-host-stub').exists()).toBe(true);
    wrapper.unmount();
  });
});
