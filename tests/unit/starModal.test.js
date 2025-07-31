import { mount } from '@vue/test-utils';
import StarModal from '@/components/StarModal.vue';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Store the original localStorage
const originalLocalStorage = global.localStorage;

// Override localStorage globally
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});
global.localStorage = localStorageMock;

// Mock console methods
global.console.warn = jest.fn();

describe('StarModal Component', () => {
  let wrapper;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    
    // Clear any existing timers
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Mock DOM methods
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();
    
    // Clear window properties
    delete window.showStarModal;
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
      wrapper = mount(StarModal);
    });

    test('should render the component', () => {
      expect(wrapper.exists()).toBe(true);
    });

    test('should initially hide the modal', () => {
      expect(wrapper.vm.showModal).toBe(false);
      expect(wrapper.find('.star-modal-overlay').exists()).toBe(true);
      expect(wrapper.find('.star-modal-overlay').isVisible()).toBe(false);
    });

    test('should render modal content when shown', async () => {
      wrapper.vm.showModal = true;
      await wrapper.vm.$nextTick();

      const modal = wrapper.find('.star-modal');
      expect(modal.exists()).toBe(true);
      expect(modal.isVisible()).toBe(true);
      
      expect(wrapper.text()).toContain('Enjoying the Bangladesh Tax Calculator?');
      expect(wrapper.text()).toContain('Star on GitHub');
      expect(wrapper.text()).toContain('Maybe Later');
      expect(wrapper.text()).toContain("Don't Show Again");
    });

    test('should render close button', async () => {
      wrapper.vm.showModal = true;
      await wrapper.vm.$nextTick();

      const closeBtn = wrapper.find('.close-btn');
      expect(closeBtn.exists()).toBe(true);
      expect(closeBtn.text()).toBe('×');
    });

    test('should render GitHub link with correct attributes', async () => {
      wrapper.vm.showModal = true;
      await wrapper.vm.$nextTick();

      const githubLink = wrapper.find('.star-btn');
      expect(githubLink.exists()).toBe(true);
      expect(githubLink.attributes('href')).toBe('https://github.com/nadimtuhin/tax-calculator');
      expect(githubLink.attributes('target')).toBe('_blank');
      expect(githubLink.attributes('rel')).toBe('noopener noreferrer');
    });

    test('should render star icon and GitHub icon', async () => {
      wrapper.vm.showModal = true;
      await wrapper.vm.$nextTick();

      const starIcon = wrapper.find('.star-icon');
      expect(starIcon.exists()).toBe(true);
      expect(starIcon.text()).toBe('⭐');

      const githubIcon = wrapper.find('.github-icon');
      expect(githubIcon.exists()).toBe(true);
    });
  });

  describe('Component Lifecycle', () => {
    test('should set up event listeners on mount', () => {
      wrapper = mount(StarModal);
      
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', wrapper.vm.handleKeydown);
      expect(window.showStarModal).toBe(wrapper.vm.forceShow);
    });

    test('should remove event listeners on unmount', () => {
      wrapper = mount(StarModal);
      const handleKeydown = wrapper.vm.handleKeydown;
      
      wrapper.unmount();
      
      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', handleKeydown);
      expect(window.showStarModal).toBeUndefined();
    });

    test('should not remove global reference if it has been overridden', () => {
      wrapper = mount(StarModal);
      window.showStarModal = jest.fn(); // Override with different function
      
      wrapper.unmount();
      
      expect(window.showStarModal).toBeDefined();
      expect(window.showStarModal).not.toBe(wrapper.vm.forceShow);
    });
  });

  describe('Modal Display Logic', () => {
    test('should show modal on first visit after delay', async () => {
      localStorageMock.getItem.mockReturnValue(null); // No previous visits
      
      wrapper = mount(StarModal);
      
      expect(wrapper.vm.showModal).toBe(false);
      
      // Fast-forward timers
      jest.advanceTimersByTime(1500);
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.showModal).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('tax-calculator-visited', 'true');
    });

    test('should not show modal if user chose never show again', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'tax-calculator-never-star') return 'true';
        return null;
      });
      
      wrapper = mount(StarModal);
      
      jest.advanceTimersByTime(2000);
      
      expect(wrapper.vm.showModal).toBe(false);
    });

    test('should not show modal if user already starred', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'tax-calculator-starred') return 'true';
        return null;
      });
      
      wrapper = mount(StarModal);
      
      jest.advanceTimersByTime(2000);
      
      expect(wrapper.vm.showModal).toBe(false);
    });

    test('should show modal again after 7 days if reminded later', async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'tax-calculator-visited') return 'true';
        if (key === 'tax-calculator-star-reminded') return sevenDaysAgo.toISOString();
        return null;
      });
      
      wrapper = mount(StarModal);
      
      jest.advanceTimersByTime(1000);
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.showModal).toBe(true);
    });

    test('should not show modal if reminded less than 7 days ago', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'tax-calculator-visited') return 'true';
        if (key === 'tax-calculator-star-reminded') return threeDaysAgo.toISOString();
        return null;
      });
      
      wrapper = mount(StarModal);
      
      jest.advanceTimersByTime(2000);
      
      expect(wrapper.vm.showModal).toBe(false);
    });

    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage.getItem to throw an error
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      wrapper = mount(StarModal);
      
      expect(console.warn).toHaveBeenCalledWith('StarModal: localStorage not available');
      expect(wrapper.vm.showModal).toBe(false);
    });
  });

  describe('Modal Interaction', () => {
    beforeEach(() => {
      wrapper = mount(StarModal);
      wrapper.vm.showModal = true;
    });

    test('should close modal when close button is clicked', async () => {
      const closeBtn = wrapper.find('.close-btn');
      await closeBtn.trigger('click');
      
      expect(wrapper.vm.showModal).toBe(false);
    });

    test('should close modal when overlay is clicked', async () => {
      const overlay = wrapper.find('.star-modal-overlay');
      await overlay.trigger('click');
      
      expect(wrapper.vm.showModal).toBe(false);
    });

    test('should not close modal when modal content is clicked', async () => {
      const modal = wrapper.find('.star-modal');
      await modal.trigger('click');
      
      expect(wrapper.vm.showModal).toBe(true);
    });

    test('should close modal on Escape key press', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      wrapper.vm.handleKeydown(event);
      
      expect(wrapper.vm.showModal).toBe(false);
    });

    test('should not close modal on other key press', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      wrapper.vm.handleKeydown(event);
      
      expect(wrapper.vm.showModal).toBe(true);
    });

    test('should not handle keydown when modal is not shown', () => {
      wrapper.vm.showModal = false;
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      wrapper.vm.handleKeydown(event);
      
      // Should remain false (not change)
      expect(wrapper.vm.showModal).toBe(false);
    });
  });

  describe('Button Actions', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
      wrapper = mount(StarModal);
      wrapper.vm.showModal = true;
    });

    test('should handle star button click', async () => {
      const starBtn = wrapper.find('.star-btn');
      await starBtn.trigger('click');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('tax-calculator-starred', 'true');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tax-calculator-star-reminded');
      expect(wrapper.vm.showModal).toBe(false);
    });

    test('should handle maybe later button click', async () => {
      const laterBtn = wrapper.find('.later-btn');
      await laterBtn.trigger('click');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tax-calculator-star-reminded', 
        expect.any(String)
      );
      expect(wrapper.vm.showModal).toBe(false);
    });

    test('should handle never show button click', async () => {
      const neverBtn = wrapper.find('.never-btn');
      await neverBtn.trigger('click');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('tax-calculator-never-star', 'true');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tax-calculator-star-reminded');
      expect(wrapper.vm.showModal).toBe(false);
    });
  });

  describe('Debug Functionality', () => {
    test('should not show debug panel by default', () => {
      wrapper = mount(StarModal);
      
      expect(wrapper.vm.debugMode).toBe(false);
      expect(wrapper.find('[style*="position: fixed"]').exists()).toBe(false);
    });

    test('should show debug panel when debugMode is true', async () => {
      wrapper = mount(StarModal);
      wrapper.vm.debugMode = true;
      await wrapper.vm.$nextTick();
      
      const debugPanel = wrapper.find('[style*="position: fixed"]');
      expect(debugPanel.exists()).toBe(true);
      expect(debugPanel.text()).toContain('Debug: showModal = false');
    });

    test('should force show modal when debug button is clicked', async () => {
      wrapper = mount(StarModal);
      wrapper.vm.debugMode = true;
      await wrapper.vm.$nextTick();
      
      const showBtn = wrapper.findAll('button').find(btn => 
        btn.text() === 'Show Modal'
      );
      
      await showBtn.trigger('click');
      
      expect(wrapper.vm.showModal).toBe(true);
    });

    test('should clear modal data when debug clear button is clicked', async () => {
      wrapper = mount(StarModal);
      wrapper.vm.debugMode = true;
      await wrapper.vm.$nextTick();
      
      const clearBtn = wrapper.findAll('button').find(btn => 
        btn.text() === 'Clear Data'
      );
      
      await clearBtn.trigger('click');
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tax-calculator-visited');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tax-calculator-never-star');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tax-calculator-star-reminded');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tax-calculator-starred');
    });
  });

  describe('Component Methods', () => {
    beforeEach(() => {
      wrapper = mount(StarModal);
    });

    test('should have all required methods', () => {
      expect(typeof wrapper.vm.forceShow).toBe('function');
      expect(typeof wrapper.vm.clearModalData).toBe('function');
      expect(typeof wrapper.vm.checkIfShouldShow).toBe('function');
      expect(typeof wrapper.vm.closeModal).toBe('function');
      expect(typeof wrapper.vm.handleKeydown).toBe('function');
      expect(typeof wrapper.vm.handleStarClick).toBe('function');
      expect(typeof wrapper.vm.remindLater).toBe('function');
      expect(typeof wrapper.vm.neverShow).toBe('function');
    });

    test('forceShow should show modal', () => {
      wrapper.vm.forceShow();
      expect(wrapper.vm.showModal).toBe(true);
    });

    test('closeModal should hide modal', () => {
      wrapper.vm.showModal = true;
      wrapper.vm.closeModal();
      expect(wrapper.vm.showModal).toBe(false);
    });

    test('clearModalData should remove all localStorage items', () => {
      wrapper.vm.clearModalData();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tax-calculator-visited');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tax-calculator-never-star');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tax-calculator-star-reminded');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tax-calculator-starred');
    });

    test('handleStarClick should mark as starred and close modal', () => {
      wrapper.vm.showModal = true;
      wrapper.vm.handleStarClick();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('tax-calculator-starred', 'true');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tax-calculator-star-reminded');
      expect(wrapper.vm.showModal).toBe(false);
    });

    test('remindLater should set reminder date and close modal', () => {
      wrapper.vm.showModal = true;
      wrapper.vm.remindLater();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tax-calculator-star-reminded',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      );
      expect(wrapper.vm.showModal).toBe(false);
    });

    test('neverShow should mark as never show and close modal', () => {
      wrapper.vm.showModal = true;
      wrapper.vm.neverShow();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('tax-calculator-never-star', 'true');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tax-calculator-star-reminded');
      expect(wrapper.vm.showModal).toBe(false);
    });
  });

  describe('Global Window Function', () => {
    test('should expose forceShow as window.showStarModal', () => {
      wrapper = mount(StarModal);
      
      expect(window.showStarModal).toBe(wrapper.vm.forceShow);
    });

    test('should work when called from window', () => {
      wrapper = mount(StarModal);
      
      expect(wrapper.vm.showModal).toBe(false);
      
      window.showStarModal();
      
      expect(wrapper.vm.showModal).toBe(true);
    });
  });

  describe('Data Properties', () => {
    test('should have correct initial data', () => {
      wrapper = mount(StarModal);
      
      expect(wrapper.vm.showModal).toBe(false);
      expect(wrapper.vm.debugMode).toBe(false);
    });
  });

  describe('Date Calculations', () => {
    test('should correctly calculate days difference for reminder', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'tax-calculator-visited') return 'true';
        if (key === 'tax-calculator-star-reminded') return tenDaysAgo.toISOString();
        return null;
      });
      
      wrapper = mount(StarModal);
      
      jest.advanceTimersByTime(1000);
      
      expect(wrapper.vm.showModal).toBe(true);
    });

    test('should handle invalid date in localStorage', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'tax-calculator-visited') return 'true';
        if (key === 'tax-calculator-star-reminded') return 'invalid-date';
        return null;
      });
      
      wrapper = mount(StarModal);
      
      jest.advanceTimersByTime(2000);
      
      // Should not crash, and modal should not show due to invalid date
      expect(wrapper.vm.showModal).toBe(false);
    });
  });

  describe('Accessibility', () => {
    test('should support keyboard navigation', async () => {
      wrapper = mount(StarModal);
      wrapper.vm.showModal = true;
      await wrapper.vm.$nextTick();

      // Test that buttons can receive focus
      const starBtn = wrapper.find('.star-btn');
      const laterBtn = wrapper.find('.later-btn');
      const neverBtn = wrapper.find('.never-btn');
      const closeBtn = wrapper.find('.close-btn');

      expect(starBtn.exists()).toBe(true);
      expect(laterBtn.exists()).toBe(true);
      expect(neverBtn.exists()).toBe(true);
      expect(closeBtn.exists()).toBe(true);
    });

    test('should close on Escape key for accessibility', () => {
      wrapper = mount(StarModal);
      wrapper.vm.showModal = true;

      const escapeEvent = { key: 'Escape' };
      wrapper.vm.handleKeydown(escapeEvent);

      expect(wrapper.vm.showModal).toBe(false);
    });
  });
});