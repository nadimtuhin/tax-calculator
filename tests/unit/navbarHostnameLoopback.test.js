/**
 * @jest-environment-options {"url": "http://127.0.0.1/"}
 */
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createMemoryHistory } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import salariesStore from '@/store/salaries';
import breakdownStore from '@/store/breakdown';

// jsdom cannot change window.location.hostname inside a test, so this file sets the URL
// for the whole environment. navbar.test.js covers http://localhost/.
describe('Navbar on 127.0.0.1', () => {
  let wrapper;

  beforeEach(async () => {
    const store = createStore({
      modules: {
        salaries: { ...salariesStore, namespaced: false },
        breakdown: { ...breakdownStore, namespaced: false },
      },
    });
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'Home', component: { template: '<div>Home</div>' } }],
    });
    await router.push('/');
    wrapper = mount(Navbar, { global: { plugins: [store, router] } });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  test('runs on 127.0.0.1', () => {
    expect(window.location.hostname).toBe('127.0.0.1');
  });

  test('isLocalhost is true', () => {
    expect(wrapper.vm.isLocalhost).toBe(true);
  });

  test('shows the star button', () => {
    expect(wrapper.find('.star-btn').exists()).toBe(true);
  });
});
