const state = {
  location: 'dhaka_chittagong',
  gender: 'male',
  isDisabled: false,
  isFreedomFighter: false,
  isThirdGender: false,
  isSeniorCitizen: false
};

const mutations = {
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
