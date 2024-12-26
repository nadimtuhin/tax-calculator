const state = {
  age: 30,
  gender: 'male',
  isDisabled: false,
  isFreedomFighter: false,
  isThirdGender: false
};

const mutations = {
  setPersonalInfo(state, personalInfo) {
    Object.assign(state, personalInfo);
  },
  setAge(state, age) {
    state.age = age;
  },
  setGender(state, gender) {
    state.gender = gender;
  },
  setDisabled(state, isDisabled) {
    state.isDisabled = isDisabled;
  },
  setFreedomFighter(state, isFreedomFighter) {
    state.isFreedomFighter = isFreedomFighter;
  }
};

const getters = {
  personalInfo: state => state,
  age: state => state.age,
  gender: state => state.gender,
  isDisabled: state => state.isDisabled,
  isFreedomFighter: state => state.isFreedomFighter,
  isThirdGender: state => state.gender === 'third',
  taxFreeSlab: (state) => {
    if (state.isFreedomFighter) return 500000; // 5 lakh
    if (state.isDisabled || state.isThirdGender) return 475000; // 4.75 lakh
    if (state.gender === 'female' || state.age >= 65) return 400000; // 4 lakh
    return 350000; // 3.5 lakh (general category)
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  getters
};
