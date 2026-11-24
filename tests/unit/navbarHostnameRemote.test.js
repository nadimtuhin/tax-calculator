/**
 * @jest-environment-options {"url": "http://tax.nadimtuhin.com/"}
 */
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createMemoryHistory } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import salariesStore from '@/store/salaries';
import breakdownStore from '@/store/breakdown';

// jsdom cannot change window.location.hostname inside a test, so this file sets the URL
// for the whole environment. navbar.test.js covers http://localhost/.
describe('Navbar on tax.nadimtuhin.com', () => {
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

  test('runs on tax.nadimtuhin.com', () => {
    expect(window.location.hostname).toBe('tax.nadimtuhin.com');
  });

  test('isLocalhost is false', () => {
    expect(wrapper.vm.isLocalhost).toBe(false);
  });

  test('hides the star button', () => {
    expect(wrapper.find('.star-btn').exists()).toBe(false);
  });
});
