import { mount } from '@vue/test-utils';
import Disclosure from '../../src/components/Disclosure.vue';

const KEY = 'tax-calculator-ui-open';
const make = (props = {}) =>
  mount(Disclosure, { props: { id: 'x', title: 'Extra', ...props }, slots: { default: '<input id="in" />' } });

describe('Disclosure', () => {
  beforeEach(() => localStorage.clear());

  it('starts collapsed but keeps its content in the DOM', () => {
    const w = make();
    const btn = w.get('button');
    expect(btn.attributes('aria-expanded')).toBe('false');
    expect(w.find('#in').exists()).toBe(true);
    expect(btn.attributes('aria-controls')).toBe(w.get('.disclosure-panel').attributes('id'));
  });

  it('toggles and persists its open state', async () => {
    const w = make();
    await w.get('button').trigger('click');
    expect(w.get('button').attributes('aria-expanded')).toBe('true');
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual(['x']);
  });

  it('opens when forced and stays open after the data is cleared', async () => {
    const w = make({ forceOpen: true });
    expect(w.get('button').attributes('aria-expanded')).toBe('true');
    await w.setProps({ forceOpen: false });
    expect(w.get('button').attributes('aria-expanded')).toBe('true');
    await w.get('button').trigger('click');
    expect(w.get('button').attributes('aria-expanded')).toBe('false');
  });

  it('honours the "all" value and survives malformed storage', () => {
    localStorage.setItem(KEY, 'all');
    expect(make().get('button').attributes('aria-expanded')).toBe('true');
    localStorage.setItem(KEY, 'null');
    expect(make().get('button').attributes('aria-expanded')).toBe('false');
    localStorage.setItem(KEY, '{}');
    expect(make().get('button').attributes('aria-expanded')).toBe('false');
  });
});
