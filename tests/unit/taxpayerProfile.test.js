import { mount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import TaxpayerProfile from '@/components/TaxpayerProfile.vue';
import salariesStore from '@/store/salaries';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('TaxpayerProfile Component', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        salaries: {
          ...salariesStore,
          namespaced: false
        }
      }
    });
    
    wrapper = mount(TaxpayerProfile, {
      store,
      localVue
    });
  });

  afterEach(() => {
    wrapper.destroy();
  });

  describe('Component Rendering', () => {
    test('should render the component', () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('h2').text()).toBe('Taxpayer Profile');
    });

    test('should render all taxpayer categories', () => {
      const categorySelect = wrapper.find('select[v-model="selectedCategory"]');
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
      const locationSelect = wrapper.find('select[v-model="selectedLocation"]');
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

    test('should calculate correct threshold for different categories', () => {
      // Test general category
      wrapper.setData({ selectedCategory: 'general' });
      expect(wrapper.vm.threshold).toBe(350000);
      
      // Test female category
      wrapper.setData({ selectedCategory: 'female' });
      expect(wrapper.vm.threshold).toBe(400000);
      
      // Test senior category
      wrapper.setData({ selectedCategory: 'senior' });
      expect(wrapper.vm.threshold).toBe(400000);
      
      // Test disabled category
      wrapper.setData({ selectedCategory: 'disabled' });
      expect(wrapper.vm.threshold).toBe(475000);
      
      // Test parent of disabled child
      wrapper.setData({ selectedCategory: 'parent_disabled' });
      expect(wrapper.vm.threshold).toBe(400000); // 350000 + 50000
      
      // Test freedom fighter
      wrapper.setData({ selectedCategory: 'freedom_fighter' });
      expect(wrapper.vm.threshold).toBe(500000);
      
      // Test third gender
      wrapper.setData({ selectedCategory: 'third_gender' });
      expect(wrapper.vm.threshold).toBe(475000);
    });

    test('should calculate correct minimum tax for different locations', () => {
      // Test Dhaka
      wrapper.setData({ selectedLocation: 'dhaka' });
      expect(wrapper.vm.minimumTax).toBe(5000);
      
      // Test Chittagong
      wrapper.setData({ selectedLocation: 'chittagong' });
      expect(wrapper.vm.minimumTax).toBe(5000);
      
      // Test other city corporations
      wrapper.setData({ selectedLocation: 'other_city' });
      expect(wrapper.vm.minimumTax).toBe(4000);
      
      // Test district towns
      wrapper.setData({ selectedLocation: 'district' });
      expect(wrapper.vm.minimumTax).toBe(3000);
    });

    test('should display correct category name', () => {
      wrapper.setData({ selectedCategory: 'female' });
      expect(wrapper.vm.categoryName).toBe('Female');
      
      wrapper.setData({ selectedCategory: 'parent_disabled' });
      expect(wrapper.vm.categoryName).toBe('Parent of Disabled Child');
    });
  });

  describe('User Interactions', () => {
    test('should update store when category changes', async () => {
      const categorySelect = wrapper.find('select[v-model="selectedCategory"]');
      await categorySelect.setValue('female');
      
      const storeProfile = store.state.taxpayerProfile;
      expect(storeProfile.category).toBe('female');
    });

    test('should update store when age changes', async () => {
      const ageInput = wrapper.find('input[type="number"]');
      await ageInput.setValue('35');
      
      const storeProfile = store.state.taxpayerProfile;
      expect(storeProfile.age).toBe(35);
    });

    test('should update store when location changes', async () => {
      const locationSelect = wrapper.find('select[v-model="selectedLocation"]');
      await locationSelect.setValue('chittagong');
      
      const storeProfile = store.state.taxpayerProfile;
      expect(storeProfile.location).toBe('chittagong');
    });

    test('should show senior citizen notice when age is 65 or above', async () => {
      wrapper.setData({ 
        age: 70, 
        selectedCategory: 'general' 
      });
      await wrapper.vm.$nextTick();
      
      const notice = wrapper.find('.age-notice');
      expect(notice.exists()).toBe(true);
      expect(notice.text()).toContain('Note: You qualify for Senior Citizen category');
    });

    test('should not show senior citizen notice when already senior category', async () => {
      wrapper.setData({ 
        age: 70, 
        selectedCategory: 'senior' 
      });
      await wrapper.vm.$nextTick();
      
      const notice = wrapper.find('.age-notice');
      expect(notice.exists()).toBe(false);
    });

    test('should auto-suggest senior citizen category for age 65+', () => {
      wrapper.setData({ 
        age: 65, 
        selectedCategory: 'general' 
      });
      
      wrapper.vm.updateProfile();
      expect(wrapper.vm.selectedCategory).toBe('senior');
    });
  });

  describe('Threshold Display', () => {
    test('should display formatted threshold amount', async () => {
      wrapper.setData({ selectedCategory: 'general' });
      await wrapper.vm.$nextTick();
      
      const thresholdAmount = wrapper.find('.threshold-amount');
      expect(thresholdAmount.text()).toBe('BDT 350,000');
    });

    test('should display formatted minimum tax amount', async () => {
      wrapper.setData({ selectedLocation: 'dhaka' });
      await wrapper.vm.$nextTick();
      
      const minimumTaxValue = wrapper.find('.readonly-value');
      expect(minimumTaxValue.text()).toBe('BDT 5,000');
    });

    test('should update threshold display when category changes', async () => {
      const thresholdAmount = wrapper.find('.threshold-amount');
      
      // Start with general category
      expect(thresholdAmount.text()).toBe('BDT 350,000');
      
      // Change to female category
      wrapper.setData({ selectedCategory: 'female' });
      await wrapper.vm.$nextTick();
      
      expect(thresholdAmount.text()).toBe('BDT 400,000');
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid category gracefully', () => {
      wrapper.setData({ selectedCategory: 'invalid_category' });
      expect(wrapper.vm.threshold).toBe(350000); // Should default to general
      expect(wrapper.vm.categoryName).toBe('General');
    });

    test('should handle invalid location gracefully', () => {
      wrapper.setData({ selectedLocation: 'invalid_location' });
      expect(wrapper.vm.minimumTax).toBe(5000); // Should default to dhaka
    });

    test('should handle edge age values', () => {
      // Test minimum age
      wrapper.setData({ age: 18 });
      expect(wrapper.vm.age).toBe(18);
      
      // Test maximum age
      wrapper.setData({ age: 120 });
      expect(wrapper.vm.age).toBe(120);
    });
  });
});