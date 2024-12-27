const state = {
  location: 'dhaka_chittagong',
  gender: 'male',
  isDisabled: false,
  isFreedomFighter: false,
  isThirdGender: false,
  isSeniorCitizen: false,
  fiscalYear: '2023-2024'
};

const stateDefault = JSON.parse(JSON.stringify(state));

const mutations = {
  resetPersonalInfo(state) {
    Object.assign(state, stateDefault);
  },
  loadPersonalInfo(state, personalInfo) {
    Object.assign(state, personalInfo);
  },
  setPersonalInfo(state, personalInfo) {
    Object.assign(state, personalInfo);
  },
  setLocation(state, location) {
    state.location = location;
  },
  setGender(state, gender) {
    state.gender = gender;
  },
  setDisabled(state, isDisabled) {
    state.isDisabled = isDisabled;
  },
  setFreedomFighter(state, isFreedomFighter) {
    state.isFreedomFighter = isFreedomFighter;
  },
  setSeniorCitizen(state, isSeniorCitizen) {
    state.isSeniorCitizen = isSeniorCitizen;
  },
  setFiscalYear(state, year) {
    state.fiscalYear = year;
    // Update the months array in salaries store
    const [startYear, endYear] = year.split('-');
    const months = [
      { id: `July '${startYear.slice(2)}`,  ...monthlyDefault() },
      { id: `Aug '${startYear.slice(2)}`,  ...monthlyDefault() },
      { id: `Sep '${startYear.slice(2)}`,  ...monthlyDefault() },
      { id: `Oct '${startYear.slice(2)}`,  ...monthlyDefault() },
      { id: `Nov '${startYear.slice(2)}`,  ...monthlyDefault() },
      { id: `Dec '${startYear.slice(2)}`,  ...monthlyDefault() },
      { id: `Jan '${endYear}`,  ...monthlyDefault() },
      { id: `Feb '${endYear}`,  ...monthlyDefault() },
      { id: `Mar '${endYear}`,  ...monthlyDefault() },
      { id: `Apr '${endYear}`,  ...monthlyDefault() },
      { id: `May '${endYear}`,  ...monthlyDefault() },
      { id: `June '${endYear}`,  ...monthlyDefault() },
    ];
    this.commit('loadSalaries', months);
  }
};

const getters = {
  personalInfo: state => state,
  location: state => state.location,
  gender: state => state.gender,
  isDisabled: state => state.isDisabled,
  isFreedomFighter: state => state.isFreedomFighter,
  isSeniorCitizen: state => state.isSeniorCitizen,
  isThirdGender: state => state.gender === 'third',
  fiscalYear: state => state.fiscalYear,
  taxFreeSlab: (state) => {
    if (state.isFreedomFighter) return 500000; // 5 lakh
    if (state.isDisabled || state.isThirdGender) return 475000; // 4.75 lakh
    if (state.gender === 'female' || state.isSeniorCitizen) return 400000; // 4 lakh
    return 350000; // 3.5 lakh (general category)
  },
  minimumTax: (state) => {
    switch (state.location) {
      case 'dhaka_chittagong':
        return 5000;
      case 'other_city':
        return 4000;
      case 'other_areas':
        return 3000;
      default:
        return 5000; // Default to highest rate
    }
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  getters
};
