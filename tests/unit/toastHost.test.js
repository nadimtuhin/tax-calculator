import { mount } from '@vue/test-utils';
import App from '@/App.vue';
import ToastHost from '@/components/ToastHost.vue';
import { clearToasts, showToast, toastState } from '@/utils/toast';

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
    document.body.innerHTML = '';
  });

  function mountHost() {
    wrapper = mount(ToastHost, { attachTo: document.body });
    return wrapper;
  }

  test('renders the message as text and does not block the page', async () => {
    mountHost();
    showToast('Random data populated! 🎲', { variant: 'success', duration: 0 });
    await wrapper.vm.$nextTick();

    const toast = wrapper.find('.toast');
    expect(toast.exists()).toBe(true);
    expect(toast.text()).toContain('Random data populated! 🎲');
    expect(toast.find('[role="status"]').exists()).toBe(true);
    expect(wrapper.find('[aria-modal="true"]').exists()).toBe(false);
    expect(wrapper.find('.toast-viewport').exists()).toBe(true);
    expect(toast.html()).not.toContain('<script');
  });

  test('uses an alert role for errors', async () => {
    mountHost();
    showToast('Error importing data. Please check the file format.', { variant: 'error', duration: 0 });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[role="alert"]').text()).toContain('Error importing data. Please check the file format.');
  });

  test('dismisses from the close button', async () => {
    mountHost();
    showToast('All data has been reset!', { duration: 0 });
    await wrapper.vm.$nextTick();

    await wrapper.find('[aria-label="Dismiss notification"]').trigger('click');

    expect(toastState.items).toHaveLength(0);
    expect(wrapper.find('.toast').exists()).toBe(false);
  });

  test('Escape closes the newest toast and leaves older ones', async () => {
    mountHost();
    showToast('Older', { duration: 0 });
    showToast('Newer', { duration: 0 });
    await wrapper.vm.$nextTick();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(toastState.items.map((item) => item.message)).toEqual(['Older']);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await wrapper.vm.$nextTick();
    expect(toastState.items).toHaveLength(1);
  });

  test('runs an action and then dismisses the toast', async () => {
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
