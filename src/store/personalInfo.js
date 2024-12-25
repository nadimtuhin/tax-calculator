const state = {
  age: 30,
  gender: 'male',
  isDisabled: false,
  isFreedomFighter: false
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
  isFreedomFighter: state => state.isFreedomFighter
};

export default {
  namespaced: true,
  state,
  mutations,
  getters
};
