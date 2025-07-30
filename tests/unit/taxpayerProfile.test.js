import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import TaxpayerProfile from '@/components/TaxpayerProfile.vue';
import salariesStore from '@/store/salaries';

describe('TaxpayerProfile Component', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    store = createStore({
      modules: {
        salaries: {
          ...salariesStore,
          namespaced: false
        }
      }
    });
    
    wrapper = mount(TaxpayerProfile, {
      global: {
        plugins: [store]
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  describe('Component Rendering', () => {
    test('should render the component', () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('h2').text()).toBe('Taxpayer Profile');
    });

    test('should render all taxpayer categories', () => {
      const categorySelects = wrapper.findAll('select');
      const categorySelect = categorySelects.find(select => select.html().includes('General (Male)'));
      const options = categorySelect.findAll('option');
      
      expect(options).toHaveLength(7);
      expect(options.at(0).text()).toBe('General (Male)');
      expect(options.at(1).text()).toBe('Female');
      expect(options.at(2).text()).toBe('Senior Citizen (65+)');
      expect(options.at(3).text()).toBe('Disabled Person');
      expect(options.at(4).text()).toBe('Parent of Disabled Child');
      expect(options.at(5).text()).toBe('War-wounded Freedom Fighter');
      expect(options.at(6).text()).toBe('Third Gender');
    });

    test('should render all location options', () => {
      const locationSelects = wrapper.findAll('select');
      const locationSelect = locationSelects.find(select => select.html().includes('Dhaka City Corporation'));
      const options = locationSelect.findAll('option');
      
      expect(options).toHaveLength(4);
      expect(options.at(0).text()).toBe('Dhaka City Corporation');
      expect(options.at(1).text()).toBe('Chittagong City Corporation');
      expect(options.at(2).text()).toBe('Other City Corporations');
      expect(options.at(3).text()).toBe('District Towns');
    });

    test('should render age input field', () => {
      const ageInput = wrapper.find('input[type="number"]');
      expect(ageInput.exists()).toBe(true);
      expect(ageInput.attributes('min')).toBe('18');
      expect(ageInput.attributes('max')).toBe('120');
    });

    test('should display threshold information', () => {
      const thresholdInfo = wrapper.find('.threshold-info');
      expect(thresholdInfo.exists()).toBe(true);
      expect(thresholdInfo.find('h3').text()).toBe('Your Tax-Free Income Threshold');
    });
  });

  describe('Data Binding and Computed Properties', () => {
    test('should have default values', () => {
      expect(wrapper.vm.age).toBe(30);
      expect(wrapper.vm.selectedCategory).toBe('general');
      expect(wrapper.vm.selectedLocation).toBe('dhaka');
    });

    test('should calculate correct threshold for different categories', async () => {
      // Test general category
      wrapper.vm.selectedCategory = 'general';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.threshold).toBe(350000);
      
      // Test female category
      wrapper.vm.selectedCategory = 'female';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.threshold).toBe(400000);
      
      // Test senior category
      wrapper.vm.selectedCategory = 'senior';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.threshold).toBe(400000);
      
      // Test disabled category
      wrapper.vm.selectedCategory = 'disabled';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.threshold).toBe(475000);
      
      // Test parent of disabled child
      wrapper.vm.selectedCategory = 'parent_disabled';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.threshold).toBe(400000); // 350000 + 50000
      
      // Test freedom fighter
      wrapper.vm.selectedCategory = 'freedom_fighter';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.threshold).toBe(500000);
      
      // Test third gender
      wrapper.vm.selectedCategory = 'third_gender';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.threshold).toBe(475000);
    });

    test('should calculate correct minimum tax for different locations', async () => {
      // Test Dhaka
      wrapper.vm.selectedLocation = 'dhaka';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.minimumTax).toBe(5000);
      
      // Test Chittagong
      wrapper.vm.selectedLocation = 'chittagong';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.minimumTax).toBe(5000);
      
      // Test other city corporations
      wrapper.vm.selectedLocation = 'other_city';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.minimumTax).toBe(4000);
      
      // Test district towns
      wrapper.vm.selectedLocation = 'district';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.minimumTax).toBe(3000);
    });

    test('should display correct category name', async () => {
      wrapper.vm.selectedCategory = 'female';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.categoryName).toBe('Female');
      
      wrapper.vm.selectedCategory = 'parent_disabled';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.categoryName).toBe('Parent of Disabled Child');
    });
  });

  describe('User Interactions', () => {
    test('should update store when category changes', async () => {
      const categorySelects = wrapper.findAll('select');
      const categorySelect = categorySelects.find(select => select.html().includes('General (Male)'));
      await categorySelect.setValue('female');
      
      const storeProfile = store.state.salaries.taxpayerProfile;
      expect(storeProfile.category).toBe('female');
    });

    test('should update store when age changes', async () => {
      const ageInput = wrapper.find('input[type="number"]');
      await ageInput.setValue('35');
      
      const storeProfile = store.state.salaries.taxpayerProfile;
      expect(storeProfile.age).toBe(35);
    });

    test('should update store when location changes', async () => {
      const locationSelects = wrapper.findAll('select');
      const locationSelect = locationSelects.find(select => select.html().includes('Dhaka City Corporation'));
      await locationSelect.setValue('chittagong');
      
      const storeProfile = store.state.salaries.taxpayerProfile;
      expect(storeProfile.location).toBe('chittagong');
    });

    test('should show senior citizen notice when age is 65 or above', async () => {
      wrapper.vm.age = 70;
      wrapper.vm.selectedCategory = 'general';
      await wrapper.vm.$nextTick();
      
      const notice = wrapper.find('.age-notice');
      expect(notice.exists()).toBe(true);
      expect(notice.text()).toContain('Note: You qualify for Senior Citizen category');
    });

    test('should not show senior citizen notice when already senior category', async () => {
      wrapper.vm.age = 70;
      wrapper.vm.selectedCategory = 'senior';
      await wrapper.vm.$nextTick();
      
      const notice = wrapper.find('.age-notice');
      expect(notice.exists()).toBe(false);
    });

    test('should auto-suggest senior citizen category for age 65+', async () => {
      wrapper.vm.age = 65;
      wrapper.vm.selectedCategory = 'general';
      await wrapper.vm.$nextTick();
      
      wrapper.vm.updateProfile();
      expect(wrapper.vm.selectedCategory).toBe('senior');
    });
  });

  describe('Threshold Display', () => {
    test('should display formatted threshold amount', async () => {
      wrapper.vm.selectedCategory = 'general';
      await wrapper.vm.$nextTick();
      
      const thresholdAmount = wrapper.find('.threshold-amount');
      expect(thresholdAmount.text()).toBe('BDT 350,000');
    });

    test('should display formatted minimum tax amount', async () => {
      wrapper.vm.selectedLocation = 'dhaka';
      await wrapper.vm.$nextTick();
      
      const minimumTaxValue = wrapper.find('.readonly-value');
      expect(minimumTaxValue.text()).toBe('BDT 5,000');
    });

    test('should update threshold display when category changes', async () => {
      const thresholdAmount = wrapper.find('.threshold-amount');
      
      // Start with general category
      expect(thresholdAmount.text()).toBe('BDT 350,000');
      
      // Change to female category
      wrapper.vm.selectedCategory = 'female';
      await wrapper.vm.$nextTick();
      
      expect(thresholdAmount.text()).toBe('BDT 400,000');
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid category gracefully', async () => {
      wrapper.vm.selectedCategory = 'invalid_category';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.threshold).toBe(350000); // Should default to general
      expect(wrapper.vm.categoryName).toBe('General');
    });

    test('should handle invalid location gracefully', async () => {
      wrapper.vm.selectedLocation = 'invalid_location';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.minimumTax).toBe(5000); // Should default to dhaka
    });

    test('should handle edge age values', async () => {
      // Test minimum age
      wrapper.vm.age = 18;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.age).toBe(18);
      
      // Test maximum age
      wrapper.vm.age = 120;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.age).toBe(120);
    });
  });
});